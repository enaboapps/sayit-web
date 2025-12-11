import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get profile for a specific user (used by server-side routes)
export const getProfileByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();
  },
});

// Query: Get profile by email (used for finding clients)
export const getProfileByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();
  },
});

// Query: Get current user's profile
export const getProfile = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    return profile;
  },
});

// Mutation: Create or update user profile (called by Clerk webhook)
export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        fullName: args.fullName,
      });
      return existing._id;
    } else {
      return await ctx.db.insert('profiles', {
        userId: args.userId,
        email: args.email,
        fullName: args.fullName,
      });
    }
  },
});

// Mutation: Delete user profile with full relationship cleanup
// This handles cascade deletion of all related data when a user account is deleted
export const deleteProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;

    // 1. Get user's profile to check their role
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .first();

    if (!profile) {
      return; // No profile to delete
    }

    // 2. Clean up caregiverClients relationships (as caregiver)
    const asCaregiver = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', userId))
      .collect();

    for (const rel of asCaregiver) {
      await ctx.db.delete(rel._id);
    }

    // 3. Clean up caregiverClients relationships (as communicator)
    const asCommunicator = await ctx.db
      .query('caregiverClients')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', userId))
      .collect();

    for (const rel of asCommunicator) {
      await ctx.db.delete(rel._id);
    }

    // 4. Delete boards created for clients (forClientId set) and their phrases
    const userBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .collect();

    for (const board of userBoards) {
      if (board.forClientId) {
        // Delete phrase associations for this board
        const phraseLinks = await ctx.db
          .query('phraseBoardPhrases')
          .withIndex('by_board', (q) => q.eq('boardId', board._id))
          .collect();

        for (const link of phraseLinks) {
          await ctx.db.delete(link._id);
        }

        // Delete the board
        await ctx.db.delete(board._id);
      }
    }

    // 5. Finally delete the profile
    await ctx.db.delete(profile._id);
  },
});

// Mutation: Set user role (caregiver or communicator)
// Creates profile if it doesn't exist (handles case where webhook hasn't fired yet)
export const setRole = mutation({
  args: {
    role: v.union(v.literal('caregiver'), v.literal('communicator')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!profile) {
      // Create profile if it doesn't exist
      const email = identity.email ?? '';
      const fullName = identity.name ?? undefined;
      return await ctx.db.insert('profiles', {
        userId: identity.subject,
        email,
        fullName,
        role: args.role,
      });
    }

    await ctx.db.patch(profile._id, {
      role: args.role,
    });

    return profile._id;
  },
});

// Mutation: Change user role with relationship cleanup
// This is a destructive operation - removes all caregiver/client relationships
export const changeRole = mutation({
  args: {
    newRole: v.union(v.literal('caregiver'), v.literal('communicator')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.role === args.newRole) {
      throw new Error('Already have this role');
    }

    const userId = identity.subject;

    // Clean up relationships based on current role
    if (profile.role === 'caregiver') {
      // Switching FROM caregiver: remove all clients and boards created for them
      const clientRelationships = await ctx.db
        .query('caregiverClients')
        .withIndex('by_caregiver', (q) => q.eq('caregiverId', userId))
        .collect();

      // Delete boards created for clients (forClientId is set)
      const boardsForClients = await ctx.db
        .query('phraseBoards')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .collect();

      for (const board of boardsForClients) {
        if (board.forClientId) {
          // Delete phrase associations first
          const phraseLinks = await ctx.db
            .query('phraseBoardPhrases')
            .withIndex('by_board', (q) => q.eq('boardId', board._id))
            .collect();
          for (const link of phraseLinks) {
            await ctx.db.delete(link._id);
          }
          await ctx.db.delete(board._id);
        }
      }

      // Delete client relationships
      for (const rel of clientRelationships) {
        await ctx.db.delete(rel._id);
      }
    } else if (profile.role === 'communicator') {
      // Switching FROM communicator: remove relationship with caregiver
      const caregiverRelationships = await ctx.db
        .query('caregiverClients')
        .withIndex('by_communicator', (q) => q.eq('communicatorId', userId))
        .collect();

      for (const rel of caregiverRelationships) {
        await ctx.db.delete(rel._id);
      }
    }

    // Update the role
    await ctx.db.patch(profile._id, {
      role: args.newRole,
    });

    return profile._id;
  },
});

// Query: Check subscription status (now uses Clerk metadata via hook)
// This query is kept for backward compatibility but primarily returns bypass status
export const getSubscriptionStatus = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return { isActive: false, bypassEnabled: false };
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!profile) {
      return { isActive: false, bypassEnabled: false };
    }

    const bypassEnabled = profile.bypassSubscriptionCheck ?? false;

    return {
      isActive: bypassEnabled, // Only return true if bypass is enabled
      bypassEnabled,
    };
  },
});
