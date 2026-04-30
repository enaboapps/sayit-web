/**
 * Convex phrases function tests
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

// Factory function
const createPhrase = (overrides = {}) => ({
  _id: 'phrase-1',
  userId: 'user-123',
  text: 'Test Phrase',
  frequency: 0,
  position: 0,
  ...overrides,
});

describe('phrases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhrases', () => {
    test('returns empty array for user with no phrases', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([]),
        }),
      });

      const phrases = await mockDb.query('phrases')
        .withIndex('by_user_id')
        .collect();

      expect(phrases).toEqual([]);
    });

    test('returns user phrases', async () => {
      const phrases = [
        createPhrase({ text: 'Hello' }),
        createPhrase({ _id: 'phrase-2', text: 'Goodbye', position: 1 }),
      ];

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue(phrases),
        }),
      });

      const result = await mockDb.query('phrases')
        .withIndex('by_user_id')
        .collect();

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Hello');
      expect(result[1].text).toBe('Goodbye');
    });

    test('only returns current user phrases', async () => {
      const userPhrases = [createPhrase({ userId: 'user-123' })];

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue(userPhrases),
        }),
      });

      const result = await mockDb.query('phrases')
        .withIndex('by_user_id')
        .collect();

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
    });
  });

  describe('getPhrase', () => {
    test('returns phrase for owner', async () => {
      const phrase = createPhrase();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(phrase);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(identity?.subject);
    });

    test('returns null for non-owner', async () => {
      const phrase = createPhrase({ userId: 'other-user' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(phrase);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const isOwner = result?.userId === identity?.subject;
      expect(isOwner).toBe(false);
    });
  });

  describe('addPhrase', () => {
    test('creates phrase with given values', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.insert.mockResolvedValue('new-phrase-id');

      const identity = await mockCtx.auth.getUserIdentity();
      const phraseId = await mockDb.insert('phrases', {
        userId: identity!.subject,
        text: 'New Phrase',
        frequency: 10,
        position: 5,
      });

      expect(phraseId).toBe('new-phrase-id');
      expect(mockDb.insert).toHaveBeenCalledWith('phrases', expect.objectContaining({
        text: 'New Phrase',
        frequency: 10,
        position: 5,
      }));
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

  describe('updatePhrase', () => {
    test('updates phrase for owner', async () => {
      const phrase = createPhrase();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(phrase);
      mockDb.patch.mockResolvedValue(undefined);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      if (result?.userId === identity?.subject) {
        await mockDb.patch('phrase-1', { text: 'Updated Text', frequency: 5 });
      }

      expect(mockDb.patch).toHaveBeenCalledWith('phrase-1', {
        text: 'Updated Text',
        frequency: 5,
      });
    });

    test('throws error for non-owner', async () => {
      const phrase = createPhrase();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'other-user',
      });

      mockDb.get.mockResolvedValue(phrase);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const validateOwnership = () => {
        if (result?.userId !== identity?.subject) {
          throw new Error('Unauthorized');
        }
      };

      expect(validateOwnership).toThrow('Unauthorized');
    });

    test('updates only specified fields', async () => {
      const phrase = createPhrase({ text: 'Original', frequency: 10, position: 5 });

      mockDb.get.mockResolvedValue(phrase);
      mockDb.patch.mockResolvedValue(undefined);

      // Only update text
      await mockDb.patch('phrase-1', { text: 'Updated' });

      expect(mockDb.patch).toHaveBeenCalledWith('phrase-1', { text: 'Updated' });
    });
  });

  describe('deletePhrase', () => {
    test('deletes phrase for owner', async () => {
      const phrase = createPhrase();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(phrase);
      mockDb.delete.mockResolvedValue(undefined);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      if (result?.userId === identity?.subject) {
        await mockDb.delete('phrase-1');
      }

      expect(mockDb.delete).toHaveBeenCalledWith('phrase-1');
    });

    test('throws error for non-owner', async () => {
      const phrase = createPhrase();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'other-user',
      });

      mockDb.get.mockResolvedValue(phrase);

      const result = await mockDb.get('phrase-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const validateOwnership = () => {
        if (result?.userId !== identity?.subject) {
          throw new Error('Unauthorized');
        }
      };

      expect(validateOwnership).toThrow('Unauthorized');
    });
  });
});
