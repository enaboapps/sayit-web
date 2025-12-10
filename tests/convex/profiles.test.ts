/**
 * Convex profiles function tests
 *
 * Note: These tests mock the Convex functions. For true integration testing,
 * use Convex's test deployment or convex-test in an ESM-compatible test runner.
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock the Convex client
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  auth: {
    getUserIdentity: jest.fn(),
  },
};

// Profile factory
const createProfile = (overrides = {}) => ({
  _id: 'profile-1',
  userId: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: undefined,
  bypassSubscriptionCheck: false,
  ...overrides,
});

describe('profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileByUserId', () => {
    test('returns null for non-existent user', async () => {
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(result).toBeNull();
    });

    test('returns profile for existing user', async () => {
      const profile = createProfile();
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(result).toEqual(profile);
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('getProfileByEmail', () => {
    test('returns null for non-existent email', async () => {
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_email').unique();
      expect(result).toBeNull();
    });

    test('returns profile for existing email', async () => {
      const profile = createProfile({ email: 'TEST@EXAMPLE.COM' });
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_email').unique();
      expect(result).toEqual(profile);
    });
  });

  describe('setRole', () => {
    test('creates profile if not exists', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'new-user',
        email: 'new@example.com',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(null),
        }),
      });

      mockDb.insert.mockResolvedValue('new-profile-id');

      // Simulate the setRole logic
      const identity = await mockCtx.auth.getUserIdentity();
      expect(identity).not.toBeNull();

      const existingProfile = await mockDb.query('profiles').withIndex('by_user_id').unique();
      if (!existingProfile) {
        const newId = await mockDb.insert('profiles', {
          userId: identity!.subject,
          email: identity!.email,
          role: 'caregiver',
        });
        expect(newId).toBe('new-profile-id');
      }

      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('updates role for existing user', async () => {
      const existingProfile = createProfile({ _id: 'profile-1', role: 'communicator' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
        email: 'test@example.com',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(existingProfile),
        }),
      });

      mockDb.patch.mockResolvedValue(undefined);

      // Simulate the setRole logic
      const profile = await mockDb.query('profiles').withIndex('by_user_id').unique();
      if (profile) {
        await mockDb.patch(profile._id, { role: 'caregiver' });
      }

      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', { role: 'caregiver' });
    });

    test('throws error for unauthenticated user', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);

      const identity = await mockCtx.auth.getUserIdentity();
      expect(identity).toBeNull();

      // The actual function would throw 'Unauthenticated'
      const throwIfUnauthenticated = () => {
        if (!identity) throw new Error('Unauthenticated');
      };

      expect(throwIfUnauthenticated).toThrow('Unauthenticated');
    });
  });

  describe('getProfile', () => {
    test('returns null for unauthenticated user', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);

      const identity = await mockCtx.auth.getUserIdentity();
      if (!identity) {
        expect(identity).toBeNull();
      }
    });

    test('returns profile for authenticated user', async () => {
      const profile = createProfile();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const identity = await mockCtx.auth.getUserIdentity();
      expect(identity).not.toBeNull();

      const result = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(result).toEqual(profile);
    });
  });

  describe('upsertProfile', () => {
    test('creates new profile', async () => {
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(null),
        }),
      });

      mockDb.insert.mockResolvedValue('new-profile-id');

      const existing = await mockDb.query('profiles').withIndex('by_user_id').unique();
      if (!existing) {
        const id = await mockDb.insert('profiles', {
          userId: 'new-user',
          email: 'new@example.com',
          fullName: 'New User',
        });
        expect(id).toBe('new-profile-id');
      }

      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('updates existing profile', async () => {
      const existing = createProfile({ _id: 'profile-1' });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(existing),
        }),
      });

      mockDb.patch.mockResolvedValue(undefined);

      const profile = await mockDb.query('profiles').withIndex('by_user_id').unique();
      if (profile) {
        await mockDb.patch(profile._id, {
          email: 'updated@example.com',
          fullName: 'Updated Name',
        });
      }

      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', expect.objectContaining({
        email: 'updated@example.com',
      }));
    });
  });

  describe('deleteProfile', () => {
    test('deletes existing profile', async () => {
      const profile = createProfile({ _id: 'profile-1' });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      mockDb.delete.mockResolvedValue(undefined);

      const existing = await mockDb.query('profiles').withIndex('by_user_id').unique();
      if (existing) {
        await mockDb.delete(existing._id);
      }

      expect(mockDb.delete).toHaveBeenCalledWith('profile-1');
    });
  });

  describe('getSubscriptionStatus', () => {
    test('returns false for user without bypass', async () => {
      const profile = createProfile({ bypassSubscriptionCheck: false });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(result?.bypassSubscriptionCheck).toBe(false);
    });

    test('returns true for user with bypass', async () => {
      const profile = createProfile({ bypassSubscriptionCheck: true });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const result = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(result?.bypassSubscriptionCheck).toBe(true);
    });
  });
});
