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

// Mutation: Delete user profile
export const deleteProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    if (profile) {
      await ctx.db.delete(profile._id);
    }
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
