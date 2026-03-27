import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

const MAX_STORED_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 500;
const DUPLICATE_WINDOW_MS = 5000;

export const getRecentMessages = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const safeLimit = Math.max(1, Math.min(20, Math.floor(args.limit)));
    const entries = await ctx.db
      .query('conversationHistory')
      .withIndex('by_user_id_and_captured_at', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(safeLimit);

    return entries;
  },
});

export const recordMessage = mutation({
  args: {
    text: v.string(),
    captureSource: v.union(v.literal('speak'), v.literal('speakAndClear'), v.literal('clear')),
    tabId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const trimmedText = args.text.trim();
    if (!trimmedText) {
      throw new Error('Text is required');
    }

    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Text must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
    }

    const now = Date.now();

    // Get the most recent entry for duplicate detection using the compound index
    const [latestEntry] = await ctx.db
      .query('conversationHistory')
      .withIndex('by_user_id_and_captured_at', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(1);

    if (
      latestEntry
      && latestEntry.text === trimmedText
      && now - latestEntry.capturedAt < DUPLICATE_WINDOW_MS
    ) {
      return latestEntry._id;
    }

    const id = await ctx.db.insert('conversationHistory', {
      userId: identity.subject,
      text: trimmedText,
      capturedAt: now,
      captureSource: args.captureSource,
      tabId: args.tabId,
    });

    // Fetch entries beyond the max to prune old ones
    const allEntries = await ctx.db
      .query('conversationHistory')
      .withIndex('by_user_id_and_captured_at', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();

    const staleEntries = allEntries.slice(MAX_STORED_MESSAGES);

    for (const entry of staleEntries) {
      await ctx.db.delete(entry._id);
    }

    return id;
  },
});
