import { v } from 'convex/values';
import { mutation, query, type QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { getUserIdentity } from './users';

// ---------------------------------------------------------------------------
// Access helpers
// ---------------------------------------------------------------------------

type BoardAccess = {
  board: Doc<'phraseBoards'>;
  isOwner: boolean;
  canEdit: boolean;
  canRead: boolean;
};

const MAX_AUDIO_LABEL_LENGTH = 80;
const MAX_AUDIO_DURATION_MS = 60_000;

function validateAudioLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) throw new Error('Audio tile label is required');
  if (trimmed.length > MAX_AUDIO_LABEL_LENGTH) {
    throw new Error(`Audio tile label must be ${MAX_AUDIO_LABEL_LENGTH} characters or fewer`);
  }
  return trimmed;
}

function validateAudioMetadata(args: {
  audioMimeType: string;
  audioDurationMs: number;
  audioByteSize: number;
}) {
  if (!args.audioMimeType.startsWith('audio/')) {
    throw new Error('Audio file must use an audio MIME type');
  }
  if (args.audioDurationMs <= 0 || args.audioDurationMs > MAX_AUDIO_DURATION_MS) {
    throw new Error('Audio recording must be 60 seconds or less');
  }
  if (args.audioByteSize <= 0) {
    throw new Error('Audio recording is empty');
  }
}

async function getBoardAccess(
  ctx: QueryCtx,
  boardId: Id<'phraseBoards'>,
  userId: string
): Promise<BoardAccess | null> {
  const board = await ctx.db.get(boardId);
  if (!board) return null;

  const isOwner = board.userId === userId;
  const isAssignedClient = board.forClientId === userId;
  const canEdit =
    isOwner || (isAssignedClient && board.clientAccessLevel === 'edit');
  const canRead = isOwner || isAssignedClient;

  return { board, isOwner, canEdit, canRead };
}

// ---------------------------------------------------------------------------
// Query: list tiles on a board (polymorphic, hydrated)
// ---------------------------------------------------------------------------

export type ListedBoardTile =
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'phrase';
      phrase: Doc<'phrases'> | null;
    }
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'navigate';
      targetBoardId: Id<'phraseBoards'>;
      targetBoardName: string | null;
    }
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'audio';
      audioLabel: string;
      audioStorageId: Id<'_storage'>;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
    };

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
          };
        }
        if (row.kind === 'audio') {
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
              audioStorageId: row.audioStorageId ?? (row._id as unknown as Id<'_storage'>),
              audioUrl: null,
              audioMimeType: row.audioMimeType ?? 'audio/webm',
              audioDurationMs: row.audioDurationMs ?? 0,
              audioByteSize: row.audioByteSize ?? 0,
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
      audioMimeType: args.audioMimeType,
      audioDurationMs: args.audioDurationMs,
      audioByteSize: args.audioByteSize,
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
      patch.audioMimeType = args.audioMimeType;
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
// Mutation: delete a tile (does not delete the underlying phrase)
// ---------------------------------------------------------------------------

export const deleteTile = mutation({
  args: { tileId: v.id('boardTiles') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const tile = await ctx.db.get(args.tileId);
    if (!tile) return;

    const access = await getBoardAccess(ctx, tile.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

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

    if (tile) await ctx.db.delete(tile._id);
  },
});
