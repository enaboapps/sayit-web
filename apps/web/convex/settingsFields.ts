import { v } from 'convex/values';

// Validators for the synced settings, shared by the userSettings table
// (schema.ts) and the initializeSettings/updateSettings mutations
// (userSettings.ts). To add a synced setting, add it to one of the groups
// below, then to the client settings (app/contexts/settings).

const enterKeyAction = v.union(v.literal('newline'), v.literal('speak'), v.literal('clear'), v.literal('speakAndClear'));

// Settings every row has and every client sends when creating settings.
export const coreSettingsFields = {
  speechRate: v.number(),
  speechPitch: v.number(),
  speechVolume: v.number(),
  speechVoice: v.string(),
  enterKeyBehavior: enterKeyAction,
  ttsVoiceId: v.string(),
  ttsStability: v.number(),
  ttsSimilarityBoost: v.number(),
  typingAreaVisible: v.boolean(),
  typingAreaExpanded: v.boolean(),
  typingShareFontSize: v.number(),
};

// Added after launch: rows saved before then may lack them, but clients send
// them when creating settings.
export const laterSettingsFields = {
  doubleEnterEnabled: v.boolean(),
  doubleEnterAction: enterKeyAction,
  doubleEnterTimeoutMs: v.number(),
  aiReplySuggestionsEnabled: v.boolean(),
  messageCaptureMode: v.union(
    v.literal('disabled'),
    v.literal('clearOnly'),
    v.literal('speakOnly'),
    v.literal('speakAndClearOnly'),
    v.literal('speakAny'),
  ),
};

// Optional in rows and when creating settings.
export const optionalSettingsFields = {
  ttsModelPreference: v.optional(v.union(v.literal('fast'), v.literal('high_quality'))),
  usePhraseBar: v.optional(v.boolean()),
  speakPhrasesOnTap: v.optional(v.boolean()),
  selectedBoardId: v.optional(v.string()),
  typingTabs: v.optional(v.string()), // JSON stringified TypingTabsState
  activeTypingTabId: v.optional(v.string()),
  typingDockMode: v.optional(v.union(v.literal('expanded'), v.literal('fullscreen'), v.literal('minimized'))),
};

// The stored provider. The mutations also accept the removed 'custom'
// provider from old clients (see userSettings.ts).
export const storedTtsProvider = v.union(v.literal('browser'), v.literal('elevenlabs'), v.literal('azure'), v.literal('gemini'));

// Font size in pixels (8-72). Rows from before the slider may still hold a size name.
export const legacyTextSize = v.union(
  v.number(),
  v.literal('small'),
  v.literal('medium'),
  v.literal('large'),
  v.literal('xlarge'),
);

// Every synced setting as the userSettings table stores it.
export const userSettingsTableFields = {
  textSize: legacyTextSize,
  ttsProvider: storedTtsProvider,
  ...coreSettingsFields,
  ...v.object(laterSettingsFields).partial().fields,
  ...optionalSettingsFields,
};
