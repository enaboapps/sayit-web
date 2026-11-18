import { describe, expect, jest, test } from '@jest/globals';
import { createConnectionRequest } from '@/convex/connectionRequests';

type Row = Record<string, unknown>;
type EqBuilder = { eq: (field: string, value: unknown) => unknown };

function mockCtx(subject: string | null, tables: Record<string, Row[]>) {
  return {
    auth: { getUserIdentity: jest.fn(async () => (subject ? { subject } : null)) },
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
      insert: jest.fn(async () => 'request-1'),
    },
  };
}

const profiles = [
  { userId: 'care-1', role: 'caregiver' },
  { userId: 'client-1', role: 'communicator' },
];

describe('createConnectionRequest', () => {
  test('signed-out callers get the original error', async () => {
    const ctx = mockCtx(null, { profiles });

    await expect(createConnectionRequest._handler(ctx as never, { communicatorId: 'client-1' }))
      .rejects.toThrow('Not authenticated');
  });

  test('refuses a client the caregiver is already linked to', async () => {
    const ctx = mockCtx('care-1', {
      profiles,
      caregiverClients: [{ caregiverId: 'care-1', communicatorId: 'client-1' }],
    });

    await expect(createConnectionRequest._handler(ctx as never, { communicatorId: 'client-1' }))
      .rejects.toThrow('Already connected to this client');
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  test('ignores links that belong to another caregiver', async () => {
    const ctx = mockCtx('care-1', {
      profiles,
      caregiverClients: [{ caregiverId: 'care-2', communicatorId: 'client-1' }],
    });

    await expect(createConnectionRequest._handler(ctx as never, { communicatorId: 'client-1' }))
      .resolves.toBe('request-1');
  });
});
