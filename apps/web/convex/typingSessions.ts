import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get a typing session by session key (public access for viewers)
export const getTypingSession = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const session = await ctx.db
      .query('typingSessions')
      .withIndex('by_session_key', (q) => q.eq('sessionKey', args.sessionKey))
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .first();

    return session;
  },
});

// Query: Get all typing sessions for current user
export const getUserTypingSessions = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const now = Date.now();

    return await ctx.db
      .query('typingSessions')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .collect();
  },
});

// Mutation: Create a new typing session
export const createTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Prevent accidental reuse of a live session key
    const existing = await ctx.db
      .query('typingSessions')
      .withIndex('by_session_key', (q) => q.eq('sessionKey', args.sessionKey))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .first();

    if (existing) {
      throw new Error('Session key already in use');
    }

    // Session expires in 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const sessionId = await ctx.db.insert('typingSessions', {
      userId: identity.subject,
      sessionKey: args.sessionKey,
      content: '',
      expiresAt,
    });

    return await ctx.db.get(sessionId);
  },
});

// Mutation: Update typing session content (real-time updates)
export const updateTypingSessionContent = mutation({
  args: {
    sessionKey: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const session = await ctx.db
      .query('typingSessions')
      .withIndex('by_session_key', (q) => q.eq('sessionKey', args.sessionKey))
      .first();

    if (!session || session.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(session._id, {
      content: args.content,
    });
  },
});

// Mutation: Publish a speech command for the live typing viewer device
export const publishTypingSessionSpeechCommand = mutation({
  args: {
    sessionKey: v.string(),
    commandId: v.string(),
    action: v.union(v.literal('speak'), v.literal('stop')),
    text: v.optional(v.string()),
    settings: v.optional(v.object({
      provider: v.union(v.literal('browser'), v.literal('elevenlabs'), v.literal('azure'), v.literal('gemini')),
      voiceId: v.optional(v.string()),
      rate: v.number(),
      pitch: v.number(),
      volume: v.number(),
      stability: v.number(),
      similarityBoost: v.number(),
      modelId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const session = await ctx.db
      .query('typingSessions')
      .withIndex('by_session_key', (q) => q.eq('sessionKey', args.sessionKey))
      .first();

    if (!session || session.userId !== identity.subject || session.expiresAt <= Date.now()) {
      throw new Error('Unauthorized');
    }

    if (args.action === 'speak') {
      if (!args.text?.trim()) {
        throw new Error('Text is required for speech commands');
      }
      if (!args.settings) {
        throw new Error('Speech settings are required for speech commands');
      }
    }

    await ctx.db.patch(session._id, {
      speechCommand: args.action === 'speak'
        ? {
          id: args.commandId,
          action: args.action,
          text: args.text,
          createdAt: Date.now(),
          settings: args.settings,
        }
        : {
          id: args.commandId,
          action: args.action,
          createdAt: Date.now(),
        },
    });
  },
});

// Mutation: Delete a typing session
export const deleteTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const session = await ctx.db
      .query('typingSessions')
      .withIndex('by_session_key', (q) => q.eq('sessionKey', args.sessionKey))
      .first();

    if (!session || session.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.delete(session._id);
  },
});
