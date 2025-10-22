import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdentity } from "./users";

// Query: Get all phrases for current user
export const getPhrases = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    return await ctx.db
      .query("phrases")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// Query: Get a single phrase by ID
export const getPhrase = query({
  args: { id: v.id("phrases") },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const phrase = await ctx.db.get(args.id);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return phrase;
  },
});

// Mutation: Add a new phrase
export const addPhrase = mutation({
  args: {
    text: v.string(),
    frequency: v.number(),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const phraseId = await ctx.db.insert("phrases", {
      userId: identity.subject,
      text: args.text,
      frequency: args.frequency,
      position: args.position,
    });

    return phraseId;
  },
});

// Mutation: Update a phrase
export const updatePhrase = mutation({
  args: {
    id: v.id("phrases"),
    text: v.optional(v.string()),
    frequency: v.optional(v.number()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const { id, ...updates } = args;

    // Verify ownership
    const phrase = await ctx.db.get(id);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a phrase
export const deletePhrase = mutation({
  args: {
    id: v.id("phrases"),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Verify ownership
    const phrase = await ctx.db.get(args.id);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
