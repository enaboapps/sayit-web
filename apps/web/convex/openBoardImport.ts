import { v } from 'convex/values';
import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getUserIdentity } from './users';
import { AAC_LAYOUT_VERSION } from './aacLayout';
import { MAX_IMPORT_BOARDS, MAX_IMPORT_TILES } from './openBoardLimits';

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
        layoutVersion: AAC_LAYOUT_VERSION,
        sourceTemplate: 'custom',
        hiddenFromPicker: navTargetSourceIds.has(board.sourceId) ? true : undefined,
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
    };
  },
});
