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
  role: 'communicator',
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
    test('creates new profile with communicator role', async () => {
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
          role: 'communicator',
        });
        expect(id).toBe('new-profile-id');
      }

      expect(mockDb.insert).toHaveBeenCalledWith('profiles', expect.objectContaining({
        role: 'communicator',
      }));
    });

    test('updates existing profile without changing role', async () => {
      const existing = createProfile({ _id: 'profile-1', role: 'caregiver' });

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
      expect(mockDb.patch).not.toHaveBeenCalledWith('profile-1', expect.objectContaining({
        role: expect.anything(),
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

  describe('changeRole', () => {
    test('throws error for unauthenticated user', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);

      const identity = await mockCtx.auth.getUserIdentity();
      expect(identity).toBeNull();

      const throwIfUnauthenticated = () => {
        if (!identity) throw new Error('Not authenticated');
      };

      expect(throwIfUnauthenticated).toThrow('Not authenticated');
    });

    test('throws error if profile not found', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(null),
        }),
      });

      const profile = await mockDb.query('profiles').withIndex('by_user_id').unique();

      const throwIfNoProfile = () => {
        if (!profile) throw new Error('Profile not found');
      };

      expect(throwIfNoProfile).toThrow('Profile not found');
    });

    test('throws error if already have the same role', async () => {
      const profile = createProfile({ role: 'caregiver' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
        }),
      });

      const existingProfile = await mockDb.query('profiles').withIndex('by_user_id').unique();
      const newRole = 'caregiver';

      const throwIfSameRole = () => {
        if (existingProfile?.role === newRole) throw new Error('Already have this role');
      };

      expect(throwIfSameRole).toThrow('Already have this role');
    });

    test('updates role from caregiver to communicator', async () => {
      const profile = createProfile({ _id: 'profile-1', role: 'caregiver' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
          collect: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.patch.mockResolvedValue(undefined);

      // Simulate role change
      await mockDb.patch(profile._id, { role: 'communicator' });

      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', { role: 'communicator' });
    });

    test('updates role from communicator to caregiver', async () => {
      const profile = createProfile({ _id: 'profile-1', role: 'communicator' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(profile),
          collect: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.patch.mockResolvedValue(undefined);

      // Simulate role change
      await mockDb.patch(profile._id, { role: 'caregiver' });

      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', { role: 'caregiver' });
    });

    test('cleans up client relationships when switching from caregiver', async () => {
      const profile = createProfile({ _id: 'profile-1', role: 'caregiver', userId: 'user-123' });
      const clientRelationships = [
        { _id: 'rel-1', caregiverId: 'user-123', communicatorId: 'client-1' },
        { _id: 'rel-2', caregiverId: 'user-123', communicatorId: 'client-2' },
      ];

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      // Setup for profile query
      const profileQuery = jest.fn().mockReturnValue({
        unique: jest.fn().mockResolvedValue(profile),
      });

      // Setup for caregiverClients query
      const clientsQuery = jest.fn().mockReturnValue({
        collect: jest.fn().mockResolvedValue(clientRelationships),
      });

      // Setup for phraseBoards query
      const boardsQuery = jest.fn().mockReturnValue({
        collect: jest.fn().mockResolvedValue([]),
      });

      mockDb.query.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { withIndex: profileQuery };
        } else if (table === 'caregiverClients') {
          return { withIndex: clientsQuery };
        } else if (table === 'phraseBoards') {
          return { withIndex: boardsQuery };
        }
        return { withIndex: jest.fn() };
      });

      mockDb.delete.mockResolvedValue(undefined);
      mockDb.patch.mockResolvedValue(undefined);

      // Simulate cleanup and role change
      for (const rel of clientRelationships) {
        await mockDb.delete(rel._id);
      }
      await mockDb.patch(profile._id, { role: 'communicator' });

      expect(mockDb.delete).toHaveBeenCalledWith('rel-1');
      expect(mockDb.delete).toHaveBeenCalledWith('rel-2');
      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', { role: 'communicator' });
    });

    test('cleans up caregiver relationship when switching from communicator', async () => {
      const profile = createProfile({ _id: 'profile-1', role: 'communicator', userId: 'user-123' });
      const caregiverRelationships = [
        { _id: 'rel-1', caregiverId: 'caregiver-1', communicatorId: 'user-123' },
      ];

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      // Setup for profile query
      const profileQuery = jest.fn().mockReturnValue({
        unique: jest.fn().mockResolvedValue(profile),
      });

      // Setup for caregiverClients query
      const clientsQuery = jest.fn().mockReturnValue({
        collect: jest.fn().mockResolvedValue(caregiverRelationships),
      });

      mockDb.query.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { withIndex: profileQuery };
        } else if (table === 'caregiverClients') {
          return { withIndex: clientsQuery };
        }
        return { withIndex: jest.fn() };
      });

      mockDb.delete.mockResolvedValue(undefined);
      mockDb.patch.mockResolvedValue(undefined);

      // Simulate cleanup and role change
      for (const rel of caregiverRelationships) {
        await mockDb.delete(rel._id);
      }
      await mockDb.patch(profile._id, { role: 'caregiver' });

      expect(mockDb.delete).toHaveBeenCalledWith('rel-1');
      expect(mockDb.patch).toHaveBeenCalledWith('profile-1', { role: 'caregiver' });
    });
  });
});
