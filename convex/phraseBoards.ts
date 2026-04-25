import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { getUserIdentity } from './users';

// ---------------------------------------------------------------------------
// Shared loaders for tile data (read from boardTiles).
//
// The `phrase_board_phrases` field on board query results is preserved for
// backward compatibility — it returns *only phrase-kind tiles* in the legacy
// shape. New consumers should read the polymorphic `tiles` field instead.
// ---------------------------------------------------------------------------

type LegacyPhraseLink = {
  _id: Id<'boardTiles'>;
  phraseId: Id<'phrases'>;
  boardId: Id<'phraseBoards'>;
  position: number;
  phrase: Doc<'phrases'> | null;
};

type PolymorphicBoardTile =
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

async function loadHydratedBoardTiles(
  ctx: QueryCtx,
  boardId: Id<'phraseBoards'>,
  getCachedPhrase: (phraseId: Id<'phrases'>) => Promise<Doc<'phrases'> | null>,
  getCachedBoard: (boardId: Id<'phraseBoards'>) => Promise<Doc<'phraseBoards'> | null>
): Promise<{ tiles: PolymorphicBoardTile[]; phraseLinks: LegacyPhraseLink[] }> {
  const rows = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', boardId))
    .collect();

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  const tiles: PolymorphicBoardTile[] = [];
  const phraseLinks: LegacyPhraseLink[] = [];

  for (const row of sorted) {
    if (row.kind === 'phrase') {
      const phrase = row.phraseId ? await getCachedPhrase(row.phraseId) : null;
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'phrase',
        phrase,
      });
      if (row.phraseId) {
        phraseLinks.push({
          _id: row._id,
          phraseId: row.phraseId,
          boardId: row.boardId,
          position: row.position,
          phrase,
        });
      }
      continue;
    }

    // kind === 'navigate'
    if (!row.targetBoardId) {
      // Defensive: shouldn't happen, but emit a broken-state tile if it does.
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'navigate',
        targetBoardId: row.boardId,
        targetBoardName: null,
      });
      continue;
    }
    const target = await getCachedBoard(row.targetBoardId);
    tiles.push({
      _id: row._id,
      boardId: row.boardId,
      position: row.position,
      kind: 'navigate',
      targetBoardId: row.targetBoardId,
      targetBoardName: target?.name ?? null,
    });
  }

  return { tiles, phraseLinks };
}

// Query: Get all phrase boards for current user (owned + assigned to them)
export const getPhraseBoards = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const phraseCache = new Map<string, Doc<'phrases'> | null>();
    const profileCache = new Map<string, Doc<'profiles'> | null>();
    const boardCache = new Map<string, Doc<'phraseBoards'> | null>();

    const getCachedPhrase = async (phraseId: Id<'phrases'>) => {
      const cacheKey = phraseId.toString();
      if (phraseCache.has(cacheKey)) {
        return phraseCache.get(cacheKey) ?? null;
      }

      const phrase = await ctx.db.get(phraseId);
      phraseCache.set(cacheKey, phrase ?? null);
      return phrase ?? null;
    };

    const getCachedProfile = async (userId: string) => {
      if (profileCache.has(userId)) {
        return profileCache.get(userId) ?? null;
      }

      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();
      profileCache.set(userId, profile ?? null);
      return profile ?? null;
    };

    const getCachedBoard = async (boardId: Id<'phraseBoards'>) => {
      const cacheKey = boardId.toString();
      if (boardCache.has(cacheKey)) {
        return boardCache.get(cacheKey) ?? null;
      }
      const board = await ctx.db.get(boardId);
      boardCache.set(cacheKey, board ?? null);
      return board ?? null;
    };

    // Get boards owned by the user (caregiver's boards)
    const ownedBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    // Get boards assigned to this user as a client
    const assignedBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_client', (q) => q.eq('forClientId', identity.subject))
      .collect();

    // Process owned boards - resolve client names if forClientId is set
    const ownedBoardsWithInfo = await Promise.all(
      ownedBoards.map(async (board) => {
        const { tiles, phraseLinks } = await loadHydratedBoardTiles(
          ctx, board._id, getCachedPhrase, getCachedBoard
        );

        // Get client name if this board is for a client
        let forClientName = null;
        if (board.forClientId) {
          const clientProfile = await getCachedProfile(board.forClientId);
          forClientName = clientProfile?.fullName || clientProfile?.email || 'Client';
        }

        return {
          ...board,
          phrase_board_phrases: phraseLinks,
          tiles,
          isShared: false,
          isOwner: true,
          accessLevel: 'edit' as const,
          sharedBy: null,
          forClientName,
        };
      })
    );

    // Process assigned boards (boards where this user is the client)
    const assignedBoardsWithInfo = await Promise.all(
      assignedBoards.map(async (board) => {
        const { tiles, phraseLinks } = await loadHydratedBoardTiles(
          ctx, board._id, getCachedPhrase, getCachedBoard
        );

        // Get caregiver name
        const caregiverProfile = await getCachedProfile(board.userId);

        return {
          ...board,
          phrase_board_phrases: phraseLinks,
          tiles,
          isShared: true,
          isOwner: false,
          accessLevel: board.clientAccessLevel || 'view',
          sharedBy: caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver',
          forClientName: null,
        };
      })
    );

    // Combine and return all boards
    return [...ownedBoardsWithInfo, ...assignedBoardsWithInfo];
  },
});

// Query: Get a single phrase board by ID (owned or assigned)
export const getPhraseBoard = query({
  args: { id: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const phraseCache = new Map<string, Doc<'phrases'> | null>();
    const profileCache = new Map<string, Doc<'profiles'> | null>();
    const boardCache = new Map<string, Doc<'phraseBoards'> | null>();

    const getCachedPhrase = async (phraseId: Id<'phrases'>) => {
      const cacheKey = phraseId.toString();
      if (phraseCache.has(cacheKey)) {
        return phraseCache.get(cacheKey) ?? null;
      }

      const phrase = await ctx.db.get(phraseId);
      phraseCache.set(cacheKey, phrase ?? null);
      return phrase ?? null;
    };

    const getCachedProfile = async (userId: string) => {
      if (profileCache.has(userId)) {
        return profileCache.get(userId) ?? null;
      }

      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();
      profileCache.set(userId, profile ?? null);
      return profile ?? null;
    };

    const getCachedBoard = async (boardId: Id<'phraseBoards'>) => {
      const cacheKey = boardId.toString();
      if (boardCache.has(cacheKey)) {
        return boardCache.get(cacheKey) ?? null;
      }
      const board = await ctx.db.get(boardId);
      boardCache.set(cacheKey, board ?? null);
      return board ?? null;
    };

    const board = await ctx.db.get(args.id);
    if (!board) {
      return null;
    }

    // Check if user owns the board or is the assigned client
    const isOwner = board.userId === identity.subject;
    const isAssignedClient = board.forClientId === identity.subject;

    if (!isOwner && !isAssignedClient) {
      return null; // User has no access
    }

    const { tiles, phraseLinks } = await loadHydratedBoardTiles(
      ctx, args.id, getCachedPhrase, getCachedBoard
    );

    // Get caregiver name for assigned clients
    let sharedBy = null;
    if (isAssignedClient && !isOwner) {
      const caregiverProfile = await getCachedProfile(board.userId);
      sharedBy = caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver';
    }

    // Get client name for owner
    let forClientName = null;
    if (isOwner && board.forClientId) {
      const clientProfile = await getCachedProfile(board.forClientId);
      forClientName = clientProfile?.fullName || clientProfile?.email || 'Client';
    }

    return {
      ...board,
      phrase_board_phrases: phraseLinks,
      tiles,
      isShared: isAssignedClient && !isOwner,
      isOwner,
      accessLevel: isOwner ? 'edit' : (board.clientAccessLevel || 'view'),
      sharedBy,
      forClientName,
    };
  },
});

// Mutation: Add a new phrase board
export const addPhraseBoard = mutation({
  args: {
    name: v.string(),
    position: v.number(),
    forClientId: v.optional(v.string()),
    clientAccessLevel: v.optional(v.union(v.literal('view'), v.literal('edit'))),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const boardId = await ctx.db.insert('phraseBoards', {
      userId: identity.subject,
      name: args.name,
      position: args.position,
      forClientId: args.forClientId,
      clientAccessLevel: args.forClientId ? (args.clientAccessLevel || 'view') : undefined,
    });

    return boardId;
  },
});

// Mutation: Update a phrase board
export const updatePhraseBoard = mutation({
  args: {
    id: v.id('phraseBoards'),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const { id, ...updates } = args;

    // Verify ownership
    const board = await ctx.db.get(id);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a phrase board
export const deletePhraseBoard = mutation({
  args: {
    id: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify ownership
    const board = await ctx.db.get(args.id);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Delete all tile placements on this board (and the phrase rows that
    // were exclusive to it). Navigate tiles on OTHER boards that point at
    // this board are intentionally left in place — they will render as a
    // broken-target tile until the owner edits or removes them.
    const tilesOnBoard = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();

    for (const tile of tilesOnBoard) {
      await ctx.db.delete(tile._id);
      if (tile.kind === 'phrase' && tile.phraseId) {
        await ctx.db.delete(tile.phraseId);
      }
    }

    // Also clean up any legacy phraseBoardPhrases rows still hanging around
    // pre-migration. Safe even when the table is empty.
    const legacyLinks = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();
    for (const link of legacyLinks) {
      await ctx.db.delete(link._id);
    }

    // Delete the board
    await ctx.db.delete(args.id);
  },
});

// Mutation: Add a phrase to a board
export const addPhraseToBoard = mutation({
  args: {
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify phrase ownership
    const phrase = await ctx.db.get(args.phraseId);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error('Unauthorized - phrase');
    }

    // Verify board access (owner or assigned client with edit access)
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const isOwner = board.userId === identity.subject;
    const isAssignedClientWithEdit =
      board.forClientId === identity.subject && board.clientAccessLevel === 'edit';

    if (!isOwner && !isAssignedClientWithEdit) {
      throw new Error('Unauthorized - board');
    }

    // Check for duplicate phrase text on this board (across all tiles).
    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    for (const tile of existingTiles) {
      if (tile.kind !== 'phrase' || !tile.phraseId) continue;
      const existingPhrase = await ctx.db.get(tile.phraseId);
      if (existingPhrase && existingPhrase.text === phrase.text) {
        throw new Error('A phrase with this text already exists on this board');
      }
    }

    const position = existingTiles.length;
    await ctx.db.insert('boardTiles', {
      boardId: args.boardId,
      position,
      kind: 'phrase',
      phraseId: args.phraseId,
    });
  },
});

// Mutation: Reorder phrases on a board
export const reorderPhrasesOnBoard = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    orderedPhraseIds: v.array(v.id('phrases')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify board access
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error('Board not found');

    const isOwner = board.userId === identity.subject;
    const isAssignedClientWithEdit =
      board.forClientId === identity.subject && board.clientAccessLevel === 'edit';

    if (!isOwner && !isAssignedClientWithEdit) {
      throw new Error('Unauthorized');
    }

    // Reorder by phrase id: only phrase-kind tiles are affected. Navigate-kind
    // tiles keep their existing position (callers using mixed-kind grids should
    // use boardTiles.reorderTiles which is tile-id based).
    const tiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const tileByPhraseId = new Map<string, typeof tiles[number]>();
    for (const tile of tiles) {
      if (tile.kind === 'phrase' && tile.phraseId) {
        tileByPhraseId.set(tile.phraseId.toString(), tile);
      }
    }

    await Promise.all(
      args.orderedPhraseIds.map((phraseId, index) => {
        const tile = tileByPhraseId.get(phraseId.toString());
        if (tile) return ctx.db.patch(tile._id, { position: index });
      })
    );
  },
});

// Mutation: Remove a phrase from a board
export const removePhraseFromBoard = mutation({
  args: {
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const tile = await ctx.db
      .query('boardTiles')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.phraseId))
      .filter((q) => q.eq(q.field('boardId'), args.boardId))
      .first();

    if (tile) {
      await ctx.db.delete(tile._id);
    }
  },
});

// Query: Get boards for a specific client (used by caregivers on dashboard)
export const getBoardsForClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    // Get boards owned by current user that are for this client
    const boards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_client', (q) => q.eq('forClientId', args.clientId))
      .collect();

    // Filter to only boards owned by the current user
    const ownedBoards = boards.filter((board) => board.userId === identity.subject);

    return ownedBoards;
  },
});

// Mutation: Update board client access level
export const updateBoardClientAccess = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    accessLevel: v.union(v.literal('view'), v.literal('edit')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.boardId, {
      clientAccessLevel: args.accessLevel,
    });
  },
});

// Mutation: Unassign board from client (set forClientId to undefined)
export const unassignBoardFromClient = mutation({
  args: { boardId: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.boardId, {
      forClientId: undefined,
      clientAccessLevel: undefined,
    });
  },
});
