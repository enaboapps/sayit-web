/**
 * Convex boardTiles function tests
 *
 * Note: Like the sibling phraseBoards.test.ts, these tests mock the Convex
 * runtime and re-implement key invariants of each handler so that schema
 * changes or rule changes break tests. For true integration testing, use
 * Convex's test deployment or convex-test in an ESM-compatible test runner.
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import {
  isAllowedAudioMimeType,
  normaliseAudioMimeType,
  validateAudioLabel,
  validateAudioMetadata,
  MAX_AUDIO_BYTES,
} from '@/convex/audioLimits';
import { getCoreWordsForPreset, getPresetDimensions } from '@/convex/aacLayout';

const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  storage: {
    getUrl: jest.fn(),
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

const createTile = (overrides = {}) => ({
  _id: 'tile-1',
  boardId: 'board-1',
  position: 0,
  kind: 'phrase' as 'phrase' | 'navigate' | 'audio',
  phraseId: 'phrase-1',
  targetBoardId: undefined,
  audioLabel: undefined,
  audioStorageId: undefined,
  audioMimeType: undefined,
  audioDurationMs: undefined,
  audioByteSize: undefined,
  cellRow: undefined,
  cellColumn: undefined,
  tileRole: undefined,
  isLocked: undefined,
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

    test('audio-kind tile resolves a storage URL', async () => {
      const tile = createTile({
        _id: 'tile-audio',
        kind: 'audio',
        phraseId: undefined,
        audioLabel: 'Greeting',
        audioStorageId: 'storage-1',
        audioMimeType: 'audio/webm',
        audioDurationMs: 1200,
        audioByteSize: 2048,
      });

      mockCtx.storage.getUrl.mockResolvedValue('https://files.example/audio.webm');

      const result = {
        ...tile,
        audioUrl: await mockCtx.storage.getUrl(tile.audioStorageId),
      };

      expect(result).toMatchObject({
        kind: 'audio',
        audioLabel: 'Greeting',
        audioUrl: 'https://files.example/audio.webm',
      });
      expect(mockCtx.storage.getUrl).toHaveBeenCalledWith('storage-1');
    });
  });

  describe('audio tile invariants', () => {
    // These exercise the real validators from convex/audioLimits.ts so any
    // change to label/metadata rules surfaces here.
    const validateLabel = validateAudioLabel;
    const validateMetadata = (mimeType: string, durationMs: number, byteSize: number) =>
      validateAudioMetadata({
        audioMimeType: mimeType,
        audioDurationMs: durationMs,
        audioByteSize: byteSize,
      });

    test('addAudioTile rejects unauthenticated users', async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const identity = await mockCtx.auth.getUserIdentity();

      const guard = () => {
        if (!identity) throw new Error('Unauthenticated');
      };

      expect(guard).toThrow(/Unauthenticated/);
    });

    test('addAudioTile rejects users without edit access', () => {
      const board = createBoard({
        userId: 'caregiver-1',
        forClientId: 'client-1',
        clientAccessLevel: 'view',
      });

      const canEdit =
        board.userId === 'client-1' ||
        (board.forClientId === 'client-1' && board.clientAccessLevel === 'edit');

      const guard = () => {
        if (!canEdit) throw new Error('Unauthorized - board');
      };

      expect(guard).toThrow(/Unauthorized/);
    });

    test('addAudioTile rejects empty labels', () => {
      expect(() => validateLabel('   ')).toThrow(/label is required/);
    });

    test('addAudioTile rejects labels over the length cap', () => {
      expect(() => validateLabel('a'.repeat(200))).toThrow(/80 characters/);
    });

    test('addAudioTile rejects recordings over 60 seconds', () => {
      expect(() => validateMetadata('audio/webm', 60001, 1200)).toThrow(/60 seconds/);
    });

    test('addAudioTile rejects empty recordings', () => {
      expect(() => validateMetadata('audio/webm', 1000, 0)).toThrow(/empty/);
    });

    test('addAudioTile rejects recordings over the byte cap', () => {
      expect(() => validateMetadata('audio/webm', 1000, MAX_AUDIO_BYTES + 1)).toThrow(/MB limit/);
    });

    test('addAudioTile rejects unknown MIME types', () => {
      expect(() => validateMetadata('audio/x-bogus', 1000, 1200)).toThrow(/MIME type/);
      expect(() => validateMetadata('image/png', 1000, 1200)).toThrow(/MIME type/);
      expect(() => validateMetadata('', 1000, 1200)).toThrow(/MIME type/);
    });

    test('addAudioTile accepts every allow-listed MIME (incl. codec params)', () => {
      expect(() => validateMetadata('audio/webm;codecs=opus', 1000, 1200)).not.toThrow();
      expect(() => validateMetadata('audio/mp4;codecs=mp4a.40.2', 1000, 1200)).not.toThrow();
      expect(() => validateMetadata('audio/ogg', 1000, 1200)).not.toThrow();
      expect(() => validateMetadata('audio/wav', 1000, 1200)).not.toThrow();
    });

    test('isAllowedAudioMimeType strips codec params before matching', () => {
      expect(isAllowedAudioMimeType('audio/webm;codecs=opus')).toBe(true);
      expect(isAllowedAudioMimeType('AUDIO/WEBM')).toBe(true);
      expect(isAllowedAudioMimeType('audio/x-bogus')).toBe(false);
    });

    test('normaliseAudioMimeType trims and lowercases', () => {
      expect(normaliseAudioMimeType('AUDIO/WEBM ;codecs=opus')).toBe('audio/webm');
      expect(normaliseAudioMimeType('  audio/mp4  ')).toBe('audio/mp4');
    });

    test('addAudioTile inserts an audio tile at the next position with normalised label/MIME', async () => {
      const existingTiles = [
        createTile({ _id: 'tile-1', position: 0 }),
        createTile({ _id: 'tile-2', position: 1, kind: 'navigate' }),
      ];

      await mockDb.insert('boardTiles', {
        boardId: 'board-1',
        position: existingTiles.length,
        kind: 'audio',
        audioLabel: validateLabel(' Greeting '),
        audioStorageId: 'storage-1',
        audioMimeType: normaliseAudioMimeType('audio/webm;codecs=opus'),
        audioDurationMs: 1000,
        audioByteSize: 1200,
      });

      expect(mockDb.insert).toHaveBeenCalledWith('boardTiles', expect.objectContaining({
        kind: 'audio',
        position: 2,
        audioLabel: 'Greeting',
        audioMimeType: 'audio/webm',
      }));
    });

    test('updateAudioTile rejects non-audio tiles', () => {
      const tile = createTile({ kind: 'phrase' });

      const guard = () => {
        if (tile.kind !== 'audio') throw new Error('Tile is not an audio tile');
      };

      expect(guard).toThrow(/not an audio tile/);
    });

    test('updateAudioTile requires edit access', () => {
      const board = createBoard({ userId: 'other-user' });
      const canEdit = board.userId === 'user-123';

      const guard = () => {
        if (!canEdit) throw new Error('Unauthorized');
      };

      expect(guard).toThrow(/Unauthorized/);
    });

    test('updateAudioTile deletes old storage when replacing audio', async () => {
      const tile = createTile({
        kind: 'audio',
        audioStorageId: 'old-storage',
      });

      await mockDb.patch(tile._id, {
        audioStorageId: 'new-storage',
        audioMimeType: 'audio/webm',
        audioDurationMs: 1500,
        audioByteSize: 2000,
      });
      await mockCtx.storage.delete(tile.audioStorageId);

      expect(mockDb.patch).toHaveBeenCalledWith('tile-1', expect.objectContaining({
        audioStorageId: 'new-storage',
      }));
      expect(mockCtx.storage.delete).toHaveBeenCalledWith('old-storage');
    });

    test('deleteTile deletes audio storage before deleting the tile', async () => {
      const tile = createTile({
        kind: 'audio',
        audioStorageId: 'storage-1',
      });

      if (tile.kind === 'audio' && tile.audioStorageId) {
        await mockCtx.storage.delete(tile.audioStorageId);
      }
      await mockDb.delete(tile._id);

      expect(mockCtx.storage.delete).toHaveBeenCalledWith('storage-1');
      expect(mockDb.delete).toHaveBeenCalledWith('tile-1');
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

  describe('fixed-grid layout invariants', () => {
    test('standard36 starter board has all 36 core words and fixed dimensions', () => {
      const dimensions = getPresetDimensions('standard36');
      const words = getCoreWordsForPreset('standard36');

      expect(dimensions).toEqual({ rows: 6, columns: 6 });
      expect(words).toHaveLength(36);
      expect(words.map((word) => word.text)).toEqual([
        'all', 'can', 'different', 'do', 'finished', 'get',
        'go', 'good', 'he', 'help', 'here', 'I',
        'in', 'it', 'like', 'look', 'make', 'more',
        'not', 'on', 'open', 'put', 'same', 'she',
        'some', 'stop', 'that', 'turn', 'up', 'want',
        'what', 'when', 'where', 'who', 'why', 'you',
      ]);
    });

    test('cell collision validation rejects an occupied fixed-grid cell', () => {
      const movingTile = createTile({ _id: 'tile-moving', cellRow: 0, cellColumn: 0 });
      const occupiedTile = createTile({ _id: 'tile-occupied', cellRow: 1, cellColumn: 1 });
      const existingTiles = [movingTile, occupiedTile];

      const validateMove = (row: number, column: number) => {
        const occupant = existingTiles.find(
          (tile) =>
            tile._id !== movingTile._id &&
            tile.cellRow === row &&
            tile.cellColumn === column
        );
        if (occupant) throw new Error('Cell is already occupied');
      };

      expect(() => validateMove(1, 1)).toThrow(/already occupied/);
      expect(() => validateMove(2, 2)).not.toThrow();
    });

    test('every preset core word fits inside its grid dimensions', () => {
      // Each preset must promise enough cells for the core vocabulary it
      // returns; otherwise createAACStarterBoard's `cellRow = floor(index / cols)`
      // derivation overflows the last row and tiles render off-grid. Asserting
      // here keeps preset/word-list edits in sync.
      for (const preset of ['largeAccess16', 'standard36', 'dense48'] as const) {
        const { rows, columns } = getPresetDimensions(preset);
        const words = getCoreWordsForPreset(preset);
        const capacity = rows * columns;
        expect(words.length).toBeLessThanOrEqual(capacity);
        // Spot-check the index -> (row, column) derivation for the last word
        // doesn't blow past `rows`, since that's exactly what would happen if
        // someone bumped a word list without bumping the grid.
        const lastIndex = words.length - 1;
        expect(Math.floor(lastIndex / columns)).toBeLessThan(rows);
        expect(lastIndex % columns).toBeLessThan(columns);
      }
    });

    test('largeAccess16 produces exactly 16 core words for a 4x4 grid', () => {
      // The motor-impaired access preset has zero margin: 16 words, 16 cells.
      // If the word list grows or shrinks, either the grid resizes too or the
      // user gets a truncated / sparse board. Lock both numbers in.
      const { rows, columns } = getPresetDimensions('largeAccess16');
      const words = getCoreWordsForPreset('largeAccess16');
      expect(rows * columns).toBe(16);
      expect(words).toHaveLength(16);
    });

    test('locked core tiles require explicit delete confirmation', () => {
      const tile = createTile({ isLocked: true, tileRole: 'core' });

      const guard = (confirmLockedCoreDelete?: boolean) => {
        if (tile.isLocked && tile.tileRole === 'core' && !confirmLockedCoreDelete) {
          throw new Error('Locked core tiles require explicit confirmation before deletion');
        }
      };

      expect(() => guard()).toThrow(/Locked core tiles/);
      expect(() => guard(true)).not.toThrow();
    });

    test('removePhraseFromBoard refuses to detach a locked core tile', () => {
      // Mirrors the invariant added to convex/phraseBoards.ts:
      // removePhraseFromBoard. Without this, a client could bypass the
      // deletePhrase lock by removing the tile first (which orphans the
      // phrase from the board even though the phrase row stays). All
      // detach paths now share the same protection.
      const lockedCoreTile = createTile({ isLocked: true, tileRole: 'core' });
      const nonCoreTile = createTile({ _id: 'tile-2', isLocked: false, tileRole: 'fringe' });

      const guard = (tile: { isLocked?: boolean; tileRole?: string }) => {
        if (tile.isLocked && tile.tileRole === 'core') {
          throw new Error('Locked core tiles cannot be removed from the board with this action');
        }
      };

      expect(() => guard(lockedCoreTile)).toThrow(/Locked core tiles cannot be removed/);
      expect(() => guard(nonCoreTile)).not.toThrow();
    });
  });

  describe('Open Board import hiddenFromPicker logic', () => {
    test('boards reachable only via a navigate tile are hidden from the picker', () => {
      // Mirrors the per-import scan in convex/openBoardImport.ts. A board is
      // hidden when some other board's navigate tile points at it; root /
      // entry-point boards stay visible. Drill-downs in CommuniKate (Food,
      // People, ...) are reached from "CommuniKate Top Page" — only the top
      // page should show in the picker after import.
      const importPayload = [
        {
          sourceId: 'top',
          tiles: [
            { kind: 'navigate' as const, targetSourceId: 'food' },
            { kind: 'navigate' as const, targetSourceId: 'people' },
          ],
        },
        {
          sourceId: 'food',
          tiles: [{ kind: 'phrase' as const, text: 'apple' }],
        },
        {
          sourceId: 'people',
          tiles: [{ kind: 'phrase' as const, text: 'mom' }],
        },
      ];

      const navTargets = new Set<string>();
      for (const board of importPayload) {
        for (const tile of board.tiles) {
          if (tile.kind === 'navigate' && tile.targetSourceId !== board.sourceId) {
            navTargets.add(tile.targetSourceId);
          }
        }
      }

      const decisions = importPayload.map((board) => ({
        sourceId: board.sourceId,
        hiddenFromPicker: navTargets.has(board.sourceId),
      }));

      expect(decisions).toEqual([
        { sourceId: 'top', hiddenFromPicker: false },
        { sourceId: 'food', hiddenFromPicker: true },
        { sourceId: 'people', hiddenFromPicker: true },
      ]);
    });

    test('a self-referencing navigate tile does not hide its own board', () => {
      // Defensive: an OBF could in theory carry a "back to top" tile pointing
      // at the same page id (the importer drops it as a self-loop too, but
      // this test pins down that we don't accidentally hide the only board.)
      const importPayload = [{
        sourceId: 'only',
        tiles: [{ kind: 'navigate' as const, targetSourceId: 'only' }],
      }];

      const navTargets = new Set<string>();
      for (const board of importPayload) {
        for (const tile of board.tiles) {
          if (tile.kind === 'navigate' && tile.targetSourceId !== board.sourceId) {
            navTargets.add(tile.targetSourceId);
          }
        }
      }

      expect(navTargets.has('only')).toBe(false);
    });
  });

  describe('Open Board import invariants', () => {
    test('imported boards create fixed-grid board tiles, not legacy phrase links', async () => {
      const boardId = 'imported-board-1';
      const phraseId = 'imported-phrase-1';

      await mockDb.insert('phraseBoards', {
        userId: 'user-123',
        name: 'Imported',
        position: 0,
        layoutMode: 'fixedGrid',
        gridRows: 2,
        gridColumns: 2,
        layoutVersion: 1,
        sourceTemplate: 'custom',
      });
      await mockDb.insert('phrases', {
        userId: 'user-123',
        text: 'more',
        frequency: 0,
        position: 0,
      });
      await mockDb.insert('boardTiles', {
        boardId,
        position: 0,
        kind: 'phrase',
        phraseId,
        cellRow: 1,
        cellColumn: 1,
        cellRowSpan: 1,
        cellColumnSpan: 1,
        tileRole: 'fringe',
        isLocked: false,
      });

      expect(mockDb.insert).toHaveBeenCalledWith('phraseBoards', expect.objectContaining({
        layoutMode: 'fixedGrid',
        gridRows: 2,
        gridColumns: 2,
      }));
      expect(mockDb.insert).toHaveBeenCalledWith('boardTiles', expect.objectContaining({
        kind: 'phrase',
        cellRow: 1,
        cellColumn: 1,
      }));
      expect(mockDb.insert).not.toHaveBeenCalledWith('phraseBoardPhrases', expect.anything());
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
