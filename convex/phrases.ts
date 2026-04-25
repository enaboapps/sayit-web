import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get all phrases for current user
export const getPhrases = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    return await ctx.db
      .query('phrases')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

// Query: Get a single phrase by ID
export const getPhrase = query({
  args: { id: v.id('phrases') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const phrase = await ctx.db.get(args.id);
    if (!phrase || phrase.userId !== identity.subject) {
      return null;
    }

    return phrase;
  },
});

// Mutation: Add a new phrase
export const addPhrase = mutation({
  args: {
    text: v.string(),
    position: v.number(),
    symbolStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    let symbolUrl: string | undefined;
    if (args.symbolStorageId) {
      symbolUrl = await ctx.storage.getUrl(args.symbolStorageId) ?? undefined;
    }

    const phraseId = await ctx.db.insert('phrases', {
      userId: identity.subject,
      text: args.text,
      position: args.position,
      symbolStorageId: args.symbolStorageId,
      symbolUrl,
    });

    return phraseId;
  },
});

// Mutation: Update a phrase
export const updatePhrase = mutation({
  args: {
    id: v.id('phrases'),
    text: v.optional(v.string()),
    position: v.optional(v.number()),
    symbolStorageId: v.optional(v.id('_storage')),
    removeSymbol: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const { id, removeSymbol, symbolStorageId, ...updates } = args;

    // Verify ownership
    const phrase = await ctx.db.get(id);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    const patch: Record<string, unknown> = { ...updates };

    if (removeSymbol) {
      // Delete old symbol from storage
      if (phrase.symbolStorageId) {
        await ctx.storage.delete(phrase.symbolStorageId);
      }
      patch.symbolStorageId = undefined;
      patch.symbolUrl = undefined;
    } else if (symbolStorageId) {
      // Delete old symbol if replacing
      if (phrase.symbolStorageId) {
        await ctx.storage.delete(phrase.symbolStorageId);
      }
      patch.symbolStorageId = symbolStorageId;
      patch.symbolUrl = await ctx.storage.getUrl(symbolStorageId) ?? undefined;
    }

    await ctx.db.patch(id, patch);
  },
});

// Mutation: Delete a phrase
export const deletePhrase = mutation({
  args: {
    id: v.id('phrases'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify ownership
    const phrase = await ctx.db.get(args.id);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Clean up symbol from storage
    if (phrase.symbolStorageId) {
      await ctx.storage.delete(phrase.symbolStorageId);
    }

    // Cascade: remove every boardTile of kind='phrase' that references this
    // phrase across all boards it's placed on. Without this sweep, deleting
    // a phrase would leave orphaned tile rows whose hydrated `phrase` field
    // is null, which the UI defensively filters out — but the DB rows would
    // accumulate. Also clean up any pre-migration phraseBoardPhrases rows.
    const referencingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.id))
      .collect();
    for (const tile of referencingTiles) {
      await ctx.db.delete(tile._id);
    }
    const legacyLinks = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.id))
      .collect();
    for (const link of legacyLinks) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.id);
  },
});
