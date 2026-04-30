'use client';

import { openDB, type DBSchema } from 'idb';

export type OfflineBootMode = 'booting' | 'online' | 'offline-text-only' | 'offline-ready';
export type OfflineSyncStatus = 'idle' | 'syncing' | 'ready' | 'failed';

const OFFLINE_BOOTSTRAP_STORAGE_KEY = 'sayit-offline-bootstrap';
const OFFLINE_SCHEMA_VERSION = 1;
const DB_NAME = 'sayit-offline';
const DB_VERSION = 1;
const BOARD_STORE = 'boards';

export interface OfflinePhraseDocument {
  id: string;
  text: string;
}

export interface OfflineBoardDocument {
  cacheKey: string;
  id: string;
  userId: string;
  name: string;
  position: number;
  phrases: OfflinePhraseDocument[];
  isShared: boolean;
  isOwner: boolean;
  accessLevel: 'view' | 'edit';
  sharedBy: string | null;
  forClientId: string | null;
  forClientName: string | null;
  cachedAt: number;
}

export interface OfflineBootstrapRecord {
  schemaVersion: number;
  mode: 'text-only' | 'offline-ready';
  boardCount: number;
  lastSyncAt: number | null;
  lastKnownUserId: string | null;
  selectedBoardId: string | null;
  syncStatus: OfflineSyncStatus;
}

interface OfflineBoardCacheDb extends DBSchema {
  boards: {
    key: string;
    value: OfflineBoardDocument;
    indexes: {
      byUserId: string;
    };
  };
}

interface CacheablePhraseBoard {
  _id: string;
  name: string;
  position?: number | null;
  isShared?: boolean | null;
  isOwner?: boolean | null;
  accessLevel?: 'view' | 'edit' | null;
  sharedBy?: string | null;
  forClientId?: string | null;
  forClientName?: string | null;
  phrase_board_phrases?: Array<{
    phrase?: {
      _id?: string;
      text?: string;
    } | null;
  }> | null;
}

function createDefaultBootstrap(
  overrides: Partial<OfflineBootstrapRecord> = {}
): OfflineBootstrapRecord {
  return {
    schemaVersion: OFFLINE_SCHEMA_VERSION,
    mode: 'text-only',
    boardCount: 0,
    lastSyncAt: null,
    lastKnownUserId: null,
    selectedBoardId: null,
    syncStatus: 'idle',
    ...overrides,
  };
}

function isBootstrapRecord(value: unknown): value is OfflineBootstrapRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OfflineBootstrapRecord>;
  return (
    candidate.schemaVersion === OFFLINE_SCHEMA_VERSION
    && (candidate.mode === 'text-only' || candidate.mode === 'offline-ready')
    && typeof candidate.boardCount === 'number'
    && (candidate.lastSyncAt === null || typeof candidate.lastSyncAt === 'number')
    && (candidate.lastKnownUserId === null || typeof candidate.lastKnownUserId === 'string')
    && (candidate.selectedBoardId === null || typeof candidate.selectedBoardId === 'string')
    && (
      candidate.syncStatus === 'idle'
      || candidate.syncStatus === 'syncing'
      || candidate.syncStatus === 'ready'
      || candidate.syncStatus === 'failed'
    )
  );
}

function boardCacheKey(userId: string, boardId: string): string {
  return `${userId}::${boardId}`;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

async function getDb() {
  try {
    return await openDB<OfflineBoardCacheDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(BOARD_STORE)) {
          const boards = db.createObjectStore(BOARD_STORE, {
            keyPath: 'cacheKey',
          });
          boards.createIndex('byUserId', 'userId');
        }
      },
    });
  } catch (error) {
    // IndexedDB can fail in private browsing, when storage is full, or if the
    // backing store is corrupted. Throw a typed error so callers can decide
    // whether to surface it or degrade silently.
    throw new Error(`IndexedDB unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeBoardDocuments(
  userId: string,
  boards: CacheablePhraseBoard[],
  cachedAt = Date.now()
): OfflineBoardDocument[] {
  return boards.map((board) => {
    const accessLevel: 'view' | 'edit' = board.accessLevel === 'view' ? 'view' : 'edit';

    return {
      cacheKey: boardCacheKey(userId, String(board._id)),
      id: String(board._id),
      userId,
      name: board.name,
      position: board.position ?? 0,
      phrases: (board.phrase_board_phrases ?? [])
        .map((entry) => entry.phrase)
        .filter((phrase): phrase is { _id?: string; text?: string } => Boolean(phrase?.text))
        .map((phrase) => ({
          id: String(phrase._id ?? `${userId}-${cachedAt}-${phrase.text}`),
          text: String(phrase.text),
        })),
      isShared: Boolean(board.isShared),
      isOwner: board.isOwner ?? true,
      accessLevel,
      sharedBy: board.sharedBy ?? null,
      forClientId: board.forClientId ?? null,
      forClientName: board.forClientName ?? null,
      cachedAt,
    };
  }).sort((left, right) => left.position - right.position);
}

export function readOfflineBootstrap(): OfflineBootstrapRecord {
  const storage = getStorage();
  if (!storage) {
    return createDefaultBootstrap();
  }

  const raw = storage.getItem(OFFLINE_BOOTSTRAP_STORAGE_KEY);
  if (!raw) {
    return createDefaultBootstrap();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isBootstrapRecord(parsed)) {
      return createDefaultBootstrap();
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse offline bootstrap:', error);
    return createDefaultBootstrap();
  }
}

export function writeOfflineBootstrap(partial: Partial<OfflineBootstrapRecord>): OfflineBootstrapRecord {
  const storage = getStorage();
  const nextValue = createDefaultBootstrap({
    ...readOfflineBootstrap(),
    ...partial,
  });

  if (!storage) {
    return nextValue;
  }

  storage.setItem(OFFLINE_BOOTSTRAP_STORAGE_KEY, JSON.stringify(nextValue));
  return nextValue;
}

export function clearOfflineBootstrap() {
  const storage = getStorage();
  storage?.removeItem(OFFLINE_BOOTSTRAP_STORAGE_KEY);
}

export function deriveOfflineBootMode(input: {
  isOnline: boolean;
  bootstrap?: OfflineBootstrapRecord | null;
}): OfflineBootMode {
  if (input.isOnline) {
    return 'online';
  }

  const bootstrap = input.bootstrap ?? readOfflineBootstrap();
  if (bootstrap.boardCount > 0 && bootstrap.lastKnownUserId) {
    return 'offline-ready';
  }

  return 'offline-text-only';
}

export async function cacheBoardsForUser(input: {
  userId: string;
  boards: CacheablePhraseBoard[];
  selectedBoardId?: string | null;
}) {
  const cachedAt = Date.now();
  const documents = normalizeBoardDocuments(input.userId, input.boards, cachedAt);
  const db = await getDb();
  const transaction = db.transaction(BOARD_STORE, 'readwrite');
  const store = transaction.objectStore(BOARD_STORE);
  const index = store.index('byUserId');
  const existingKeys = await index.getAllKeys(input.userId);

  await Promise.all(existingKeys.map((key) => store.delete(key)));
  await Promise.all(documents.map((document) => store.put(document)));
  await transaction.done;

  writeOfflineBootstrap({
    mode: documents.length > 0 ? 'offline-ready' : 'text-only',
    boardCount: documents.length,
    lastSyncAt: cachedAt,
    lastKnownUserId: input.userId,
    selectedBoardId: input.selectedBoardId ?? null,
    syncStatus: 'ready',
  });
}

export async function readCachedBoardsForUser(userId: string): Promise<OfflineBoardDocument[]> {
  const db = await getDb();
  return db.getAllFromIndex(BOARD_STORE, 'byUserId', userId);
}

export async function readLastCachedBoards(): Promise<OfflineBoardDocument[]> {
  const bootstrap = readOfflineBootstrap();
  if (!bootstrap.lastKnownUserId) {
    return [];
  }

  return readCachedBoardsForUser(bootstrap.lastKnownUserId);
}

export async function clearOfflineCacheForUser(userId?: string | null) {
  const resolvedUserId = userId ?? readOfflineBootstrap().lastKnownUserId;
  if (!resolvedUserId) {
    clearOfflineBootstrap();
    return;
  }

  const db = await getDb();
  const transaction = db.transaction(BOARD_STORE, 'readwrite');
  const store = transaction.objectStore(BOARD_STORE);
  const keys = await store.index('byUserId').getAllKeys(resolvedUserId);
  await Promise.all(keys.map((key) => store.delete(key)));
  await transaction.done;

  const bootstrap = readOfflineBootstrap();
  if (bootstrap.lastKnownUserId === resolvedUserId) {
    clearOfflineBootstrap();
  }
}

export function updateOfflineSelectedBoard(selectedBoardId: string | null) {
  writeOfflineBootstrap({
    selectedBoardId,
  });
}

export function updateOfflineSyncStatus(
  syncStatus: OfflineSyncStatus,
  partial: Partial<OfflineBootstrapRecord> = {}
) {
  writeOfflineBootstrap({
    ...partial,
    syncStatus,
  });
}
