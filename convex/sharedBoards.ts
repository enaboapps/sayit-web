import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get all boards shared with the current communicator
export const getSharedBoardsForCommunicator = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const sharedBoards = await ctx.db
      .query('sharedBoards')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', identity.subject))
      .collect();

    // Get board details and caregiver info for each shared board
    const boards = await Promise.all(
      sharedBoards.map(async (share) => {
        const board = await ctx.db.get(share.boardId);
        const caregiverProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user_id', (q) => q.eq('userId', share.caregiverId))
          .first();

        if (!board) {
          return null;
        }

        return {
          _id: share._id,
          boardId: share.boardId,
          board: {
            _id: board._id,
            name: board.name,
            position: board.position,
          },
          accessLevel: share.accessLevel,
          sharedAt: share.sharedAt,
          caregiver: caregiverProfile
            ? {
                fullName: caregiverProfile.fullName,
                email: caregiverProfile.email,
              }
            : null,
        };
      })
    );

    return boards.filter((b) => b !== null);
  },
});

// Query: Get all shares for a specific board (for caregiver)
export const getBoardShares = query({
  args: {
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    // Verify the user owns the board
    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      return [];
    }

    const shares = await ctx.db
      .query('sharedBoards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    // Get communicator profile details
    const sharesWithProfiles = await Promise.all(
      shares.map(async (share) => {
        const communicatorProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user_id', (q) => q.eq('userId', share.communicatorId))
          .first();

        return {
          _id: share._id,
          communicatorId: share.communicatorId,
          accessLevel: share.accessLevel,
          sharedAt: share.sharedAt,
          communicator: communicatorProfile
            ? {
                fullName: communicatorProfile.fullName,
                email: communicatorProfile.email,
              }
            : null,
        };
      })
    );

    return sharesWithProfiles;
  },
});

// Query: Get boards shared with a specific client (for caregiver dashboard)
export const getSharedBoardsForClient = query({
  args: {
    communicatorId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const sharedBoards = await ctx.db
      .query('sharedBoards')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    // Filter to only this communicator's boards
    const clientBoards = sharedBoards.filter(
      (sb) => sb.communicatorId === args.communicatorId
    );

    // Get board details
    const boards = await Promise.all(
      clientBoards.map(async (share) => {
        const board = await ctx.db.get(share.boardId);
        if (!board) return null;

        return {
          _id: share._id,
          boardId: share.boardId,
          board: {
            _id: board._id,
            name: board.name,
            position: board.position,
          },
          accessLevel: share.accessLevel,
          sharedAt: share.sharedAt,
        };
      })
    );

    return boards.filter((b) => b !== null);
  },
});

// Mutation: Share a board with a client
export const shareBoard = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    communicatorId: v.string(),
    accessLevel: v.union(v.literal('view'), v.literal('edit')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify the user owns the board
    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Board not found or unauthorized');
    }

    // Verify the client relationship exists
    const relationships = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    const isClient = relationships.some(
      (rel) => rel.communicatorId === args.communicatorId
    );

    if (!isClient) {
      throw new Error('User is not your client');
    }

    // Check if already shared
    const existingShares = await ctx.db
      .query('sharedBoards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const alreadyShared = existingShares.find(
      (share) => share.communicatorId === args.communicatorId
    );

    if (alreadyShared) {
      throw new Error('Board is already shared with this client');
    }

    // Create the share
    return await ctx.db.insert('sharedBoards', {
      boardId: args.boardId,
      caregiverId: identity.subject,
      communicatorId: args.communicatorId,
      accessLevel: args.accessLevel,
      sharedAt: Date.now(),
    });
  },
});

// Mutation: Update access level for a shared board
export const updateBoardAccess = mutation({
  args: {
    shareId: v.id('sharedBoards'),
    accessLevel: v.union(v.literal('view'), v.literal('edit')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const share = await ctx.db.get(args.shareId);
    if (!share || share.caregiverId !== identity.subject) {
      throw new Error('Share not found or unauthorized');
    }

    await ctx.db.patch(args.shareId, {
      accessLevel: args.accessLevel,
    });

    return args.shareId;
  },
});

// Mutation: Unshare a board from a client
export const unshareBoard = mutation({
  args: {
    shareId: v.id('sharedBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const share = await ctx.db.get(args.shareId);
    if (!share || share.caregiverId !== identity.subject) {
      throw new Error('Share not found or unauthorized');
    }

    await ctx.db.delete(args.shareId);
  },
});

// Query: Check if current user has access to a board (and what level)
export const getBoardAccess = query({
  args: {
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return { hasAccess: false, accessLevel: null, isOwner: false };
    }

    // Check if user owns the board
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      return { hasAccess: false, accessLevel: null, isOwner: false };
    }

    if (board.userId === identity.subject) {
      return { hasAccess: true, accessLevel: 'edit' as const, isOwner: true };
    }

    // Check if board is shared with user
    const shares = await ctx.db
      .query('sharedBoards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const share = shares.find((s) => s.communicatorId === identity.subject);

    if (share) {
      return { hasAccess: true, accessLevel: share.accessLevel, isOwner: false };
    }

    return { hasAccess: false, accessLevel: null, isOwner: false };
  },
});
