import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { getUserIdentity } from './users';

// Query: Get all phrase boards for current user (owned + assigned to them)
export const getPhraseBoards = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const phraseCache = new Map<string, Doc<'phrases'> | null>();
    const profileCache = new Map<string, Doc<'profiles'> | null>();

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

    const loadBoardPhrases = async (boardId: Id<'phraseBoards'>) => {
      const phraseBoardPhrases = await ctx.db
        .query('phraseBoardPhrases')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect();

      return (await Promise.all(
        phraseBoardPhrases.map(async (pbp) => {
          const phrase = await getCachedPhrase(pbp.phraseId);
          return { ...pbp, phrase };
        })
      )).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
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
        const phrases = await loadBoardPhrases(board._id);

        // Get client name if this board is for a client
        let forClientName = null;
        if (board.forClientId) {
          const clientProfile = await getCachedProfile(board.forClientId);
          forClientName = clientProfile?.fullName || clientProfile?.email || 'Client';
        }

        return {
          ...board,
          phrase_board_phrases: phrases,
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
        const phrases = await loadBoardPhrases(board._id);

        // Get caregiver name
        const caregiverProfile = await getCachedProfile(board.userId);

        return {
          ...board,
          phrase_board_phrases: phrases,
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

    const phraseBoardPhrases = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();

    const phrases = (await Promise.all(
      phraseBoardPhrases.map(async (pbp) => {
        const phrase = await getCachedPhrase(pbp.phraseId);
        return { ...pbp, phrase };
      })
    )).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

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
      phrase_board_phrases: phrases,
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

    // Delete all phrase associations
    const phraseBoardPhrases = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();

    for (const pbp of phraseBoardPhrases) {
      await ctx.db.delete(pbp._id);
      // Also delete the phrase itself
      await ctx.db.delete(pbp.phraseId);
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

    // Check for duplicate phrase text on this board
    const boardPhraseLinks = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    for (const link of boardPhraseLinks) {
      const existingPhrase = await ctx.db.get(link.phraseId);
      if (existingPhrase && existingPhrase.text === phrase.text) {
        throw new Error('A phrase with this text already exists on this board');
      }
    }

    const position = boardPhraseLinks.length;
    await ctx.db.insert('phraseBoardPhrases', {
      phraseId: args.phraseId,
      boardId: args.boardId,
      position,
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

    const links = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const linkByPhraseId = new Map(links.map((l) => [l.phraseId.toString(), l]));

    await Promise.all(
      args.orderedPhraseIds.map((phraseId, index) => {
        const link = linkByPhraseId.get(phraseId.toString());
        if (link) return ctx.db.patch(link._id, { position: index });
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

    const link = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.phraseId))
      .filter((q) => q.eq(q.field('boardId'), args.boardId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
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
