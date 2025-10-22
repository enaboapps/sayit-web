import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdentity } from "./users";

// Query: Get current user's profile
export const getProfile = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
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
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        fullName: args.fullName,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        email: args.email,
        fullName: args.fullName,
      });
    }
  },
});

// Mutation: Update subscription status
export const updateSubscription = mutation({
  args: {
    userId: v.string(),
    subscriptionStatus: v.optional(v.string()),
    subscriptionCancelAtPeriodEnd: v.optional(v.boolean()),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const { userId, ...updates } = args;
    await ctx.db.patch(profile._id, updates);
  },
});

// Mutation: Delete user profile
export const deleteProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

// Query: Check subscription status
export const getSubscriptionStatus = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return { isActive: false, bypassEnabled: false };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) {
      return { isActive: false, bypassEnabled: false };
    }

    const bypassEnabled = profile.bypassSubscriptionCheck ?? false;
    const isActive =
      bypassEnabled ||
      profile.subscriptionStatus === "active" ||
      profile.subscriptionStatus === "trialing";

    return {
      isActive,
      bypassEnabled,
      status: profile.subscriptionStatus,
      cancelAtPeriodEnd: profile.subscriptionCancelAtPeriodEnd,
      stripeCustomerId: profile.stripeCustomerId,
    };
  },
});
