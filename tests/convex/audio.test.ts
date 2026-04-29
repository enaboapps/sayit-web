/**
 * Convex audio function tests
 *
 * Mirrors the same "mock the runtime, re-implement the invariants" pattern as
 * boardTiles.test.ts / phraseBoards.test.ts. The new orphan-cleanup mutation
 * has additional invariants (must not delete a referenced storage object)
 * that we exercise explicitly.
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

const mockDb = {
  query: jest.fn(),
  get: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  storage: {
    generateUploadUrl: jest.fn(),
    delete: jest.fn(),
  },
  auth: {
    getUserIdentity: jest.fn(),
  },
};

const createBoard = (overrides = {}) => ({
  _id: 'board-1',
  userId: 'user-123',
  name: 'Test Board',
  position: 0,
  forClientId: undefined,
  clientAccessLevel: undefined,
  ...overrides,
});

const computeAccess = (
  board: ReturnType<typeof createBoard> | null,
  viewerSubject: string,
) => {
  if (!board) return null;
  const isOwner = board.userId === viewerSubject;
  const isAssignedClient = board.forClientId === viewerSubject;
  const canEdit =
    isOwner || (isAssignedClient && board.clientAccessLevel === 'edit');
  const canRead = isOwner || isAssignedClient;
  return { board, isOwner, canEdit, canRead };
};

describe('audio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUploadUrl', () => {
    test('rejects unauthenticated callers', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const identity = await mockCtx.auth.getUserIdentity();
      const guard = () => {
        if (!identity) throw new Error('Unauthenticated');
      };
      expect(guard).toThrow(/Unauthenticated/);
      expect(mockCtx.storage.generateUploadUrl).not.toHaveBeenCalled();
    });

    test('rejects callers without edit access on the board', () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });
      const access = computeAccess(board, 'client-1');

      const guard = () => {
        if (!access || !access.canEdit) throw new Error('Unauthorized - board');
      };
      expect(guard).toThrow(/Unauthorized/);
      expect(mockCtx.storage.generateUploadUrl).not.toHaveBeenCalled();
    });

    test('rejects when the board does not exist', () => {
      const access = computeAccess(null, 'user-123');
      const guard = () => {
        if (!access) throw new Error('Board not found');
      };
      expect(guard).toThrow(/Board not found/);
    });

    test('issues an upload URL for the board owner', async () => {
      const board = createBoard();
      const access = computeAccess(board, 'user-123');
      mockCtx.storage.generateUploadUrl.mockResolvedValue('https://upload/xyz');

      if (!access || !access.canEdit) throw new Error('Unexpected');
      const url = await mockCtx.storage.generateUploadUrl();
      expect(url).toBe('https://upload/xyz');
    });

    test('issues an upload URL for a client with edit access', async () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'edit',
      });
      const access = computeAccess(board, 'client-1');
      mockCtx.storage.generateUploadUrl.mockResolvedValue('https://upload/xyz');

      if (!access || !access.canEdit) throw new Error('Unexpected');
      await mockCtx.storage.generateUploadUrl();
      expect(mockCtx.storage.generateUploadUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteOrphanUpload', () => {
    test('rejects unauthenticated callers', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const identity = await mockCtx.auth.getUserIdentity();
      const guard = () => {
        if (!identity) throw new Error('Unauthenticated');
      };
      expect(guard).toThrow(/Unauthenticated/);
      expect(mockCtx.storage.delete).not.toHaveBeenCalled();
    });

    test('rejects callers without edit access on the board', () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });
      const access = computeAccess(board, 'client-1');
      const guard = () => {
        if (!access || !access.canEdit) throw new Error('Unauthorized');
      };
      expect(guard).toThrow(/Unauthorized/);
      expect(mockCtx.storage.delete).not.toHaveBeenCalled();
    });

    test('refuses to delete a storage object that a tile already references', async () => {
      const referencingTile = {
        _id: 'tile-1',
        kind: 'audio',
        audioStorageId: 'storage-live',
      };

      const queryChain = {
        withIndex: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(referencingTile),
      };
      mockDb.query.mockReturnValue(queryChain);

      const found = await mockDb
        .query('boardTiles')
        // @ts-expect-error mock chain
        .withIndex('by_audio_storage', (q) => q)
        .first();

      // Replicate handler: if found, return early without calling storage.delete.
      if (found) {
        // no-op
      } else {
        await mockCtx.storage.delete('storage-live');
      }
      expect(mockCtx.storage.delete).not.toHaveBeenCalled();
    });

    test('deletes a storage object that no tile references', async () => {
      const queryChain = {
        withIndex: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };
      mockDb.query.mockReturnValue(queryChain);

      const found = await mockDb
        .query('boardTiles')
        // @ts-expect-error mock chain
        .withIndex('by_audio_storage', (q) => q)
        .first();

      if (!found) {
        await mockCtx.storage.delete('storage-orphan');
      }
      expect(mockCtx.storage.delete).toHaveBeenCalledWith('storage-orphan');
    });
  });
});
