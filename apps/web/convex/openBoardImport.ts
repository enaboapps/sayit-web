import { v } from 'convex/values';
import { mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { getUserIdentity } from './users';
import { FIXED_GRID_LAYOUT_VERSION } from './aacLayout';
import { MAX_IMPORT_BOARDS, MAX_IMPORT_TILES } from './openBoardLimits';

// How many boards we cascade-delete per scheduled tick. Convex mutations have
// a soft transaction-size limit; chunking keeps each tick well below it
// regardless of package size.
const SWEEP_BATCH_BOARDS = 25;

const phraseTileValidator = v.object({
  kind: v.literal('phrase'),
  text: v.string(),
  position: v.number(),
  cellRow: v.number(),
  cellColumn: v.number(),
  symbolStorageId: v.optional(v.id('_storage')),
});

const navigateTileValidator = v.object({
  kind: v.literal('navigate'),
  label: v.string(),
  position: v.number(),
  cellRow: v.number(),
  cellColumn: v.number(),
  targetSourceId: v.string(),
});

function validateGrid(rows: number, columns: number) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows <= 0 || columns <= 0) {
    throw new Error('Imported boards must have positive integer grid dimensions');
  }
}

export const importBoards = mutation({
  args: {
    packageName: v.string(),
    boards: v.array(v.object({
      sourceId: v.string(),
      name: v.string(),
      gridRows: v.number(),
      gridColumns: v.number(),
      tiles: v.array(v.union(phraseTileValidator, navigateTileValidator)),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    if (args.boards.length === 0) {
      throw new Error('Import package does not contain any boards');
    }
    if (args.boards.length > MAX_IMPORT_BOARDS) {
      throw new Error(`Import package contains more than ${MAX_IMPORT_BOARDS} boards`);
    }

    const tileCount = args.boards.reduce((total, board) => total + board.tiles.length, 0);
    if (tileCount > MAX_IMPORT_TILES) {
      throw new Error(`Import package contains more than ${MAX_IMPORT_TILES} tiles`);
    }

    const seenSourceIds = new Set<string>();
    for (const board of args.boards) {
      if (seenSourceIds.has(board.sourceId)) {
        throw new Error(`Import package contains duplicate board id "${board.sourceId}"`);
      }
      seenSourceIds.add(board.sourceId);
    }

    // Conflict pre-flight: if any source ID in this package matches an
    // already-imported board for the same user, refuse the whole import.
    // Real-world AAC tools generate distinctive page IDs (UUID-like or
    // package-prefixed strings), so a single match strongly indicates the
    // same vocabulary is already imported. False positives are theoretically
    // possible across unrelated OBFs sharing a generic ID like "1" — we
    // accept that risk because the recovery is one-click ("Delete imported
    // package" in Settings).
    const sourceIds = args.boards.map((board) => board.sourceId);
    for (const sourceId of sourceIds) {
      const existing = await ctx.db
        .query('phraseBoards')
        .withIndex('by_user_and_source', (q) =>
          q.eq('userId', identity.subject).eq('importSourceId', sourceId)
        )
        .first();
      if (existing) {
        const conflictingPackage = existing.importPackageId
          ? await ctx.db.get(existing.importPackageId)
          : null;
        const packageLabel = conflictingPackage?.name ?? 'an existing import';
        throw new Error(
          `Boards from ${packageLabel} are already imported. Delete them from Settings → Imported AAC vocabularies first.`
        );
      }
    }

    const existingBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    // Pre-compute the set of source IDs that some other board navigates to.
    // Boards in this set are drill-downs (e.g. CommuniKate's "Food", "People"
    // sub-pages reached from "CommuniKate Top Page"); we hide them from the
    // picker by default so importing a 96-board AAC vocabulary doesn't
    // explode the user's board list. They remain reachable via navigate tiles
    // and toggleable from the edit-board UI.
    const navTargetSourceIds = new Set<string>();
    for (const board of args.boards) {
      for (const tile of board.tiles) {
        if (tile.kind === 'navigate' && tile.targetSourceId !== board.sourceId) {
          navTargetSourceIds.add(tile.targetSourceId);
        }
      }
    }

    // Create the package row up front so each board can reference it by id.
    const packageId = await ctx.db.insert('importedPackages', {
      userId: identity.subject,
      name: args.packageName.trim() || 'Imported AAC vocabulary',
      importedAt: Date.now(),
      boardCount: args.boards.length,
    });

    const sourceIdToBoardId = new Map<string, Id<'phraseBoards'>>();
    const importedBoardIds: Id<'phraseBoards'>[] = [];

    for (let index = 0; index < args.boards.length; index += 1) {
      const board = args.boards[index];
      validateGrid(board.gridRows, board.gridColumns);

      const boardId = await ctx.db.insert('phraseBoards', {
        userId: identity.subject,
        name: board.name.trim() || 'Imported Board',
        position: existingBoards.length + index,
        layoutMode: 'fixedGrid',
        gridRows: board.gridRows,
        gridColumns: board.gridColumns,
        layoutVersion: FIXED_GRID_LAYOUT_VERSION,
        hiddenFromPicker: navTargetSourceIds.has(board.sourceId) ? true : undefined,
        importPackageId: packageId,
        importSourceId: board.sourceId,
      });

      sourceIdToBoardId.set(board.sourceId, boardId);
      importedBoardIds.push(boardId);
    }

    // Validate every tile up front so we fail before mutating anything;
    // the cell-collision and bounds checks are cheap and let us batch the
    // inserts below with Promise.all without worrying about partial state.
    for (const board of args.boards) {
      const occupiedCells = new Set<string>();
      for (const tile of board.tiles) {
        if (!Number.isInteger(tile.cellRow) || !Number.isInteger(tile.cellColumn)) {
          throw new Error('Imported tile cell coordinates must be integers');
        }
        if (
          tile.cellRow < 0 ||
          tile.cellColumn < 0 ||
          tile.cellRow >= board.gridRows ||
          tile.cellColumn >= board.gridColumns
        ) {
          throw new Error('Imported tile cell coordinates are outside the board grid');
        }
        const cellKey = `${tile.cellRow}:${tile.cellColumn}`;
        if (occupiedCells.has(cellKey)) {
          throw new Error('Import contains multiple tiles in the same grid cell');
        }
        occupiedCells.add(cellKey);
      }
    }

    // Insert tiles in parallel per-board. Convex mutations are atomic so
    // concurrent ctx.db.insert calls within a single mutation are safe;
    // sequential awaits were the prior cost per imported tile (e.g. 150
    // boards x dozens of tiles each made the import noticeably slow).
    await Promise.all(args.boards.map(async (board) => {
      const boardId = sourceIdToBoardId.get(board.sourceId);
      if (!boardId) return;

      await Promise.all(board.tiles.map(async (tile) => {
        if (tile.kind === 'phrase') {
          const text = tile.text.trim();
          if (!text) return;

          const symbolUrl = tile.symbolStorageId
            ? await ctx.storage.getUrl(tile.symbolStorageId)
            : null;
          const phraseId = await ctx.db.insert('phrases', {
            userId: identity.subject,
            text,
            frequency: 0,
            position: tile.position,
            symbolStorageId: tile.symbolStorageId,
            symbolUrl: symbolUrl ?? undefined,
          });

          await ctx.db.insert('boardTiles', {
            boardId,
            position: tile.position,
            kind: 'phrase',
            phraseId,
            cellRow: tile.cellRow,
            cellColumn: tile.cellColumn,
            cellRowSpan: 1,
            cellColumnSpan: 1,
            tileRole: 'fringe',
            isLocked: false,
          });
          return;
        }

        const targetBoardId = sourceIdToBoardId.get(tile.targetSourceId);
        if (!targetBoardId || targetBoardId === boardId) return;

        await ctx.db.insert('boardTiles', {
          boardId,
          position: tile.position,
          kind: 'navigate',
          targetBoardId,
          cellRow: tile.cellRow,
          cellColumn: tile.cellColumn,
          cellRowSpan: 1,
          cellColumnSpan: 1,
          tileRole: 'navigation',
          isLocked: false,
        });
      }));
    }));

    return {
      importedBoardIds,
      packageId,
    };
  },
});

// Mutation: tear down an imported AAC package. The user-facing call flips
// pendingDelete on the package row and every board that belongs to it so the
// UI immediately stops rendering them, then schedules an internal action to
// chunk through the actual cascade (tiles → phrases → storage objects →
// boards → package row). Deleting in the foreground would risk hitting
// Convex's per-mutation transaction-size limit on a 96-board package.
export const deleteImportedPackage = mutation({
  args: { packageId: v.id('importedPackages') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const pkg = await ctx.db.get(args.packageId);
    if (!pkg || pkg.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }
    if (pkg.pendingDelete) {
      // Idempotent: a second click while the sweep is still running shouldn't
      // explode. The original schedule is still in flight.
      return;
    }

    await ctx.db.patch(args.packageId, { pendingDelete: true });

    const boards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_import_package', (q) => q.eq('importPackageId', args.packageId))
      .collect();
    await Promise.all(boards.map((board) =>
      ctx.db.patch(board._id, { pendingDelete: true })
    ));

    await ctx.scheduler.runAfter(
      0,
      internal.openBoardImport.sweepDeletedPackage,
      { packageId: args.packageId }
    );
  },
});

// Internal mutation: cascade-delete one batch of boards belonging to a
// pending-delete package, then re-schedule itself if more remain. Each tick
// stays well under Convex's transaction-size limit; CommuniKate's 96 boards
// finish in roughly 4 ticks.
export const sweepDeletedPackage = internalMutation({
  args: { packageId: v.id('importedPackages') },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) return; // Already gone — nothing to do.

    const remainingBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_import_package', (q) => q.eq('importPackageId', args.packageId))
      .take(SWEEP_BATCH_BOARDS);

    if (remainingBoards.length === 0) {
      // Final tick: everything cascaded; remove the package row itself.
      await ctx.db.delete(args.packageId);
      return;
    }

    for (const board of remainingBoards) {
      await deleteBoardCascade(ctx, board);
    }

    // More to do — schedule the next tick. runAfter(0) yields between ticks
    // so we don't hold the transaction lock for more than one batch.
    await ctx.scheduler.runAfter(
      0,
      internal.openBoardImport.sweepDeletedPackage,
      { packageId: args.packageId }
    );
  },
});

// Cascade delete one board and everything it owns: tiles → phrases (and
// their backing storage objects) → board row.
async function deleteBoardCascade(
  ctx: { db: import('./_generated/server').MutationCtx['db']; storage: import('./_generated/server').MutationCtx['storage'] },
  board: Doc<'phraseBoards'>
) {
  const tiles = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', board._id))
    .collect();

  // Collect phrase IDs referenced by phrase-kind tiles so we can delete their
  // rows + symbol storage. Other kinds (navigate, audio) don't own phrases.
  const phraseIds: Id<'phrases'>[] = [];
  const audioStorageIds: Id<'_storage'>[] = [];
  for (const tile of tiles) {
    if (tile.kind === 'phrase' && tile.phraseId) {
      phraseIds.push(tile.phraseId);
    } else if (tile.kind === 'audio' && tile.audioStorageId) {
      audioStorageIds.push(tile.audioStorageId);
    }
  }

  // Delete tile rows first so nothing references the phrases we're about to
  // remove. Promise.all is safe inside a Convex mutation.
  await Promise.all(tiles.map((tile) => ctx.db.delete(tile._id)));

  // Resolve phrase rows, gather storage IDs, delete the rows.
  const phrases = (await Promise.all(phraseIds.map((id) => ctx.db.get(id))))
    .filter((p): p is Doc<'phrases'> => p !== null);
  const symbolStorageIds = phrases
    .map((p) => p.symbolStorageId)
    .filter((id): id is Id<'_storage'> => Boolean(id));

  await Promise.all(phrases.map((p) => ctx.db.delete(p._id)));

  // Storage deletes can fail if the object is already gone; allSettled keeps
  // the cascade moving instead of stranding a half-deleted board.
  await Promise.allSettled([
    ...symbolStorageIds.map((id) => ctx.storage.delete(id)),
    ...audioStorageIds.map((id) => ctx.storage.delete(id)),
  ]);

  await ctx.db.delete(board._id);
}
