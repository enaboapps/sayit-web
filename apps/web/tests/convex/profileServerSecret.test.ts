import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { deleteProfile, upsertProfile } from '@/convex/profiles';

const SECRET = 'x'.repeat(40);

function mockCtx(rows: Record<string, unknown>[] = []) {
  return {
    auth: { getUserIdentity: jest.fn() },
    db: {
      query: jest.fn(() => ({
        withIndex: jest.fn(() => ({
          first: jest.fn(async () => rows[0] ?? null),
          collect: jest.fn(async () => rows),
        })),
      })),
      insert: jest.fn(async () => 'new-profile'),
      patch: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    },
  };
}

describe('profile mutations used by the Clerk webhook', () => {
  beforeEach(() => {
    process.env.CONVEX_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.CONVEX_WEBHOOK_SECRET;
  });

  test('reject deleteProfile without the server secret', async () => {
    const ctx = mockCtx([{ _id: 'profile-1', userId: 'victim' }]);

    await expect(deleteProfile._handler(ctx as never, { serverSecret: 'guess', userId: 'victim' }))
      .rejects.toThrow('Unauthorized');
    expect(ctx.db.delete).not.toHaveBeenCalled();
  });

  test('reject upsertProfile without the server secret', async () => {
    const ctx = mockCtx([{ _id: 'profile-1', userId: 'victim' }]);

    await expect(upsertProfile._handler(ctx as never, {
      serverSecret: '',
      userId: 'victim',
      email: 'attacker@example.com',
    })).rejects.toThrow('Unauthorized');
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  test('reject a secret that only shares a prefix', async () => {
    const ctx = mockCtx();

    await expect(upsertProfile._handler(ctx as never, {
      serverSecret: SECRET.slice(0, 39),
      userId: 'user-1',
      email: 'user@example.com',
    })).rejects.toThrow('Unauthorized');
  });

  test('fail closed when the secret is not configured', async () => {
    delete process.env.CONVEX_WEBHOOK_SECRET;
    const ctx = mockCtx();

    await expect(upsertProfile._handler(ctx as never, {
      serverSecret: '',
      userId: 'user-1',
      email: 'user@example.com',
    })).rejects.toThrow('not configured');
  });

  test('fail closed when the configured secret is too short', async () => {
    process.env.CONVEX_WEBHOOK_SECRET = 'short';
    const ctx = mockCtx();

    await expect(deleteProfile._handler(ctx as never, { serverSecret: 'short', userId: 'user-1' }))
      .rejects.toThrow('not configured');
  });

  test('accept the webhook with the right secret', async () => {
    const ctx = mockCtx();

    await expect(upsertProfile._handler(ctx as never, {
      serverSecret: SECRET,
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
    })).resolves.toBe('new-profile');
    expect(ctx.db.insert).toHaveBeenCalledWith('profiles', {
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
      role: 'communicator',
    });
  });

  test('delete a profile with the right secret', async () => {
    const ctx = mockCtx([{ _id: 'profile-1', userId: 'user-1' }]);

    await deleteProfile._handler(ctx as never, { serverSecret: SECRET, userId: 'user-1' });

    expect(ctx.db.delete).toHaveBeenCalledWith('profile-1');
  });
});
