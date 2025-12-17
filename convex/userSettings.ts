import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserIdentity } from './users';

// Default settings that match SettingsContext defaults
const defaultSettings = {
  textSize: 'medium' as const,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  speechVoice: '',
  enterKeyBehavior: 'newline' as const,
  ttsProvider: 'browser' as const,
  ttsVoiceId: '',
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
  typingAreaVisible: true,
  typingAreaExpanded: false,
  selectedBoardId: null,
  typingShareFontSize: 18,
};

// Query to get user settings
export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    return settings;
  },
});

// Mutation to initialize settings (called on first sign-in or when settings don't exist)
export const initializeSettings = mutation({
  args: {
    textSize: v.union(v.literal('small'), v.literal('medium'), v.literal('large'), v.literal('xlarge')),
    speechRate: v.number(),
    speechPitch: v.number(),
    speechVolume: v.number(),
    speechVoice: v.string(),
    enterKeyBehavior: v.union(v.literal('newline'), v.literal('speak'), v.literal('clear'), v.literal('speakAndClear')),
    ttsProvider: v.union(v.literal('browser'), v.literal('elevenlabs')),
    ttsVoiceId: v.string(),
    ttsStability: v.number(),
    ttsSimilarityBoost: v.number(),
    typingAreaVisible: v.boolean(),
    typingAreaExpanded: v.boolean(),
    selectedBoardId: v.optional(v.string()),
    typingShareFontSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Check if settings already exist
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (existing) {
      return existing._id; // Already initialized
    }

    const now = Date.now();
    return await ctx.db.insert('userSettings', {
      userId: identity.subject,
      textSize: args.textSize,
      speechRate: args.speechRate,
      speechPitch: args.speechPitch,
      speechVolume: args.speechVolume,
      speechVoice: args.speechVoice,
      enterKeyBehavior: args.enterKeyBehavior,
      ttsProvider: args.ttsProvider,
      ttsVoiceId: args.ttsVoiceId,
      ttsStability: args.ttsStability,
      ttsSimilarityBoost: args.ttsSimilarityBoost,
      typingAreaVisible: args.typingAreaVisible,
      typingAreaExpanded: args.typingAreaExpanded,
      selectedBoardId: args.selectedBoardId,
      typingShareFontSize: args.typingShareFontSize,
      lastSyncedAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to update settings (supports partial updates)
export const updateSettings = mutation({
  args: {
    textSize: v.optional(v.union(v.literal('small'), v.literal('medium'), v.literal('large'), v.literal('xlarge'))),
    speechRate: v.optional(v.number()),
    speechPitch: v.optional(v.number()),
    speechVolume: v.optional(v.number()),
    speechVoice: v.optional(v.string()),
    enterKeyBehavior: v.optional(v.union(v.literal('newline'), v.literal('speak'), v.literal('clear'), v.literal('speakAndClear'))),
    ttsProvider: v.optional(v.union(v.literal('browser'), v.literal('elevenlabs'))),
    ttsVoiceId: v.optional(v.string()),
    ttsStability: v.optional(v.number()),
    ttsSimilarityBoost: v.optional(v.number()),
    typingAreaVisible: v.optional(v.boolean()),
    typingAreaExpanded: v.optional(v.boolean()),
    selectedBoardId: v.optional(v.string()),
    typingShareFontSize: v.optional(v.number()),
    lastSyncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!settings) {
      throw new Error('Settings not initialized. Call initializeSettings first.');
    }

    const { lastSyncedAt, ...updates } = args;

    // Build update object with only the fields that were provided
    const updateData: any = {
      updatedAt: Date.now(),
      lastSyncedAt,
    };

    // Add each optional field if it was provided
    if (updates.textSize !== undefined) updateData.textSize = updates.textSize;
    if (updates.speechRate !== undefined) updateData.speechRate = updates.speechRate;
    if (updates.speechPitch !== undefined) updateData.speechPitch = updates.speechPitch;
    if (updates.speechVolume !== undefined) updateData.speechVolume = updates.speechVolume;
    if (updates.speechVoice !== undefined) updateData.speechVoice = updates.speechVoice;
    if (updates.enterKeyBehavior !== undefined) updateData.enterKeyBehavior = updates.enterKeyBehavior;
    if (updates.ttsProvider !== undefined) updateData.ttsProvider = updates.ttsProvider;
    if (updates.ttsVoiceId !== undefined) updateData.ttsVoiceId = updates.ttsVoiceId;
    if (updates.ttsStability !== undefined) updateData.ttsStability = updates.ttsStability;
    if (updates.ttsSimilarityBoost !== undefined) updateData.ttsSimilarityBoost = updates.ttsSimilarityBoost;
    if (updates.typingAreaVisible !== undefined) updateData.typingAreaVisible = updates.typingAreaVisible;
    if (updates.typingAreaExpanded !== undefined) updateData.typingAreaExpanded = updates.typingAreaExpanded;
    if (updates.selectedBoardId !== undefined) updateData.selectedBoardId = updates.selectedBoardId;
    if (updates.typingShareFontSize !== undefined) updateData.typingShareFontSize = updates.typingShareFontSize;

    await ctx.db.patch(settings._id, updateData);

    return settings._id;
  },
});
