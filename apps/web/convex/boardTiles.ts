import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { getUserIdentity } from './users';
import { getBoardAccess } from './boardAccess';
import {
  normaliseAudioMimeType,
  validateAudioLabel,
  validateAudioMetadata,
} from './audioLimits';
import {
  fixedGridRectWithinBoard,
  fixedGridRectsOverlap,
  nextFixedGridCell,
  normaliseFixedGridSpan,
  tileFixedGridRect,
} from './aacLayout';
import {
  loadHydratedBoardTiles,
  type HydratedBoardTile,
} from './boardTileHydration';

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
  if (typeof board.gridRows !== 'number' || typeof board.gridColumns !== 'number') {
    throw new Error('Cell coordinates are outside the board grid');
  }
  if (row >= board.gridRows || column >= board.gridColumns) {
    throw new Error('Cell coordinates are outside the board grid');
  }

  const requestedRect = {
    row,
    column,
    rowSpan: normaliseFixedGridSpan(tile.cellRowSpan),
    columnSpan: normaliseFixedGridSpan(tile.cellColumnSpan),
  };

  if (!fixedGridRectWithinBoard(board, requestedRect)) {
    throw new Error('Cell span exceeds the board grid');
  }

  const existing = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', board._id))
    .collect();

  const occupant = existing.find((candidate) => {
    if (candidate._id === tile._id) return false;

    const candidateRect = tileFixedGridRect(candidate);
    return candidateRect ? fixedGridRectsOverlap(requestedRect, candidateRect) : false;
  });
  if (occupant) {
    throw new Error('Cell is already occupied');
  }
}

// ---------------------------------------------------------------------------
// Query: list tiles on a board (polymorphic, hydrated)
// ---------------------------------------------------------------------------

export type ListedBoardTile = HydratedBoardTile;

export const listByBoard = query({
  args: { boardId: v.id('phraseBoards') },
  handler: async (ctx, args): Promise<ListedBoardTile[]> => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access || !access.canRead) return [];

    const { tiles } = await loadHydratedBoardTiles(ctx, args.boardId, identity.subject);
    return tiles;
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

    // Load tiles for cell-collision detection and position derivation.
    // Duplicate phrase text on a single board is allowed — see the matching
    // comment in phraseBoards.ts:addPhraseToBoard. Cell-collision is what we
    // actually need to enforce.
    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

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
