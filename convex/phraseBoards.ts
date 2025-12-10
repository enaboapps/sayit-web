import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get all phrase boards for current user (owned + shared)
export const getPhraseBoards = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    // Get owned boards
    const ownedBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    // Get shared boards
    const sharedBoardLinks = await ctx.db
      .query('sharedBoards')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', identity.subject))
      .collect();

    const sharedBoards = await Promise.all(
      sharedBoardLinks.map(async (link) => {
        const board = await ctx.db.get(link.boardId);
        if (!board) return null;

        // Get caregiver profile for display
        const caregiverProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user_id', (q) => q.eq('userId', link.caregiverId))
          .first();

        return {
          board,
          accessLevel: link.accessLevel,
          sharedBy: caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver',
        };
      })
    );

    // Get phrases for owned boards
    const ownedBoardsWithPhrases = await Promise.all(
      ownedBoards.map(async (board) => {
        const phraseBoardPhrases = await ctx.db
          .query('phraseBoardPhrases')
          .withIndex('by_board', (q) => q.eq('boardId', board._id))
          .collect();

        const phrases = await Promise.all(
          phraseBoardPhrases.map(async (pbp) => {
            const phrase = await ctx.db.get(pbp.phraseId);
            return { ...pbp, phrase };
          })
        );

        return {
          ...board,
          phrase_board_phrases: phrases,
          isShared: false,
          accessLevel: 'edit' as const,
          sharedBy: null,
        };
      })
    );

    // Get phrases for shared boards
    const sharedBoardsWithPhrases = await Promise.all(
      sharedBoards
        .filter((sb): sb is NonNullable<typeof sb> => sb !== null)
        .map(async ({ board, accessLevel, sharedBy }) => {
          const phraseBoardPhrases = await ctx.db
            .query('phraseBoardPhrases')
            .withIndex('by_board', (q) => q.eq('boardId', board._id))
            .collect();

          const phrases = await Promise.all(
            phraseBoardPhrases.map(async (pbp) => {
              const phrase = await ctx.db.get(pbp.phraseId);
              return { ...pbp, phrase };
            })
          );

          return {
            ...board,
            phrase_board_phrases: phrases,
            isShared: true,
            accessLevel,
            sharedBy,
          };
        })
    );

    // Combine and return all boards
    return [...ownedBoardsWithPhrases, ...sharedBoardsWithPhrases];
  },
});

// Query: Get a single phrase board by ID (owned or shared)
export const getPhraseBoard = query({
  args: { id: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const board = await ctx.db.get(args.id);
    if (!board) {
      return null;
    }

    // Check if user owns the board
    const isOwner = board.userId === identity.subject;

    // Check if board is shared with user
    let shareInfo = null;
    if (!isOwner) {
      const sharedBoardLinks = await ctx.db
        .query('sharedBoards')
        .withIndex('by_board', (q) => q.eq('boardId', args.id))
        .collect();

      const share = sharedBoardLinks.find(
        (link) => link.communicatorId === identity.subject
      );

      if (!share) {
        return null; // User has no access
      }

      const caregiverProfile = await ctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('userId', share.caregiverId))
        .first();

      shareInfo = {
        accessLevel: share.accessLevel,
        sharedBy: caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver',
      };
    }

    const phraseBoardPhrases = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();

    const phrases = await Promise.all(
      phraseBoardPhrases.map(async (pbp) => {
        const phrase = await ctx.db.get(pbp.phraseId);
        return { ...pbp, phrase };
      })
    );

    return {
      ...board,
      phrase_board_phrases: phrases,
      isShared: !isOwner,
      accessLevel: isOwner ? 'edit' : shareInfo?.accessLevel,
      sharedBy: shareInfo?.sharedBy || null,
    };
  },
});

// Mutation: Add a new phrase board
export const addPhraseBoard = mutation({
  args: {
    name: v.string(),
    position: v.number(),
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

    // Verify board access (owner or shared with edit access)
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const isOwner = board.userId === identity.subject;
    let hasEditAccess = false;

    if (!isOwner) {
      // Check if board is shared with edit access
      const sharedBoardLinks = await ctx.db
        .query('sharedBoards')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .collect();

      const share = sharedBoardLinks.find(
        (link) => link.communicatorId === identity.subject && link.accessLevel === 'edit'
      );
      hasEditAccess = !!share;
    }

    if (!isOwner && !hasEditAccess) {
      throw new Error('Unauthorized - board');
    }

    await ctx.db.insert('phraseBoardPhrases', {
      phraseId: args.phraseId,
      boardId: args.boardId,
    });
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
