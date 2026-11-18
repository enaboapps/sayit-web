import { describe, expect, jest, test } from '@jest/globals';
import { requireUser } from '@/convex/users';
import { findCaregiverLink, isCaregiverOf } from '@/convex/caregiverLinks';

type Row = Record<string, unknown>;
type EqBuilder = { eq: (field: string, value: unknown) => unknown };

function mockCtx(subject: string | null, links: Row[] = []) {
  return {
    auth: { getUserIdentity: jest.fn(async () => (subject ? { subject } : null)) },
    db: {
      query: jest.fn(() => ({
        withIndex: jest.fn((_index: string, build: (q: EqBuilder) => unknown) => {
          let field = '';
          let value: unknown;
          build({ eq: (f, v) => { field = f; value = v; return {}; } });
          return { collect: jest.fn(async () => links.filter((row) => row[field] === value)) };
        }),
      })),
    },
  };
}

describe('requireUser', () => {
  test('returns the identity when signed in', async () => {
    await expect(requireUser(mockCtx('user-1') as never)).resolves.toEqual({ subject: 'user-1' });
  });

  test('throws Unauthenticated by default', async () => {
    await expect(requireUser(mockCtx(null) as never)).rejects.toThrow('Unauthenticated');
  });

  test('throws the message a call site passes', async () => {
    await expect(requireUser(mockCtx(null) as never, 'Not authenticated')).rejects.toThrow('Not authenticated');
  });
});

describe('caregiver links', () => {
  const links = [
    { _id: 'link-1', caregiverId: 'care-1', communicatorId: 'client-1' },
    { _id: 'link-2', caregiverId: 'care-1', communicatorId: 'client-2' },
    { _id: 'link-3', caregiverId: 'care-2', communicatorId: 'client-3' },
  ];

  test('finds the link between a caregiver and a client', async () => {
    await expect(findCaregiverLink(mockCtx('care-1', links) as never, 'care-1', 'client-2'))
      .resolves.toEqual(expect.objectContaining({ _id: 'link-2' }));
  });

  test('returns null for a client of another caregiver', async () => {
    await expect(findCaregiverLink(mockCtx('care-1', links) as never, 'care-1', 'client-3')).resolves.toBeNull();
  });

  test('isCaregiverOf answers yes or no', async () => {
    const ctx = mockCtx('care-1', links) as never;
    await expect(isCaregiverOf(ctx, 'care-1', 'client-1')).resolves.toBe(true);
    await expect(isCaregiverOf(ctx, 'care-2', 'client-1')).resolves.toBe(false);
  });
});
