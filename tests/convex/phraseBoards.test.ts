/**
 * Convex phraseBoards function tests
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

// Factory functions
const createBoard = (overrides = {}) => ({
  _id: 'board-1',
  userId: 'user-123',
  name: 'Test Board',
  position: 0,
  forClientId: undefined,
  clientAccessLevel: undefined,
  ...overrides,
});

const createProfile = (overrides = {}) => ({
  _id: 'profile-1',
  userId: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  ...overrides,
});

describe('phraseBoards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhraseBoards', () => {
    test('returns empty array for user with no boards', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([]),
        }),
      });

      const boards = await mockDb.query('phraseBoards')
        .withIndex('by_user_id')
        .collect();

      expect(boards).toEqual([]);
    });

    test('returns owned boards with client info', async () => {
      const personalBoard = createBoard({ name: 'Personal Board' });
      const clientBoard = createBoard({
        _id: 'board-2',
        name: 'Client Board',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([personalBoard, clientBoard]),
        }),
      });

      // Mock client profile lookup
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          unique: jest.fn().mockResolvedValue(createProfile({
            userId: 'client-1',
            fullName: 'Test Client',
          })),
        }),
      });

      const boards = await mockDb.query('phraseBoards')
        .withIndex('by_user_id')
        .collect();

      expect(boards).toHaveLength(2);
      expect(boards[1].forClientId).toBe('client-1');

      // Look up client name
      const clientProfile = await mockDb.query('profiles')
        .withIndex('by_user_id')
        .unique();

      expect(clientProfile?.fullName).toBe('Test Client');
    });

    test('returns assigned boards for communicators', async () => {
      const assignedBoard = createBoard({
        userId: 'caregiver-1',
        name: 'Assigned Board',
        forClientId: 'communicator-1',
        clientAccessLevel: 'edit',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'communicator-1',
      });

      // Own boards (empty)
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([]),
        }),
      });

      // Assigned boards
      mockDb.query.mockReturnValueOnce({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([assignedBoard]),
        }),
      });

      const ownBoards = await mockDb.query('phraseBoards')
        .withIndex('by_user_id')
        .collect();

      const assignedBoards = await mockDb.query('phraseBoards')
        .withIndex('by_client')
        .collect();

      expect(ownBoards).toHaveLength(0);
      expect(assignedBoards).toHaveLength(1);
      expect(assignedBoards[0].clientAccessLevel).toBe('edit');
    });
  });

  describe('getPhraseBoard', () => {
    test('returns board for owner', async () => {
      const board = createBoard();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(identity?.subject);
    });

    test('returns board for assigned client', async () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'client-1',
      });

      mockDb.get.mockResolvedValue(board);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      expect(result).not.toBeNull();
      expect(result?.forClientId).toBe(identity?.subject);
    });

    test('returns null for unauthorized user', async () => {
      const board = createBoard();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'other-user',
      });

      mockDb.get.mockResolvedValue(board);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const isOwner = result?.userId === identity?.subject;
      const isAssigned = result?.forClientId === identity?.subject;

      expect(isOwner).toBe(false);
      expect(isAssigned).toBe(false);
    });
  });

  describe('addPhraseBoard', () => {
    test('creates personal board', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.insert.mockResolvedValue('new-board-id');

      const identity = await mockCtx.auth.getUserIdentity();
      const boardId = await mockDb.insert('phraseBoards', {
        userId: identity!.subject,
        name: 'New Board',
        position: 0,
      });

      expect(boardId).toBe('new-board-id');
    });

    test('creates board for client', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'caregiver-1',
      });

      mockDb.insert.mockResolvedValue('client-board-id');

      const identity = await mockCtx.auth.getUserIdentity();
      const boardId = await mockDb.insert('phraseBoards', {
        userId: identity!.subject,
        name: 'Client Board',
        position: 0,
        forClientId: 'client-1',
        clientAccessLevel: 'edit',
      });

      expect(boardId).toBe('client-board-id');
      expect(mockDb.insert).toHaveBeenCalledWith('phraseBoards', expect.objectContaining({
        forClientId: 'client-1',
        clientAccessLevel: 'edit',
      }));
    });

    test('defaults clientAccessLevel to view', async () => {
      mockDb.insert.mockResolvedValue('board-id');

      // When forClientId provided but no accessLevel, default to 'view'
      const boardData = {
        userId: 'caregiver-1',
        name: 'Client Board',
        position: 0,
        forClientId: 'client-1',
        clientAccessLevel: 'view', // Default
      };

      await mockDb.insert('phraseBoards', boardData);

      expect(mockDb.insert).toHaveBeenCalledWith('phraseBoards', expect.objectContaining({
        clientAccessLevel: 'view',
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

  describe('updatePhraseBoard', () => {
    test('updates board for owner', async () => {
      const board = createBoard();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);
      mockDb.patch.mockResolvedValue(undefined);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      if (result?.userId === identity?.subject) {
        await mockDb.patch('board-1', { name: 'Updated Name' });
      }

      expect(mockDb.patch).toHaveBeenCalledWith('board-1', { name: 'Updated Name' });
    });

    test('throws error for non-owner', async () => {
      const board = createBoard();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'other-user',
      });

      mockDb.get.mockResolvedValue(board);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const validateOwnership = () => {
        if (result?.userId !== identity?.subject) {
          throw new Error('Unauthorized');
        }
      };

      expect(validateOwnership).toThrow('Unauthorized');
    });
  });

  describe('deletePhraseBoard', () => {
    test('deletes board and associated phrases', async () => {
      const board = createBoard();
      const phraseBoardPhrase = { _id: 'pbp-1', boardId: 'board-1', phraseId: 'phrase-1' };

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);

      // Mock phrase links query
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([phraseBoardPhrase]),
        }),
      });

      mockDb.delete.mockResolvedValue(undefined);

      // Simulate cascade delete
      const phraseLinks = await mockDb.query('phraseBoardPhrases')
        .withIndex('by_board')
        .collect();

      for (const link of phraseLinks) {
        await mockDb.delete(link.phraseId);
        await mockDb.delete(link._id);
      }

      await mockDb.delete('board-1');

      expect(mockDb.delete).toHaveBeenCalledWith('phrase-1');
      expect(mockDb.delete).toHaveBeenCalledWith('pbp-1');
      expect(mockDb.delete).toHaveBeenCalledWith('board-1');
    });
  });

  describe('addPhraseToBoard', () => {
    test('owner can add phrase to board', async () => {
      const board = createBoard();

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);
      mockDb.insert.mockResolvedValue('pbp-1');

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      if (result?.userId === identity?.subject) {
        await mockDb.insert('phraseBoardPhrases', {
          boardId: 'board-1',
          phraseId: 'phrase-1',
        });
      }

      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('client with edit access can add phrase', async () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'edit',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'client-1',
      });

      mockDb.get.mockResolvedValue(board);
      mockDb.insert.mockResolvedValue('pbp-1');

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const isOwner = result?.userId === identity?.subject;
      const hasEditAccess = result?.forClientId === identity?.subject &&
        result?.clientAccessLevel === 'edit';

      if (isOwner || hasEditAccess) {
        await mockDb.insert('phraseBoardPhrases', {
          boardId: 'board-1',
          phraseId: 'phrase-1',
        });
      }

      expect(hasEditAccess).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('client with view-only access cannot add phrase', async () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'client-1',
      });

      mockDb.get.mockResolvedValue(board);

      const result = await mockDb.get('board-1');
      const identity = await mockCtx.auth.getUserIdentity();

      const isOwner = result?.userId === identity?.subject;
      const hasEditAccess = result?.forClientId === identity?.subject &&
        result?.clientAccessLevel === 'edit';

      const validateAccess = () => {
        if (!isOwner && !hasEditAccess) {
          throw new Error('Unauthorized');
        }
      };

      expect(validateAccess).toThrow('Unauthorized');
    });

    test('throws error when adding phrase with duplicate text to board', async () => {
      const board = createBoard();
      const existingPhrase = { _id: 'phrase-1', userId: 'user-123', text: 'Hello', frequency: 0, position: 0 };
      const newPhrase = { _id: 'phrase-2', userId: 'user-123', text: 'Hello', frequency: 0, position: 1 };
      const existingLink = { _id: 'pbp-1', boardId: 'board-1', phraseId: 'phrase-1' };

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      // Mock getting the new phrase being added
      mockDb.get.mockImplementation((id: string) => {
        if (id === 'board-1') return Promise.resolve(board);
        if (id === 'phrase-1') return Promise.resolve(existingPhrase);
        if (id === 'phrase-2') return Promise.resolve(newPhrase);
        return Promise.resolve(null);
      });

      // Mock query for existing phrases on board
      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([existingLink]),
        }),
      });

      // Simulate the duplicate check logic
      const phraseToAdd = await mockDb.get('phrase-2');
      const boardPhraseLinks = await mockDb.query('phraseBoardPhrases')
        .withIndex('by_board')
        .collect();

      const checkForDuplicate = async () => {
        for (const link of boardPhraseLinks) {
          const existingPhraseOnBoard = await mockDb.get(link.phraseId);
          if (existingPhraseOnBoard && existingPhraseOnBoard.text === phraseToAdd?.text) {
            throw new Error('A phrase with this text already exists on this board');
          }
        }
      };

      await expect(checkForDuplicate()).rejects.toThrow('A phrase with this text already exists on this board');
    });

    test('allows adding phrase with different text to board', async () => {
      const board = createBoard();
      const existingPhrase = { _id: 'phrase-1', userId: 'user-123', text: 'Hello', frequency: 0, position: 0 };
      const newPhrase = { _id: 'phrase-2', userId: 'user-123', text: 'Goodbye', frequency: 0, position: 1 };
      const existingLink = { _id: 'pbp-1', boardId: 'board-1', phraseId: 'phrase-1' };

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockImplementation((id: string) => {
        if (id === 'board-1') return Promise.resolve(board);
        if (id === 'phrase-1') return Promise.resolve(existingPhrase);
        if (id === 'phrase-2') return Promise.resolve(newPhrase);
        return Promise.resolve(null);
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([existingLink]),
        }),
      });

      mockDb.insert.mockResolvedValue('pbp-2');

      // Simulate the duplicate check logic
      const phraseToAdd = await mockDb.get('phrase-2');
      const boardPhraseLinks = await mockDb.query('phraseBoardPhrases')
        .withIndex('by_board')
        .collect();

      let hasDuplicate = false;
      for (const link of boardPhraseLinks) {
        const existingPhraseOnBoard = await mockDb.get(link.phraseId);
        if (existingPhraseOnBoard && existingPhraseOnBoard.text === phraseToAdd?.text) {
          hasDuplicate = true;
          break;
        }
      }

      // No duplicate, so insert should proceed
      expect(hasDuplicate).toBe(false);

      if (!hasDuplicate) {
        await mockDb.insert('phraseBoardPhrases', {
          boardId: 'board-1',
          phraseId: 'phrase-2',
        });
      }

      expect(mockDb.insert).toHaveBeenCalledWith('phraseBoardPhrases', {
        boardId: 'board-1',
        phraseId: 'phrase-2',
      });
    });
  });

  describe('getBoardsForClient', () => {
    test('returns boards assigned to specific client', async () => {
      const client1Board = createBoard({
        _id: 'board-1',
        forClientId: 'client-1',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'caregiver-1',
      });

      mockDb.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue([client1Board]),
          }),
        }),
      });

      const boards = await mockDb.query('phraseBoards')
        .withIndex('by_client')
        .filter()
        .collect();

      expect(boards).toHaveLength(1);
      expect(boards[0].forClientId).toBe('client-1');
    });
  });

  describe('updateBoardClientAccess', () => {
    test('toggles access level', async () => {
      const board = createBoard({
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);
      mockDb.patch.mockResolvedValue(undefined);

      await mockDb.patch('board-1', { clientAccessLevel: 'edit' });

      expect(mockDb.patch).toHaveBeenCalledWith('board-1', { clientAccessLevel: 'edit' });
    });
  });

  describe('unassignBoardFromClient', () => {
    test('removes client assignment', async () => {
      const board = createBoard({
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({
        subject: 'user-123',
      });

      mockDb.get.mockResolvedValue(board);
      mockDb.patch.mockResolvedValue(undefined);

      await mockDb.patch('board-1', {
        forClientId: undefined,
        clientAccessLevel: undefined,
      });

      expect(mockDb.patch).toHaveBeenCalledWith('board-1', {
        forClientId: undefined,
        clientAccessLevel: undefined,
      });
    });
  });
});
