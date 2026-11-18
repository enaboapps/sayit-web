import { describe, expect, jest, test } from '@jest/globals';
import { getProfileByEmail, getProfileByUserId } from '@/convex/profiles';

type Row = Record<string, unknown>;
type EqBuilder = { eq: (field: string, value: unknown) => unknown };

// In-memory tables with index-style equality lookups.
function mockCtx(tables: Record<string, Row[]>, subject: string | null = 'caregiver-1') {
  return {
    auth: {
      getUserIdentity: jest.fn(async () => (subject ? { subject } : null)),
    },
    db: {
      query: jest.fn((table: string) => {
        const rows = tables[table] ?? [];
        return {
          collect: jest.fn(async () => rows),
          withIndex: jest.fn((_index: string, build: (q: EqBuilder) => unknown) => {
            let field = '';
            let value: unknown;
            build({ eq: (f, v) => { field = f; value = v; return {}; } });
            const matches = rows.filter((row) => row[field] === value);
            return {
              first: jest.fn(async () => matches[0] ?? null),
              collect: jest.fn(async () => matches),
            };
          }),
        };
      }),
      patch: jest.fn(async (id: string, fields: Row) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) Object.assign(row, fields);
        }
      }),
      delete: jest.fn(async (id: string) => { void id; }),
    },
  };
}

const client = {
  _id: 'p-client',
  userId: 'client-1',
  email: 'client@example.com',
  fullName: 'Client One',
  role: 'communicator',
  bypassSubscriptionCheck: true,
};
const caregiver = { _id: 'p-caregiver', userId: 'caregiver-1', email: 'care@example.com', role: 'caregiver' };
const stranger = { _id: 'p-stranger', userId: 'stranger-1', email: 'stranger@example.com', role: 'communicator' };

describe('getProfileByUserId', () => {
  const tables = () => ({
    profiles: [{ ...client }, { ...caregiver }, { ...stranger }],
    caregiverClients: [{ caregiverId: 'caregiver-1', communicatorId: 'client-1' }],
  });

  test('a linked caregiver gets the client name and email only', async () => {
    const result = await getProfileByUserId._handler(mockCtx(tables()) as never, { userId: 'client-1' });

    expect(result).toEqual({ userId: 'client-1', fullName: 'Client One', email: 'client@example.com' });
  });

  test('a user can read their own entry', async () => {
    const result = await getProfileByUserId._handler(mockCtx(tables(), 'client-1') as never, { userId: 'client-1' });

    expect(result).toEqual(expect.objectContaining({ userId: 'client-1' }));
  });

  test('an unlinked user gets nothing', async () => {
    const result = await getProfileByUserId._handler(mockCtx(tables(), 'stranger-1') as never, { userId: 'client-1' });

    expect(result).toBeNull();
  });

  test('signed-out callers get nothing', async () => {
    const result = await getProfileByUserId._handler(mockCtx(tables(), null) as never, { userId: 'client-1' });

    expect(result).toBeNull();
  });
});

describe('getProfileByEmail', () => {
  const tables = () => ({ profiles: [{ ...client }, { ...caregiver }, { ...stranger }] });

  test('a caregiver can find a user by email without private fields', async () => {
    const result = await getProfileByEmail._handler(mockCtx(tables()) as never, { email: 'CLIENT@example.com' });

    expect(result).toEqual({
      userId: 'client-1',
      fullName: 'Client One',
      email: 'client@example.com',
      role: 'communicator',
    });
    expect(result).not.toHaveProperty('bypassSubscriptionCheck');
  });

  test('a communicator cannot look people up by email', async () => {
    const result = await getProfileByEmail._handler(mockCtx(tables(), 'stranger-1') as never, { email: 'client@example.com' });

    expect(result).toBeNull();
  });

  test('signed-out callers get nothing', async () => {
    const result = await getProfileByEmail._handler(mockCtx(tables(), null) as never, { email: 'client@example.com' });

    expect(result).toBeNull();
  });

  test('an unknown email returns null', async () => {
    const result = await getProfileByEmail._handler(mockCtx(tables()) as never, { email: 'nobody@example.com' });

    expect(result).toBeNull();
  });
});
