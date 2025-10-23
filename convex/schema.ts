import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(), // Clerk user ID
    email: v.string(),
    fullName: v.optional(v.string()),
    bypassSubscriptionCheck: v.optional(v.boolean()),
  }).index("by_user_id", ["userId"]),

  phrases: defineTable({
    userId: v.string(), // Clerk user ID
    text: v.string(),
    frequency: v.number(),
    position: v.number(),
  }).index("by_user_id", ["userId"]),

  phraseBoards: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    position: v.number(),
  }).index("by_user_id", ["userId"]),

  phraseBoardPhrases: defineTable({
    phraseId: v.id("phrases"),
    boardId: v.id("phraseBoards"),
  })
    .index("by_phrase", ["phraseId"])
    .index("by_board", ["boardId"]),

  typingSessions: defineTable({
    userId: v.string(), // Clerk user ID
    sessionKey: v.string(),
    content: v.string(),
    expiresAt: v.number(), // Unix timestamp
  })
    .index("by_user_id", ["userId"])
    .index("by_session_key", ["sessionKey"]),
});
