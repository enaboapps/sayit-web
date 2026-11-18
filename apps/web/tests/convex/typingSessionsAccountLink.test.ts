import { describe, expect, test, jest } from '@jest/globals';
import {
  deleteTypingSession,
  getMyTypingSession,
  getTypingSession,
  resetTypingSessionLink,
  startTypingSession,
  stopTypingSession,
  updateTypingSessionContent,
} from '@/convex/typingSessions';
import { deleteProfile } from '@/convex/profiles';

type MockSession = Record<string, unknown>;
type EqBuilder = { eq: (field: string, value: unknown) => unknown };

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
          const matches = (tables[table] ?? []).filter((row) => row[field] === value);
          return {
            first: jest.fn(async () => matches[0] ?? null),
            collect: jest.fn(async () => matches),
          };
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

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'new-key' });

    expect(ctx.db.insert).toHaveBeenCalledWith('typingSessions', {
      userId: 'user-1',
      sessionKey: 'new-key',
      content: '',
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

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'ignored-key' });

    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).toHaveBeenCalledWith('account', { ...stoppedFields, isActive: true });
    expect(session).toEqual(expect.objectContaining({ sessionKey: 'account-key', isActive: true }));
  });

  test('joins an already active account link without clearing it', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: true, content: 'Typing on my tablet' },
    ]);

    const session = await startTypingSession._handler(ctx as never, { sessionKey: 'ignored-key' });

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
      .resolves.toEqual(expect.objectContaining({ _id: 'account', isActive: true }));
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

describe('account deletion', () => {
  test('deleting an account removes its Live Typing links', async () => {
    const ctx = mockTable([
      { _id: 'account', userId: 'user-1', sessionKey: 'account-key', isActive: false },
      { _id: 'legacy', userId: 'user-1', sessionKey: 'device-key', expiresAt: later() },
      { _id: 'someone-else', userId: 'user-2', sessionKey: 'other-key', isActive: true },
    ], {
      profiles: [{ _id: 'profile-1', userId: 'user-1' }],
    });

    await deleteProfile._handler(ctx as never, { userId: 'user-1' });

    expect(ctx.db.delete).toHaveBeenCalledWith('account');
    expect(ctx.db.delete).toHaveBeenCalledWith('legacy');
    expect(ctx.db.delete).not.toHaveBeenCalledWith('someone-else');
    expect(ctx.db.delete).toHaveBeenCalledWith('profile-1');
  });
});
