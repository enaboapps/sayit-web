import { afterEach, beforeEach, describe, expect, test, jest } from '@jest/globals';
import {
  deleteTypingSession,
  getMyTypingSession,
  getTypingSession,
  getTypingSessionForServer,
  resetTypingSessionLink,
  startTypingSession,
  stopTypingSession,
  updateTypingSessionContent,
} from '@/convex/typingSessions';
import { deleteProfile } from '@/convex/profiles';

type MockSession = Record<string, unknown>;
type EqBuilder = { eq: (field: string, value: unknown) => unknown };
type FilterBuilder = {
  field: (name: string) => string;
  eq: (field: string, value: unknown) => (row: MockSession) => boolean;
};

const filterBuilder: FilterBuilder = {
  field: (name) => name,
  eq: (field, value) => (row) => row[field] === value,
};

// In-memory stand-in for the typingSessions table (plus any other tables a
// test needs), enough for index lookups.
function mockTable(sessions: MockSession[], otherTables: Record<string, MockSession[]> = {}) {
  const tables: Record<string, MockSession[]> = { typingSessions: sessions, ...otherTables };
  return {
    auth: {
      getUserIdentity: jest.fn<() => Promise<unknown>>().mockResolvedValue({ subject: 'user-1' }),
    },
    db: {
      query: jest.fn((table: string) => ({
        withIndex: jest.fn((_index: string, build: (q: EqBuilder) => unknown) => {
          let field = '';
          let value: unknown;
          build({ eq: (f, v) => { field = f; value = v; return {}; } });
          const results = (rows: MockSession[]) => ({
            first: jest.fn(async () => rows[0] ?? null),
            collect: jest.fn(async () => rows),
            // Supports filter((q) => q.eq(q.field(name), value)).
            filter: jest.fn((predicate: (q: FilterBuilder) => (row: MockSession) => boolean) =>
              results(rows.filter(predicate(filterBuilder)))),
          });
          return results((tables[table] ?? []).filter((row) => row[field] === value));
        }),
      })),
      insert: jest.fn(async (_table: string, doc: MockSession) => {
        sessions.push({ _id: 'new-session', ...doc });
        return 'new-session';
      }),
      get: jest.fn(async (id: string) => sessions.find((session) => session._id === id) ?? null),
      patch: jest.fn(async (id: string, fields: MockSession) => {
        const session = sessions.find((s) => s._id === id);
        if (session) Object.assign(session, fields);
      }),
      delete: jest.fn(async (id: string) => { void id; }),
    },
  };
}

const stoppedFields = { isActive: false, isPaused: false, content: '', speechCommand: undefined };
const later = () => Date.now() + 60_000;

describe('typingSessions account link', () => {
  test('creates one permanent link for the account on first start', async () => {
    const ctx = mockTable([]);

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'new-key', content: 'Hello' });

    expect(ctx.db.insert).toHaveBeenCalledWith('typingSessions', {
      userId: 'user-1',
      sessionKey: 'new-key',
      content: 'Hello',
      isPaused: false,
      isActive: true,
    });
    expect(session).toEqual(expect.objectContaining({ sessionKey: 'new-key', isActive: true }));
    expect(session).not.toHaveProperty('expiresAt');
  });

  test('reuses the existing account link when starting again', async () => {
    const ctx = mockTable([
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: later() },
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: false, content: '' },
    ]);

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'ignored-key', content: 'Draft' });

    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).toHaveBeenCalledWith('account', { ...stoppedFields, isActive: true, content: 'Draft' });
    expect(session).toEqual(expect.objectContaining({ sessionKey: 'account-key', isActive: true }));
  });

  test('joins an already active account link without clearing it', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true, content: 'Typing on my tablet' },
    ]);

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'ignored-key', content: 'Laptop draft' });

    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(session).toEqual(expect.objectContaining({ content: 'Typing on my tablet' }));
  });

  test('stopping keeps the account link and clears what viewers can see', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true, content: 'Hello' },
    ]);

    await stopTypingSession._handler(ctx as never, { sessionKey: 'account-key' });

    expect(ctx.db.patch).toHaveBeenCalledWith('account', stoppedFields);
    expect(ctx.db.delete).not.toHaveBeenCalled();
  });

  test('stopping a 24-hour session deletes it', async () => {
    const ctx = mockTable([
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: later() },
    ]);

    await stopTypingSession._handler(ctx as never, { sessionKey: 'device-key' });

    expect(ctx.db.delete).toHaveBeenCalledWith('legacy');
  });

  test('older clients deleting the account link stop it instead', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true, content: 'Hello' },
    ]);

    await deleteTypingSession._handler(ctx as never, { sessionKey: 'account-key' });

    expect(ctx.db.patch).toHaveBeenCalledWith('account', stoppedFields);
    expect(ctx.db.delete).not.toHaveBeenCalled();
  });

  test('another account cannot stop the link', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true },
    ]);
    ctx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-2' });

    await expect(stopTypingSession._handler(ctx as never, { sessionKey: 'account-key' }))
      .rejects.toThrow('Unauthorized');
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  test('resetting moves the account to a new key so the old link stops working', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'old-key', isActive: true, content: 'Hello' },
    ]);

    await resetTypingSessionLink._handler(ctx as never, { sessionKey: 'new-key' });

    expect(ctx.db.patch).toHaveBeenCalledWith('account', {
      sessionKey: 'new-key',
      content: '',
      speechCommand: undefined,
    });
    await expect(getTypingSession._handler(ctx as never, { sessionKey: 'old-key' })).resolves.toBeNull();
    await expect(getTypingSession._handler(ctx as never, { sessionKey: 'new-key' }))
      .resolves.toEqual(expect.objectContaining({ sessionKey: 'new-key', isActive: true }));
  });

  test('resetting refuses a key that is already in use', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'old-key', isActive: true },
      { _id: 'other', userId: 'user-2', sessionKey: 'taken-key' },
    ]);

    await expect(resetTypingSessionLink._handler(ctx as never, { sessionKey: 'taken-key' }))
      .rejects.toThrow('already in use');
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  test('viewers can open a stopped account link and see that it is not sharing', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: false, content: '' },
    ]);

    await expect(getTypingSession._handler(ctx as never, { sessionKey: 'account-key' }))
      .resolves.toEqual(expect.objectContaining({ isActive: false, content: '' }));
  });

  test('viewers do not receive the owner user ID', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true, content: 'Hi' },
    ]);

    const viewed = await getTypingSession._handler(ctx as never, { sessionKey: 'account-key' });

    expect(viewed).toEqual({
      sessionKey: 'account-key',
      content: 'Hi',
      isPaused: undefined,
      isActive: true,
      speechCommand: undefined,
    });
  });

  test('viewers get nothing for an expired 24-hour session', async () => {
    const ctx = mockTable([
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: Date.now() - 1 },
    ]);

    await expect(getTypingSession._handler(ctx as never, { sessionKey: 'device-key' })).resolves.toBeNull();
  });

  test('content updates are dropped while the account link is stopped', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: false, content: '' },
    ]);

    await expect(updateTypingSessionContent._handler(ctx as never, {
      sessionKey: 'account-key',
      content: 'Private',
    })).resolves.toBe(false);
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  test('getMyTypingSession returns the account link, not 24-hour sessions', async () => {
    const ctx = mockTable([
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: later() },
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true },
    ]);

    await expect(getMyTypingSession._handler(ctx as never, {}))
      .resolves.toEqual(expect.objectContaining({ _id: 'account' }));
  });

  test('getMyTypingSession returns null when signed out', async () => {
    const ctx = mockTable([]);
    ctx.auth.getUserIdentity.mockResolvedValue(null);

    await expect(getMyTypingSession._handler(ctx as never, {})).resolves.toBeNull();
  });
});

describe('getTypingSessionForServer', () => {
  const secret = 's'.repeat(40);
  const saved = process.env.CONVEX_WEBHOOK_SECRET;
  beforeEach(() => { process.env.CONVEX_WEBHOOK_SECRET = secret; });
  afterEach(() => { process.env.CONVEX_WEBHOOK_SECRET = saved; });

  test('returns the session with its owner for trusted server code', async () => {
    const ctx = mockTable([{ _id: 'account', userId: 'user-1', sessionKey: 'key-1', content: 'hi', isActive: true }]);

    await expect(getTypingSessionForServer._handler(ctx as never, { serverSecret: secret, sessionKey: 'key-1' }))
      .resolves.toEqual(expect.objectContaining({ sessionKey: 'key-1', userId: 'user-1' }));
  });

  test('refuses a wrong secret', async () => {
    const ctx = mockTable([{ _id: 'account', userId: 'user-1', sessionKey: 'key-1', isActive: true }]);

    await expect(getTypingSessionForServer._handler(ctx as never, { serverSecret: 'wrong', sessionKey: 'key-1' }))
      .rejects.toThrow('Unauthorized');
  });

  test('hides expired 24-hour sessions like the viewer query', async () => {
    const ctx = mockTable([{ _id: 'old', userId: 'user-1', sessionKey: 'key-1', expiresAt: Date.now() - 1000 }]);

    await expect(getTypingSessionForServer._handler(ctx as never, { serverSecret: secret, sessionKey: 'key-1' }))
      .resolves.toBeNull();
  });
});

describe('account deletion', () => {
  test('deleting an account removes its Live Typing links', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: false },
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: later() },
      { _id: 'someone-else', userId: 'user-2', sessionKey: 'other-key', isActive: true },
    ], {
      profiles: [{ _id: 'profile-1', userId: 'user-1' }],
    });

    process.env.CONVEX_WEBHOOK_SECRET = 'x'.repeat(40);
    try {
      await deleteProfile._handler(ctx as never, { serverSecret: 'x'.repeat(40), userId: 'user-1' });
    } finally {
      delete process.env.CONVEX_WEBHOOK_SECRET;
    }

    expect(ctx.db.delete).toHaveBeenCalledWith('account');
    expect(ctx.db.delete).toHaveBeenCalledWith('legacy');
    expect(ctx.db.delete).not.toHaveBeenCalledWith('someone-else');
    expect(ctx.db.delete).toHaveBeenCalledWith('profile-1');
  });
});
