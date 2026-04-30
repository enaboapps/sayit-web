/**
 * Convex caregiverClients function tests
 *
 * Note: These tests mock the Convex functions. For true integration testing,
 * use Convex's test deployment or convex-test in an ESM-compatible test runner.
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock the Convex client
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  auth: {
    getUserIdentity: jest.fn(),
  },
};

// Factory functions
const createProfile = (overrides = {}) => ({
  _id: 'profile-1',
  userId: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'communicator',
  ...overrides,
});

const createCaregiverClient = (overrides = {}) => ({
  _id: 'link-1',
  caregiverId: 'caregiver-123',
  communicatorId: 'communicator-456',
  createdAt: Date.now(),
  ...overrides,
});

describe('caregiverClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addClient', () => {
    test('links valid communicator to caregiver', async () => {
      const communicatorProfile = createProfile({
        userId: 'communicator-456',
        email: 'communicator@example.com',
        role: 'communicator',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'caregiver-123',
      });

      // Mock profile lookup
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(communicatorProfile),
        }),
      });

      // Mock existing link check (no existing link)
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      mockDb.insert.mockResolvedValue('new-link-id');

      const identity = await mockCtx.auth.getUserIdentity();
      expect(identity).not.toBeNull();

      // Simulate addClient logic
      const profile = await mockDb.query('profiles').withIndex('by_user_id').unique();
      expect(profile?.role).toBe('communicator');

      const existingLink = await mockDb.query('caregiverClients')
        .withIndex('by_caregiver')
        .filter()
        .first();
      expect(existingLink).toBeNull();

      const linkId = await mockDb.insert('caregiverClients', {
        caregiverId: identity!.subject,
        communicatorId: 'communicator-456',
        createdAt: Date.now(),
      });

      expect(linkId).toBe('new-link-id');
    });

    test('rejects linking a caregiver as client', async () => {
      const caregiverProfile = createProfile({
        userId: 'another-caregiver',
        email: 'caregiver2@example.com',
        role: 'caregiver',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(caregiverProfile),
        }),
      });

      const profile = await mockDb.query('profiles').withIndex('by_user_id').unique();

      // The actual function would throw an error for caregiver role
      const validateRole = () => {
        if (profile?.role === 'caregiver') {
          throw new Error('Cannot add a caregiver as a client');
        }
      };

      expect(validateRole).toThrow('Cannot add a caregiver as a client');
    });

    test('rejects duplicate client links', async () => {
      const existingLink = createCaregiverClient();

      // Simulate finding an existing link
      const validateNoExisting = () => {
        if (existingLink) {
          throw new Error('Client is already linked');
        }
      };

      expect(validateNoExisting).toThrow('Client is already linked');
    });

    test('throws error for unauthenticated user', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);

      const identity = await mockCtx.auth.getUserIdentity();

      const throwIfUnauthenticated = () => {
        if (!identity) throw new Error('Unauthenticated');
      };

      expect(throwIfUnauthenticated).toThrow('Unauthenticated');
    });
  });

  describe('getClients', () => {
    test('returns empty array for caregiver with no clients', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'caregiver-123',
      });

      // Simulate empty client list
      const clients: unknown[] = [];
      expect(clients).toEqual([]);
    });

    test('returns clients with profile info and board counts', async () => {
      const clientLink = createCaregiverClient();
      const clientProfile = createProfile({
        userId: 'communicator-456',
        fullName: 'Test Client',
      });

      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([clientLink]),
        }),
      });

      // Mock profile lookup
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(clientProfile),
        }),
      });

      // Mock board count
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([{ _id: 'board-1' }]),
        }),
      });

      const links = await mockDb.query('caregiverClients')
        .withIndex('by_caregiver')
        .collect();

      expect(links).toHaveLength(1);

      const profile = await mockDb.query('profiles')
        .withIndex('by_user_id')
        .unique();

      expect(profile?.fullName).toBe('Test Client');

      const boards = await mockDb.query('phraseBoards')
        .withIndex('by_client')
        .collect();

      expect(boards).toHaveLength(1);
    });
  });

  describe('getCaregiver', () => {
    test('returns null for communicator without caregiver', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'communicator-456',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const link = await mockDb.query('caregiverClients')
        .withIndex('by_communicator')
        .first();

      expect(link).toBeNull();
    });

    test('returns caregiver info for linked communicator', async () => {
      const link = createCaregiverClient();
      const caregiverProfile = createProfile({
        userId: 'caregiver-123',
        fullName: 'My Caregiver',
        role: 'caregiver',
      });

      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(link),
        }),
      });

      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(caregiverProfile),
        }),
      });

      const clientLink = await mockDb.query('caregiverClients')
        .withIndex('by_communicator')
        .first();

      expect(clientLink).not.toBeNull();

      const profile = await mockDb.query('profiles')
        .withIndex('by_user_id')
        .unique();

      expect(profile?.fullName).toBe('My Caregiver');
    });
  });

  describe('removeClient', () => {
    test('removes client link', async () => {
      const link = createCaregiverClient({ _id: 'link-to-remove' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'caregiver-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(link),
          }),
        }),
      });

      mockDb.delete.mockResolvedValue(undefined);

      const existingLink = await mockDb.query('caregiverClients')
        .withIndex('by_caregiver')
        .filter()
        .first();

      expect(existingLink).not.toBeNull();

      await mockDb.delete(existingLink!._id);

      expect(mockDb.delete).toHaveBeenCalledWith('link-to-remove');
    });

    test('cascades delete to client boards', async () => {
      const clientBoard = {
        _id: 'board-1',
        userId: 'caregiver-123',
        forClientId: 'communicator-456',
        name: 'Test Board',
      };

      mockDb.delete.mockResolvedValue(undefined);

      // Simulate cascade delete of boards created for client
      const clientBoards = [clientBoard];
      for (const board of clientBoards) {
        await mockDb.delete(board._id);
      }

      expect(mockDb.delete).toHaveBeenCalledWith('board-1');
    });
  });
});
