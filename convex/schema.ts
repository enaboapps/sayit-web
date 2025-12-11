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

  phrases: defineTable({
    userId: v.string(), // Clerk user ID
    text: v.string(),
    frequency: v.number(),
    position: v.number(),
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
});
