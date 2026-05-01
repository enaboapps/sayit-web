import {
  clearOfflineBootstrap,
  deriveOfflineBootMode,
  normalizeBoardDocuments,
  readOfflineBootstrap,
  updateOfflineSelectedBoard,
  updateOfflineSyncStatus,
  writeOfflineBootstrap,
} from '@/lib/offline/storage';

describe('offline bootstrap storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    clearOfflineBootstrap();
  });

  it('returns a text-only bootstrap by default', () => {
    expect(readOfflineBootstrap()).toEqual({
      schemaVersion: 1,
      mode: 'text-only',
      boardCount: 0,
      lastSyncAt: null,
      lastKnownUserId: null,
      selectedBoardId: null,
      syncStatus: 'idle',
    });
  });

  it('derives offline-ready mode when cached boards exist', () => {
    writeOfflineBootstrap({
      mode: 'offline-ready',
      boardCount: 2,
      lastKnownUserId: 'user_123',
      syncStatus: 'ready',
    });

    expect(deriveOfflineBootMode({
      isOnline: false,
      bootstrap: readOfflineBootstrap(),
    })).toBe('offline-ready');
  });

  it('updates sync status and selected board in bootstrap storage', () => {
    updateOfflineSyncStatus('syncing', {
      lastKnownUserId: 'user_123',
    });
    updateOfflineSelectedBoard('board_123');

    expect(readOfflineBootstrap()).toMatchObject({
      lastKnownUserId: 'user_123',
      selectedBoardId: 'board_123',
      syncStatus: 'syncing',
    });
  });

  it('falls back to online mode when the browser is online', () => {
    expect(deriveOfflineBootMode({ isOnline: true })).toBe('online');
  });

  it('preserves fixed-grid tile metadata when normalizing cached boards', () => {
    const [board] = normalizeBoardDocuments('user_123', [
      {
        _id: 'board_1',
        name: 'Core',
        position: 0,
        layoutMode: 'fixedGrid',
        layoutPreset: 'standard36',
        gridRows: 6,
        gridColumns: 6,
        layoutVersion: 1,
        sourceTemplate: 'sayitCoreV1',
        tiles: [
          {
            _id: 'tile_1',
            kind: 'phrase',
            position: 0,
            phrase: { _id: 'phrase_1', text: 'go', symbolUrl: 'https://example.com/go.png' },
            cellRow: 0,
            cellColumn: 0,
            tileRole: 'core',
            wordClass: 'verb',
            isLocked: true,
          },
        ],
      },
    ], 123);

    expect(board).toMatchObject({
      layoutMode: 'fixedGrid',
      layoutPreset: 'standard36',
      gridRows: 6,
      gridColumns: 6,
      tiles: [
        {
          kind: 'phrase',
          cellRow: 0,
          cellColumn: 0,
          tileRole: 'core',
          wordClass: 'verb',
          isLocked: true,
          phrase: { text: 'go', symbolUrl: 'https://example.com/go.png' },
        },
      ],
    });
  });

  it('round-trips hiddenFromPicker so offline picker matches online behavior', () => {
    // Imported drill-down boards are flagged hiddenFromPicker on the server.
    // Offline mode reads boards from the cached document; without preserving
    // the flag the picker would show all 96 CommuniKate boards even when the
    // user is offline.
    const [hiddenBoard, visibleBoard] = normalizeBoardDocuments('user_123', [
      {
        _id: 'board_food',
        name: 'Food',
        position: 1,
        hiddenFromPicker: true,
      },
      {
        _id: 'board_top',
        name: 'Top',
        position: 0,
        hiddenFromPicker: false,
      },
    ], 789);

    // Sorted by position so visible (top) comes first.
    expect(hiddenBoard.id).toBe('board_top');
    expect(hiddenBoard.hiddenFromPicker).toBe(false);
    expect(visibleBoard.id).toBe('board_food');
    expect(visibleBoard.hiddenFromPicker).toBe(true);
  });

  it('normalizes legacy boards (no layoutMode/grid metadata) into free-mode without crashing', () => {
    // Boards created before issue #649 have no layoutMode, no grid dims, no
    // cell metadata on tiles, and may store phrases via the legacy
    // phrase_board_phrases array rather than the polymorphic tiles array.
    // The chooser at PhrasesTabContent only routes to FixedAACGrid when
    // layoutMode === 'fixedGrid' AND gridRows/gridColumns are numbers, so
    // a normalized free-mode board must keep grid dims undefined for the
    // legacy renderer to receive control.
    const [board] = normalizeBoardDocuments('user_123', [
      {
        _id: 'legacy_board',
        name: 'My Phrases',
        position: 1,
        // layoutMode/layoutPreset/gridRows/gridColumns/sourceTemplate all
        // intentionally omitted to mimic a board persisted before this PR.
        phrase_board_phrases: [
          { phrase: { _id: 'phrase_a', text: 'hello' } },
          { phrase: { _id: 'phrase_b', text: 'thanks', symbolUrl: 'https://example.com/thanks.png' } },
        ],
      },
    ], 456);

    expect(board.layoutMode).toBe('free');
    expect(board.layoutPreset).toBeUndefined();
    expect(board.gridRows).toBeUndefined();
    expect(board.gridColumns).toBeUndefined();
    expect(board.layoutVersion).toBeUndefined();
    expect(board.sourceTemplate).toBeUndefined();
    expect(board.phrases).toEqual([
      { id: 'phrase_a', text: 'hello', symbolUrl: undefined },
      { id: 'phrase_b', text: 'thanks', symbolUrl: 'https://example.com/thanks.png' },
    ]);
    // No tiles array on the source means tiles is undefined in the normalized
    // output — legacy renderers consume `phrases`, not `tiles`.
    expect(board.tiles).toBeUndefined();
  });
});
