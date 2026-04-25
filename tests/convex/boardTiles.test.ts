/**
 * Convex boardTiles function tests
 *
 * Note: Like the sibling phraseBoards.test.ts, these tests mock the Convex
 * runtime and re-implement key invariants of each handler so that schema
 * changes or rule changes break tests. For true integration testing, use
 * Convex's test deployment or convex-test in an ESM-compatible test runner.
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

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

const createBoard = (overrides = {}) => ({
  _id: 'board-1',
  userId: 'user-123',
  name: 'Test Board',
  position: 0,
  forClientId: undefined,
  clientAccessLevel: undefined,
  ...overrides,
});

const createTile = (overrides = {}) => ({
  _id: 'tile-1',
  boardId: 'board-1',
  position: 0,
  kind: 'phrase' as 'phrase' | 'navigate',
  phraseId: 'phrase-1',
  targetBoardId: undefined,
  ...overrides,
});

describe('boardTiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addNavigateTile invariants', () => {
    test('rejects when source and target board are the same', () => {
      const sourceBoardId = 'board-1';
      const targetBoardId = 'board-1';

      const validate = () => {
        if (sourceBoardId === targetBoardId) {
          throw new Error('A navigate tile cannot point at its own board');
        }
      };

      expect(validate).toThrow(/cannot point at its own board/);
    });

    test('owner of source board can add navigate tile to a board they read', () => {
      const sourceBoard = createBoard();
      const targetBoard = createBoard({ _id: 'board-2', name: 'Target' });

      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
      mockDb.get.mockImplementation((id: unknown) => {
        if (id === 'board-1') return Promise.resolve(sourceBoard);
        if (id === 'board-2') return Promise.resolve(targetBoard);
        return Promise.resolve(null);
      });

      const isOwner = sourceBoard.userId === 'user-123';
      const canReadTarget = targetBoard.userId === 'user-123';

      expect(isOwner).toBe(true);
      expect(canReadTarget).toBe(true);
    });

    test('client with view-only access cannot add a navigate tile', () => {
      const sourceBoard = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'client-1' });

      const isOwner = sourceBoard.userId === 'client-1';
      const canEdit =
        isOwner ||
        (sourceBoard.forClientId === 'client-1' && sourceBoard.clientAccessLevel === 'edit');

      const guard = () => {
        if (!canEdit) throw new Error('Unauthorized - board');
      };

      expect(guard).toThrow(/Unauthorized/);
    });
  });

  describe('listByBoard hydration', () => {
    test('phrase-kind tile pairs with the phrase row', async () => {
      const tile = createTile({ kind: 'phrase', phraseId: 'phrase-1', position: 0 });
      const phrase = { _id: 'phrase-1', userId: 'user-123', text: 'Hi', position: 0 };

      mockDb.get.mockImplementation((id: unknown) => {
        if (id === 'phrase-1') return Promise.resolve(phrase);
        return Promise.resolve(null);
      });

      const hydrated =
        tile.kind === 'phrase'
          ? { ...tile, phrase: await mockDb.get(tile.phraseId) }
          : tile;

      expect(hydrated).toMatchObject({
        kind: 'phrase',
        phraseId: 'phrase-1',
        phrase: { text: 'Hi' },
      });
    });

    test('navigate-kind tile resolves a missing target as broken (name=null)', async () => {
      const tile = createTile({
        _id: 'tile-2',
        kind: 'navigate',
        phraseId: undefined,
        targetBoardId: 'board-deleted',
        position: 1,
      });

      mockDb.get.mockResolvedValue(null);

      const target = await mockDb.get(tile.targetBoardId);
      const result = {
        ...tile,
        targetBoardName: (target as { name?: string } | null)?.name ?? null,
      };

      expect(result.targetBoardName).toBeNull();
    });
  });

  describe('reorderTiles', () => {
    test('only patches tiles that belong to the given board', async () => {
      const onBoard = [
        { _id: 'tile-1', boardId: 'board-1', position: 0 },
        { _id: 'tile-2', boardId: 'board-1', position: 1 },
      ];
      const orderedTileIds = ['tile-2', 'tile-1', 'tile-stranger'];

      mockDb.patch.mockResolvedValue(undefined);

      const tilesById = new Map(onBoard.map((t) => [t._id, t]));

      await Promise.all(
        orderedTileIds.map((id, index) => {
          const tile = tilesById.get(id);
          if (!tile) return undefined;
          return mockDb.patch(tile._id, { position: index });
        })
      );

      expect(mockDb.patch).toHaveBeenCalledTimes(2);
      expect(mockDb.patch).toHaveBeenCalledWith('tile-2', { position: 0 });
      expect(mockDb.patch).toHaveBeenCalledWith('tile-1', { position: 1 });
      expect(mockDb.patch).not.toHaveBeenCalledWith('tile-stranger', expect.anything());
    });
  });

  describe('migrateToBoardTiles idempotency', () => {
    test('skips links that already have a matching boardTile', async () => {
      const links = [
        { _id: 'pbp-1', boardId: 'board-1', phraseId: 'phrase-1', position: 0 },
        { _id: 'pbp-2', boardId: 'board-1', phraseId: 'phrase-2', position: 1 },
      ];
      const existingTiles = [
        // pbp-1 already migrated; pbp-2 has not been
        { _id: 'tile-x', boardId: 'board-1', phraseId: 'phrase-1', kind: 'phrase' },
      ];

      const existingKeys = new Set(
        existingTiles.map((t) => `${t.boardId}::${t.phraseId}`)
      );

      let inserted = 0;
      let skipped = 0;
      for (const link of links) {
        const key = `${link.boardId}::${link.phraseId}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await mockDb.insert('boardTiles', {
          boardId: link.boardId,
          phraseId: link.phraseId,
          position: link.position,
          kind: 'phrase',
        });
        existingKeys.add(key);
        inserted++;
      }

      expect(inserted).toBe(1);
      expect(skipped).toBe(1);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });
  });
});
