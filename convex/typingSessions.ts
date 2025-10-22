import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdentity } from "./users";

// Query: Get a typing session by session key (public access for viewers)
export const getTypingSession = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const session = await ctx.db
      .query("typingSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .first();

    return session;
  },
});

// Query: Get all typing sessions for current user
export const getUserTypingSessions = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const now = Date.now();

    return await ctx.db
      .query("typingSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();
  },
});

// Mutation: Create a new typing session
export const createTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Session expires in 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const sessionId = await ctx.db.insert("typingSessions", {
      userId: identity.subject,
      sessionKey: args.sessionKey,
      content: "",
      expiresAt,
    });

    return sessionId;
  },
});

// Mutation: Update typing session content (real-time updates)
export const updateTypingSessionContent = mutation({
  args: {
    sessionKey: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const session = await ctx.db
      .query("typingSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!session || session.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(session._id, {
      content: args.content,
    });
  },
});

// Mutation: Delete a typing session
export const deleteTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const session = await ctx.db
      .query("typingSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!session || session.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(session._id);
  },
});
