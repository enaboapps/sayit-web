import { cleanLiveTypingSpeechSettings } from '../lib/live-typing-speech';
import { v } from 'convex/values';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { getUserIdentity } from './users';

// Each account has one permanent Live Typing link: a typingSessions row with no
// expiresAt. Stopping it keeps the row (and the URL) but marks it inactive.
// Rows with expiresAt are 24-hour sessions from clients cached before account
// links existed; they keep working until they expire.

type TypingSession = Doc<'typingSessions'>;

function isAccountSession(session: TypingSession) {
  return session.expiresAt === undefined;
}

function isLive(session: TypingSession, now = Date.now()) {
  return session.isActive !== false && (session.expiresAt === undefined || session.expiresAt > now);
}

async function findByKey(ctx: QueryCtx | MutationCtx, sessionKey: string) {
  return await ctx.db
    .query('typingSessions')
    .withIndex('by_session_key', (q) => q.eq('sessionKey', sessionKey))
    .first();
}

async function findAccountSession(ctx: QueryCtx | MutationCtx, userId: string) {
  const sessions = await ctx.db
    .query('typingSessions')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .collect();
  return sessions.find(isAccountSession) ?? null;
}

async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await getUserIdentity(ctx);
  if (!identity) {
    throw new Error('Unauthenticated');
  }
  return identity.subject;
}

async function requireOwnedSession(ctx: MutationCtx, sessionKey: string) {
  const userId = await requireUserId(ctx);
  const session = await findByKey(ctx, sessionKey);
  if (!session || session.userId !== userId) {
    throw new Error('Unauthorized');
  }
  return session;
}

async function assertKeyAvailable(ctx: MutationCtx, sessionKey: string) {
  const existing = await findByKey(ctx, sessionKey);
  if (existing) {
    throw new Error('Session key already in use');
  }
}

const stoppedFields = {
  isActive: false,
  isPaused: false,
  content: '',
  speechCommand: undefined,
};

// Query: Get a typing session by session key (public access for viewers).
// A stopped account link is returned with isActive: false and no content so the
// viewer can wait for sharing to start again.
export const getTypingSession = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    const session = await findByKey(ctx, args.sessionKey);
    if (!session) return null;
    if (isAccountSession(session)) return session;
    return isLive(session) ? session : null;
  },
});

// Query: The signed-in user's account Live Typing link, or null.
export const getMyTypingSession = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;
    return await findAccountSession(ctx, identity.subject);
  },
});

// Query: Get all typing sessions for current user
export const getUserTypingSessions = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    const sessions = await ctx.db
      .query('typingSessions')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .collect();

    return sessions.filter((session) => isLive(session, now));
  },
});

// Mutation: Start sharing on the account link, creating it on first use.
// sessionKey is only used when the account has no link yet.
export const startTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await findAccountSession(ctx, userId);

    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { ...stoppedFields, isActive: true });
      }
      return await ctx.db.get(existing._id);
    }

    await assertKeyAvailable(ctx, args.sessionKey);
    const sessionId = await ctx.db.insert('typingSessions', {
      userId,
      sessionKey: args.sessionKey,
      content: '',
      isPaused: false,
      isActive: true,
    });

    return await ctx.db.get(sessionId);
  },
});

// Mutation: Stop sharing. The account link keeps working for when sharing starts again.
export const stopTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireOwnedSession(ctx, args.sessionKey);

    if (isAccountSession(session)) {
      await ctx.db.patch(session._id, stoppedFields);
    } else {
      await ctx.db.delete(session._id);
    }

    return true;
  },
});

// Mutation: Replace the account link with a new URL. The old URL stops working.
export const resetTypingSessionLink = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await findAccountSession(ctx, userId);
    if (!session) {
      throw new Error('No Live Typing link to reset');
    }

    await assertKeyAvailable(ctx, args.sessionKey);
    await ctx.db.patch(session._id, {
      sessionKey: args.sessionKey,
      content: '',
      speechCommand: undefined,
    });

    return await ctx.db.get(session._id);
  },
});

// Mutation: Create a 24-hour session. Kept for clients cached before account links.
export const createTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    // Prevent accidental reuse of a live session key
    const existing = await findByKey(ctx, args.sessionKey);
    if (existing && (isAccountSession(existing) || isLive(existing))) {
      throw new Error('Session key already in use');
    }

    // Session expires in 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const sessionId = await ctx.db.insert('typingSessions', {
      userId,
      sessionKey: args.sessionKey,
      content: '',
      isPaused: false,
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
    const session = await requireOwnedSession(ctx, args.sessionKey);

    if (!isLive(session) || session.isPaused) {
      return false;
    }

    await ctx.db.patch(session._id, {
      content: args.content,
    });

    return true;
  },
});

// Mutation: Pause or resume a typing session without changing its share URL.
export const setTypingSessionPaused = mutation({
  args: {
    sessionKey: v.string(),
    isPaused: v.boolean(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireOwnedSession(ctx, args.sessionKey);

    if (!isLive(session)) {
      throw new Error('Unauthorized');
    }

    if (!args.isPaused && args.content === undefined) {
      throw new Error('Current content is required when resuming');
    }

    await ctx.db.patch(session._id, args.isPaused
      ? { isPaused: true }
      : {
        isPaused: false,
        content: args.content,
      });

    return true;
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
    const session = await requireOwnedSession(ctx, args.sessionKey);

    if (!isLive(session)) {
      throw new Error('Unauthorized');
    }

    if (session.isPaused) {
      return false;
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
          settings: args.settings ? cleanLiveTypingSpeechSettings(args.settings) : undefined,
        }
        : {
          id: args.commandId,
          action: args.action,
          createdAt: Date.now(),
        },
    });

    return true;
  },
});

// Mutation: Delete a 24-hour typing session. For an account link (old cached
// clients calling "end"), this stops sharing instead so the link survives.
export const deleteTypingSession = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireOwnedSession(ctx, args.sessionKey);

    if (isAccountSession(session)) {
      await ctx.db.patch(session._id, stoppedFields);
      return;
    }

    await ctx.db.delete(session._id);
  },
});
