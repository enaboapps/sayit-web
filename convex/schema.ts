import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  profiles: defineTable({
    userId: v.string(), // Clerk user ID
    email: v.string(),
    fullName: v.optional(v.string()),
    bypassSubscriptionCheck: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal('caregiver'), v.literal('communicator'))),
  })
    .index('by_user_id', ['userId'])
    .index('by_email', ['email']),

  caregiverClients: defineTable({
    caregiverId: v.string(), // Clerk user ID of caregiver
    communicatorId: v.string(), // Clerk user ID of communicator
    createdAt: v.number(),
  })
    .index('by_caregiver', ['caregiverId'])
    .index('by_communicator', ['communicatorId']),

  connectionRequests: defineTable({
    caregiverId: v.string(), // Clerk user ID of caregiver requesting connection
    communicatorId: v.string(), // Clerk user ID of communicator being requested
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('rejected')),
    createdAt: v.number(),
  })
    .index('by_caregiver', ['caregiverId'])
    .index('by_communicator', ['communicatorId']),

  phrases: defineTable({
    userId: v.string(), // Clerk user ID
    text: v.string(),
    frequency: v.optional(v.number()),
    position: v.number(),
    symbolStorageId: v.optional(v.id('_storage')),
    symbolUrl: v.optional(v.string()),
  }).index('by_user_id', ['userId']),

  phraseBoards: defineTable({
    userId: v.string(), // Clerk user ID (creator/owner)
    name: v.string(),
    position: v.number(),
    forClientId: v.optional(v.string()), // If set, this board is for a specific client
    clientAccessLevel: v.optional(v.union(v.literal('view'), v.literal('edit'))), // Client's permission level
  })
    .index('by_user_id', ['userId'])
    .index('by_client', ['forClientId']),

  phraseBoardPhrases: defineTable({
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
    position: v.optional(v.number()),
  })
    .index('by_phrase', ['phraseId'])
    .index('by_board', ['boardId']),

  typingSessions: defineTable({
    userId: v.string(), // Clerk user ID
    sessionKey: v.string(),
    content: v.string(),
    expiresAt: v.number(), // Unix timestamp
  })
    .index('by_user_id', ['userId'])
    .index('by_session_key', ['sessionKey']),

  userSettings: defineTable({
    userId: v.string(), // Clerk user ID

    // Main Settings (from SettingsContext)
    // Accepts both old enum values (for migration) and new number values
    textSize: v.union(
      v.number(),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('xlarge')
    ),
    speechRate: v.number(),
    speechPitch: v.number(),
    speechVolume: v.number(),
    speechVoice: v.string(),
    enterKeyBehavior: v.union(v.literal('newline'), v.literal('speak'), v.literal('clear'), v.literal('speakAndClear')),
    doubleEnterEnabled: v.optional(v.boolean()),
    doubleEnterAction: v.optional(v.union(v.literal('newline'), v.literal('speak'), v.literal('clear'), v.literal('speakAndClear'))),
    doubleEnterTimeoutMs: v.optional(v.number()),
    ttsProvider: v.union(v.literal('browser'), v.literal('elevenlabs'), v.literal('azure'), v.literal('gemini')),
    ttsVoiceId: v.string(),
    ttsStability: v.number(),
    ttsSimilarityBoost: v.number(),
    ttsModelPreference: v.optional(v.union(v.literal('fast'), v.literal('high_quality'))),
    aiReplySuggestionsEnabled: v.optional(v.boolean()),
    messageCaptureMode: v.optional(
      v.union(
        v.literal('disabled'),
        v.literal('clearOnly'),
        v.literal('speakOnly'),
        v.literal('speakAndClearOnly'),
        v.literal('speakAny')
      )
    ),

    // UI Preferences (consolidated from various components)
    typingAreaVisible: v.boolean(),
    typingAreaExpanded: v.boolean(),
    selectedBoardId: v.optional(v.string()),
    typingShareFontSize: v.number(),
    typingTabs: v.optional(v.string()), // JSON stringified TypingTabsState
    activeTypingTabId: v.optional(v.string()),
    typingDockMode: v.optional(v.union(v.literal('expanded'), v.literal('fullscreen'), v.literal('minimized'))),

    // Metadata for sync tracking
    lastSyncedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId']),

  conversationHistory: defineTable({
    userId: v.string(),
    text: v.string(),
    capturedAt: v.number(),
    captureSource: v.union(v.literal('speak'), v.literal('speakAndClear'), v.literal('clear')),
    tabId: v.optional(v.string()),
  })
    .index('by_user_id', ['userId'])
    .index('by_user_id_and_captured_at', ['userId', 'capturedAt']),
});
