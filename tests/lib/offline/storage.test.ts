import {
  clearOfflineBootstrap,
  deriveOfflineBootMode,
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
});
