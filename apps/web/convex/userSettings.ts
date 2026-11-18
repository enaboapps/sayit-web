import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserIdentity, requireUser } from './users';
import { withoutRemovedTTSProvider } from '../lib/tts-types';
import { coreSettingsFields, laterSettingsFields, optionalSettingsFields } from './settingsFields';

// 'custom' and prepareSpeechWhileTyping belonged to the custom voice providers
// removed in v5.4.0. Clients cached before then may still send them, so they're
// accepted here; 'custom' is stored as browser speech and the flag is ignored.
// The schema no longer allows either.
const ttsProviderArg = v.union(v.literal('browser'), v.literal('elevenlabs'), v.literal('azure'), v.literal('gemini'), v.literal('custom'));
const legacySettingsArgs = {
  prepareSpeechWhileTyping: v.optional(v.boolean()),
};

// What a client sends to create settings. Validators come from settingsFields.ts.
const settingsArgs = {
  textSize: v.number(), // Font size in pixels (8-72)
  ttsProvider: ttsProviderArg,
  ...coreSettingsFields,
  ...laterSettingsFields,
  ...optionalSettingsFields,
};

// Allowed ranges for numeric settings, with the bounds as shown in errors.
const NUMBER_RANGES = {
  textSize: [8, 72, '8 and 72'],
  speechRate: [0.1, 2.0, '0.1 and 2.0'],
  speechPitch: [0.1, 2.0, '0.1 and 2.0'],
  speechVolume: [0.0, 1.0, '0.0 and 1.0'],
  doubleEnterTimeoutMs: [1000, 10000, '1000 and 10000'],
  ttsStability: [0.0, 1.0, '0.0 and 1.0'],
  ttsSimilarityBoost: [0.0, 1.0, '0.0 and 1.0'],
  typingShareFontSize: [12, 64, '12 and 64'],
} as const;

// Throws for any numeric setting that is present and out of range.
function validateNumberRanges(settings: Partial<Record<keyof typeof NUMBER_RANGES, number>>) {
  for (const [name, [min, max, label]] of Object.entries(NUMBER_RANGES)) {
    const value = settings[name as keyof typeof NUMBER_RANGES];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new Error(`${name} must be a valid number between ${label}`);
    }
  }
}

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
    ...settingsArgs,
    ...legacySettingsArgs,
  },
  handler: async (ctx, rawArgs) => {
    const identity = await requireUser(ctx);

    const { prepareSpeechWhileTyping: _removed, ...legacyArgs } = rawArgs;
    void _removed;
    const args = withoutRemovedTTSProvider(legacyArgs) as typeof legacyArgs & { ttsProvider: 'browser' | 'elevenlabs' | 'azure' | 'gemini' };

    validateNumberRanges(args);

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
      ...args,
      userId: identity.subject,
      lastSyncedAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to update settings (supports partial updates)
export const updateSettings = mutation({
  args: {
    ...v.object(settingsArgs).partial().fields,
    ...legacySettingsArgs,
    lastSyncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!settings) {
      throw new Error('Settings not initialized. Call initializeSettings first.');
    }

    const { lastSyncedAt, prepareSpeechWhileTyping: _removed, ...legacyUpdates } = args;
    void _removed;
    const updates = withoutRemovedTTSProvider(legacyUpdates);

    // Validate lastSyncedAt
    if (!Number.isFinite(lastSyncedAt) || lastSyncedAt < 0) {
      throw new Error('lastSyncedAt must be a valid non-negative timestamp');
    }

    validateNumberRanges(updates);

    // Only the settings that were provided are changed.
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
      lastSyncedAt,
    };
    const provided = updates as Record<string, unknown>;
    for (const name of Object.keys(settingsArgs)) {
      if (provided[name] !== undefined) updateData[name] = provided[name];
    }

    await ctx.db.patch(settings._id, updateData);

    return settings._id;
  },
});
