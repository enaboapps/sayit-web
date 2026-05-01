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
    layoutMode: v.optional(v.union(v.literal('free'), v.literal('fixedGrid'))),
    layoutPreset: v.optional(v.union(v.literal('largeAccess16'), v.literal('standard36'), v.literal('dense48'))),
    gridRows: v.optional(v.number()),
    gridColumns: v.optional(v.number()),
    layoutVersion: v.optional(v.number()),
    sourceTemplate: v.optional(v.union(v.literal('sayitCoreV1'), v.literal('custom'))),
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

  // Polymorphic per-board tile placements. Replaces phraseBoardPhrases.
  // Each row is one tile slot on one board. `kind` selects the discriminated payload:
  //   - 'phrase'   -> phraseId set (references the phrases table)
  //   - 'navigate' -> targetBoardId set (references another phraseBoards row)
  // Adding a future tile kind: add a literal to the `kind` union, add the optional
  // payload field(s) here, add a render branch in BoardTileRenderer, add a form.
  boardTiles: defineTable({
    boardId: v.id('phraseBoards'),
    position: v.number(),
    kind: v.union(v.literal('phrase'), v.literal('navigate'), v.literal('audio')),
    // kind === 'phrase'
    phraseId: v.optional(v.id('phrases')),
    // kind === 'navigate'
    targetBoardId: v.optional(v.id('phraseBoards')),
    // kind === 'audio'
    audioLabel: v.optional(v.string()),
    audioStorageId: v.optional(v.id('_storage')),
    audioMimeType: v.optional(v.string()),
    audioDurationMs: v.optional(v.number()),
    audioByteSize: v.optional(v.number()),
    // kind-agnostic fixed-grid metadata. Optional so legacy/free boards render
    // exactly as they did before this layout system existed.
    cellRow: v.optional(v.number()),
    cellColumn: v.optional(v.number()),
    cellRowSpan: v.optional(v.number()),
    cellColumnSpan: v.optional(v.number()),
    tileRole: v.optional(v.union(
      v.literal('core'),
      v.literal('fringe'),
      v.literal('navigation'),
      v.literal('control'),
      v.literal('quickPhrase'),
      v.literal('audio')
    )),
    wordClass: v.optional(v.union(
      v.literal('pronoun'),
      v.literal('verb'),
      v.literal('descriptor'),
      v.literal('preposition'),
      v.literal('question'),
      v.literal('social'),
      v.literal('noun'),
      v.literal('other')
    )),
    isLocked: v.optional(v.boolean()),
  })
    .index('by_board', ['boardId'])
    .index('by_phrase', ['phraseId'])
    .index('by_target_board', ['targetBoardId'])
    .index('by_audio_storage', ['audioStorageId']),

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
    usePhraseBar: v.optional(v.boolean()),
    speakPhrasesOnTap: v.optional(v.boolean()),
    aacGridPresetPreference: v.optional(v.union(v.literal('largeAccess16'), v.literal('standard36'), v.literal('dense48'))),

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
