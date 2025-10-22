import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdentity } from "./users";

// Query: Get all phrase boards for current user
export const getPhraseBoards = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const boards = await ctx.db
      .query("phraseBoards")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();

    // Get phrases for each board
    const boardsWithPhrases = await Promise.all(
      boards.map(async (board) => {
        const phraseBoardPhrases = await ctx.db
          .query("phraseBoardPhrases")
          .withIndex("by_board", (q) => q.eq("boardId", board._id))
          .collect();

        const phrases = await Promise.all(
          phraseBoardPhrases.map(async (pbp) => {
            const phrase = await ctx.db.get(pbp.phraseId);
            return { ...pbp, phrase };
          })
        );

        return { ...board, phrase_board_phrases: phrases };
      })
    );

    return boardsWithPhrases;
  },
});

// Query: Get a single phrase board by ID
export const getPhraseBoard = query({
  args: { id: v.id("phraseBoards") },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const board = await ctx.db.get(args.id);
    if (!board || board.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const phraseBoardPhrases = await ctx.db
      .query("phraseBoardPhrases")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();

    const phrases = await Promise.all(
      phraseBoardPhrases.map(async (pbp) => {
        const phrase = await ctx.db.get(pbp.phraseId);
        return { ...pbp, phrase };
      })
    );

    return { ...board, phrase_board_phrases: phrases };
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
      throw new Error("Unauthenticated");
    }

    const boardId = await ctx.db.insert("phraseBoards", {
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
    id: v.id("phraseBoards"),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const { id, ...updates } = args;

    // Verify ownership
    const board = await ctx.db.get(id);
    if (!board || board.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a phrase board
export const deletePhraseBoard = mutation({
  args: {
    id: v.id("phraseBoards"),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Verify ownership
    const board = await ctx.db.get(args.id);
    if (!board || board.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Delete all phrase associations
    const phraseBoardPhrases = await ctx.db
      .query("phraseBoardPhrases")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
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
    phraseId: v.id("phrases"),
    boardId: v.id("phraseBoards"),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Verify phrase and board ownership
    const phrase = await ctx.db.get(args.phraseId);
    const board = await ctx.db.get(args.boardId);

    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error("Unauthorized - phrase");
    }
    if (!board || board.userId !== identity.subject) {
      throw new Error("Unauthorized - board");
    }

    await ctx.db.insert("phraseBoardPhrases", {
      phraseId: args.phraseId,
      boardId: args.boardId,
    });
  },
});

// Mutation: Remove a phrase from a board
export const removePhraseFromBoard = mutation({
  args: {
    phraseId: v.id("phrases"),
    boardId: v.id("phraseBoards"),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const link = await ctx.db
      .query("phraseBoardPhrases")
      .withIndex("by_phrase", (q) => q.eq("phraseId", args.phraseId))
      .filter((q) => q.eq(q.field("boardId"), args.boardId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});
