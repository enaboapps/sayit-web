import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { getUserIdentity } from './users';
import { getBoardAccess } from './boardAccess';
import {
  normaliseAudioMimeType,
  validateAudioLabel,
  validateAudioMetadata,
} from './audioLimits';

const tileRoleValidator = v.union(
  v.literal('core'),
  v.literal('fringe'),
  v.literal('navigation'),
  v.literal('control'),
  v.literal('quickPhrase'),
  v.literal('audio')
);

const wordClassValidator = v.union(
  v.literal('pronoun'),
  v.literal('verb'),
  v.literal('descriptor'),
  v.literal('preposition'),
  v.literal('question'),
  v.literal('social'),
  v.literal('noun'),
  v.literal('other')
);

async function assertFixedGridCellAvailable(
  ctx: MutationCtx,
  board: Doc<'phraseBoards'>,
  tile: Doc<'boardTiles'>,
  row: number,
  column: number
) {
  if (board.layoutMode !== 'fixedGrid') {
    throw new Error('Board does not use fixed-grid layout');
  }
  if (!Number.isInteger(row) || !Number.isInteger(column) || row < 0 || column < 0) {
    throw new Error('Cell coordinates must be non-negative integers');
  }
  if (
    typeof board.gridRows !== 'number' ||
    typeof board.gridColumns !== 'number' ||
    row >= board.gridRows ||
    column >= board.gridColumns
  ) {
    throw new Error('Cell coordinates are outside the board grid');
  }

  const existing = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', board._id))
    .filter((q) =>
      q.and(
        q.eq(q.field('cellRow'), row),
        q.eq(q.field('cellColumn'), column)
      )
    )
    .collect();

  const occupant = existing.find((candidate) => candidate._id !== tile._id);
  if (occupant) {
    throw new Error('Cell is already occupied');
  }
}

function nextFixedGridCell(
  board: Doc<'phraseBoards'>,
  tiles: Doc<'boardTiles'>[]
): { cellRow: number; cellColumn: number; cellRowSpan: 1; cellColumnSpan: 1 } | null {
  if (
    board.layoutMode !== 'fixedGrid' ||
    typeof board.gridRows !== 'number' ||
    typeof board.gridColumns !== 'number'
  ) {
    return null;
  }

  const occupied = new Set<string>();
  for (const tile of tiles) {
    if (typeof tile.cellRow === 'number' && typeof tile.cellColumn === 'number') {
      occupied.add(`${tile.cellRow}:${tile.cellColumn}`);
    }
  }

  for (let row = 0; row < board.gridRows; row++) {
    for (let column = 0; column < board.gridColumns; column++) {
      if (!occupied.has(`${row}:${column}`)) {
        return {
          cellRow: row,
          cellColumn: column,
          cellRowSpan: 1,
          cellColumnSpan: 1,
        };
      }
    }
  }

  throw new Error('No empty fixed-grid cells are available on this board');
}

// ---------------------------------------------------------------------------
// Query: list tiles on a board (polymorphic, hydrated)
// ---------------------------------------------------------------------------

type TileLayoutMetadata = {
  cellRow?: number;
  cellColumn?: number;
  cellRowSpan?: number;
  cellColumnSpan?: number;
  tileRole?: Doc<'boardTiles'>['tileRole'];
  wordClass?: Doc<'boardTiles'>['wordClass'];
  isLocked?: boolean;
};

function tileLayoutMetadata(row: Doc<'boardTiles'>): TileLayoutMetadata {
  return {
    cellRow: row.cellRow,
    cellColumn: row.cellColumn,
    cellRowSpan: row.cellRowSpan,
    cellColumnSpan: row.cellColumnSpan,
    tileRole: row.tileRole,
    wordClass: row.wordClass,
    isLocked: row.isLocked,
  };
}

export type ListedBoardTile =
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'phrase';
      phrase: Doc<'phrases'> | null;
    } & TileLayoutMetadata)
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'navigate';
      targetBoardId: Id<'phraseBoards'>;
      targetBoardName: string | null;
    } & TileLayoutMetadata)
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'audio';
      audioLabel: string;
      /** null when the underlying storage object is missing/unrecoverable. */
      audioStorageId: Id<'_storage'> | null;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
    } & TileLayoutMetadata);

export const listByBoard = query({
  args: { boardId: v.id('phraseBoards') },
  handler: async (ctx, args): Promise<ListedBoardTile[]> => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access || !access.canRead) return [];

    const rows = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const sorted = [...rows].sort((a, b) => a.position - b.position);

    const hydrated: ListedBoardTile[] = await Promise.all(
      sorted.map(async (row): Promise<ListedBoardTile> => {
        if (row.kind === 'phrase') {
          const phrase = row.phraseId ? await ctx.db.get(row.phraseId) : null;
          return {
            _id: row._id,
            boardId: row.boardId,
            position: row.position,
            kind: 'phrase',
            phrase: phrase ?? null,
            ...tileLayoutMetadata(row),
          };
        }
        if (row.kind === 'audio') {
          // Defensive: a row could be missing one or more audio fields if it
          // was written by an older client or partially hydrated. Surface a
          // broken-state tile (audioUrl=null, audioStorageId=null) — the
          // renderer keys on audioUrl===null and shows the disabled affordance.
          if (
            !row.audioLabel ||
            !row.audioStorageId ||
            !row.audioMimeType ||
            typeof row.audioDurationMs !== 'number' ||
            typeof row.audioByteSize !== 'number'
          ) {
            return {
              _id: row._id,
              boardId: row.boardId,
              position: row.position,
              kind: 'audio',
              audioLabel: row.audioLabel ?? 'Audio tile',
              audioStorageId: null,
              audioUrl: null,
              audioMimeType: row.audioMimeType ?? '',
              audioDurationMs: row.audioDurationMs ?? 0,
              audioByteSize: row.audioByteSize ?? 0,
              ...tileLayoutMetadata(row),
            };
          }

          const audioUrl = await ctx.storage.getUrl(row.audioStorageId);
          return {
            _id: row._id,
            boardId: row.boardId,
            position: row.position,
            kind: 'audio',
            audioLabel: row.audioLabel,
            audioStorageId: row.audioStorageId,
            audioUrl,
            audioMimeType: row.audioMimeType,
            audioDurationMs: row.audioDurationMs,
            audioByteSize: row.audioByteSize,
            ...tileLayoutMetadata(row),
          };
        }

        // kind === 'navigate'
        const targetBoardId = row.targetBoardId;
        if (!targetBoardId) {
          // Defensive: shouldn't happen given mutation guards, but treat as broken.
          return {
            _id: row._id,
            boardId: row.boardId,
            position: row.position,
            kind: 'navigate',
            targetBoardId: row.boardId, // self-ref to satisfy id type; renderer treats null name as broken
            targetBoardName: null,
            ...tileLayoutMetadata(row),
          };
        }
        const target = await ctx.db.get(targetBoardId);
        // Only expose the name when the viewer can actually read the target.
        // Otherwise return null (renderer shows broken state) so we don't leak
        // names of boards the viewer has no access to.
        const canRead = target
          ? target.userId === identity.subject || target.forClientId === identity.subject
          : false;
        return {
          _id: row._id,
          boardId: row.boardId,
          position: row.position,
          kind: 'navigate',
          targetBoardId,
          targetBoardName: canRead ? (target?.name ?? null) : null,
          ...tileLayoutMetadata(row),
        };
      })
    );

    return hydrated;
  },
});

// ---------------------------------------------------------------------------
// Mutation: add an audio-kind tile
// ---------------------------------------------------------------------------

export const addAudioTile = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    audioLabel: v.string(),
    audioStorageId: v.id('_storage'),
    audioMimeType: v.string(),
    audioDurationMs: v.number(),
    audioByteSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access) throw new Error('Board not found');
    if (!access.canEdit) throw new Error('Unauthorized - board');

    const audioLabel = validateAudioLabel(args.audioLabel);
    validateAudioMetadata(args);
    // Strip codec parameters before persisting (keeps stored values uniform
    // across browsers — Chromium emits "audio/webm;codecs=opus", Safari emits
    // "audio/mp4;codecs=mp4a.40.2", etc.).
    const audioMimeType = normaliseAudioMimeType(args.audioMimeType);

    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    return await ctx.db.insert('boardTiles', {
      boardId: args.boardId,
      position: existingTiles.length,
      kind: 'audio',
      audioLabel,
      audioStorageId: args.audioStorageId,
      audioMimeType,
      audioDurationMs: args.audioDurationMs,
      audioByteSize: args.audioByteSize,
      tileRole: 'audio',
      ...(nextFixedGridCell(access.board, existingTiles) ?? {}),
    });
  },
});

// ---------------------------------------------------------------------------
// Mutation: update an audio-kind tile
// ---------------------------------------------------------------------------

export const updateAudioTile = mutation({
  args: {
    tileId: v.id('boardTiles'),
    audioLabel: v.optional(v.string()),
    audioStorageId: v.optional(v.id('_storage')),
    audioMimeType: v.optional(v.string()),
    audioDurationMs: v.optional(v.number()),
    audioByteSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) throw new Error('Tile not found');
    if (tile.kind !== 'audio') throw new Error('Tile is not an audio tile');

    const access = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    const patch: Partial<Doc<'boardTiles'>> = {};

    if (args.audioLabel !== undefined) {
      patch.audioLabel = validateAudioLabel(args.audioLabel);
    }

    const isReplacingAudio = args.audioStorageId !== undefined;
    if (isReplacingAudio) {
      if (
        args.audioMimeType === undefined ||
        args.audioDurationMs === undefined ||
        args.audioByteSize === undefined
      ) {
        throw new Error('Replacement audio metadata is required');
      }
      validateAudioMetadata({
        audioMimeType: args.audioMimeType,
        audioDurationMs: args.audioDurationMs,
        audioByteSize: args.audioByteSize,
      });
      patch.audioStorageId = args.audioStorageId;
      patch.audioMimeType = normaliseAudioMimeType(args.audioMimeType);
      patch.audioDurationMs = args.audioDurationMs;
      patch.audioByteSize = args.audioByteSize;
    }

    await ctx.db.patch(args.tileId, patch);

    if (isReplacingAudio && tile.audioStorageId) {
      await ctx.storage.delete(tile.audioStorageId);
    }
  },
});

// ---------------------------------------------------------------------------
// Mutation: add a phrase-kind tile
// ---------------------------------------------------------------------------

export const addPhraseTile = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    phraseId: v.id('phrases'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    // Verify phrase ownership.
    const phrase = await ctx.db.get(args.phraseId);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error('Unauthorized - phrase');
    }

    // Verify board edit access.
    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access) throw new Error('Board not found');
    if (!access.canEdit) throw new Error('Unauthorized - board');

    // Reject duplicate phrase text on the same board (preserves prior UX rule).
    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    for (const tile of existingTiles) {
      if (tile.kind !== 'phrase' || !tile.phraseId) continue;
      const existing = await ctx.db.get(tile.phraseId);
      if (existing && existing.text === phrase.text) {
        throw new Error('A phrase with this text already exists on this board');
      }
    }

    const position = existingTiles.length;
    return await ctx.db.insert('boardTiles', {
      boardId: args.boardId,
      position,
      kind: 'phrase',
      phraseId: args.phraseId,
      tileRole: access.board.layoutMode === 'fixedGrid' ? 'fringe' : undefined,
      ...(nextFixedGridCell(access.board, existingTiles) ?? {}),
    });
  },
});

// ---------------------------------------------------------------------------
// Mutation: add a navigate-kind tile
// ---------------------------------------------------------------------------

export const addNavigateTile = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    targetBoardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    if (args.boardId === args.targetBoardId) {
      throw new Error('A navigate tile cannot point at its own board');
    }

    // Verify edit access on the source board.
    const sourceAccess = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!sourceAccess) throw new Error('Board not found');
    if (!sourceAccess.canEdit) throw new Error('Unauthorized - board');

    // Verify the target exists and the creator can read it. (Runtime viewers
    // who lack access will see a broken-state tile; that's the documented v1
    // behavior.)
    const targetAccess = await getBoardAccess(ctx, args.targetBoardId, identity.subject);
    if (!targetAccess) throw new Error('Target board not found');
    if (!targetAccess.canRead) throw new Error('Unauthorized - target board');

    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const position = existingTiles.length;
    return await ctx.db.insert('boardTiles', {
      boardId: args.boardId,
      position,
      kind: 'navigate',
      targetBoardId: args.targetBoardId,
      tileRole: sourceAccess.board.layoutMode === 'fixedGrid' ? 'navigation' : undefined,
      ...(nextFixedGridCell(sourceAccess.board, existingTiles) ?? {}),
    });
  },
});

// ---------------------------------------------------------------------------
// Mutation: change the destination of an existing navigate tile
// ---------------------------------------------------------------------------

export const updateNavigateTile = mutation({
  args: {
    tileId: v.id('boardTiles'),
    targetBoardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) throw new Error('Tile not found');
    if (tile.kind !== 'navigate') throw new Error('Tile is not a navigate tile');

    if (tile.boardId === args.targetBoardId) {
      throw new Error('A navigate tile cannot point at its own board');
    }

    const sourceAccess = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!sourceAccess || !sourceAccess.canEdit) throw new Error('Unauthorized');

    const targetAccess = await getBoardAccess(ctx, args.targetBoardId, identity.subject);
    if (!targetAccess) throw new Error('Target board not found');
    if (!targetAccess.canRead) throw new Error('Unauthorized - target board');

    await ctx.db.patch(args.tileId, { targetBoardId: args.targetBoardId });
  },
});

// ---------------------------------------------------------------------------
// Mutation: reorder tiles on a board
// ---------------------------------------------------------------------------

export const reorderTiles = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    orderedTileIds: v.array(v.id('boardTiles')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access) throw new Error('Board not found');
    if (!access.canEdit) throw new Error('Unauthorized');

    // Only patch tiles that actually belong to this board.
    const tilesById = new Map<string, Doc<'boardTiles'>>();
    const existing = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();
    for (const tile of existing) {
      tilesById.set(tile._id.toString(), tile);
    }

    await Promise.all(
      args.orderedTileIds.map((tileId, index) => {
        const tile = tilesById.get(tileId.toString());
        if (!tile) return undefined;
        return ctx.db.patch(tile._id, { position: index });
      })
    );
  },
});

// ---------------------------------------------------------------------------
// Mutation: move a tile to a fixed-grid cell
// ---------------------------------------------------------------------------

export const moveTileToCell = mutation({
  args: {
    tileId: v.id('boardTiles'),
    row: v.number(),
    column: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) throw new Error('Tile not found');

    const access = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    await assertFixedGridCellAvailable(ctx, access.board, tile, args.row, args.column);

    await ctx.db.patch(args.tileId, {
      cellRow: args.row,
      cellColumn: args.column,
      cellRowSpan: tile.cellRowSpan ?? 1,
      cellColumnSpan: tile.cellColumnSpan ?? 1,
    });
  },
});

// ---------------------------------------------------------------------------
// Mutation: update fixed-grid metadata on any tile kind
// ---------------------------------------------------------------------------

export const updateTileLayoutMetadata = mutation({
  args: {
    tileId: v.id('boardTiles'),
    tileRole: v.optional(tileRoleValidator),
    wordClass: v.optional(wordClassValidator),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) throw new Error('Tile not found');

    const access = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    const patch: Partial<Doc<'boardTiles'>> = {};
    if (args.tileRole !== undefined) patch.tileRole = args.tileRole;
    if (args.wordClass !== undefined) patch.wordClass = args.wordClass;
    if (args.isLocked !== undefined) patch.isLocked = args.isLocked;

    await ctx.db.patch(args.tileId, patch);
  },
});

// ---------------------------------------------------------------------------
// Mutation: delete a tile (does not delete the underlying phrase)
// ---------------------------------------------------------------------------

export const deleteTile = mutation({
  args: {
    tileId: v.id('boardTiles'),
    confirmLockedCoreDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) return;

    const access = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    if (tile.isLocked && tile.tileRole === 'core' && !args.confirmLockedCoreDelete) {
      throw new Error('Locked core tiles require explicit confirmation before deletion');
    }

    if (tile.kind === 'audio' && tile.audioStorageId) {
      await ctx.storage.delete(tile.audioStorageId);
    }

    await ctx.db.delete(args.tileId);
  },
});

// ---------------------------------------------------------------------------
// Mutation: remove a phrase tile by phraseId (compat for existing flows)
// ---------------------------------------------------------------------------

export const removePhraseTileFromBoard = mutation({
  args: {
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    const tile = await ctx.db
      .query('boardTiles')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.phraseId))
      .filter((q) => q.eq(q.field('boardId'), args.boardId))
      .first();

    if (tile) {
      if (tile.isLocked && tile.tileRole === 'core') {
        throw new Error('Locked core tiles cannot be removed from the board with this action');
      }
      await ctx.db.delete(tile._id);
    }
  },
});
