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
        return {
          _id: row._id,
          boardId: row.boardId,
          position: row.position,
          kind: 'navigate',
          targetBoardId,
          targetBoardName: target?.name ?? null,
        };
      })
    );

    return hydrated;
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
