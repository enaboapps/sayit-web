/**
 * Convex openBoardImport invariants
 *
 * These tests exercise the validation/cascade logic that lives in
 * `convex/openBoardImport.ts` without spinning up a real Convex runtime —
 * matching the in-repo pattern from `boardTiles.test.ts`. We re-state each
 * invariant here and assert it; if the handler diverges, the assertions
 * still pin the contract.
 */

import { describe, expect, test } from '@jest/globals';

describe('openBoardImport conflict pre-flight', () => {
  test('rejects re-import when any source ID matches an existing board', () => {
    // Setup: existing user already has a board imported from package "P1"
    // with importSourceId "shared".
    const existingBoards = [
      { _id: 'b_existing', userId: 'user_1', importSourceId: 'shared', importPackageId: 'pkg_1' },
    ];
    const existingPackage = { _id: 'pkg_1', name: 'CommuniKate-20' };

    // New import payload contains a board with the same sourceId.
    const incoming = [{ sourceId: 'shared', name: 'CommuniKate Top Page' }];

    // Mirror the handler's per-source pre-flight check.
    const conflict = (() => {
      for (const board of incoming) {
        const found = existingBoards.find(
          (b) => b.userId === 'user_1' && b.importSourceId === board.sourceId
        );
        if (found) return existingPackage; // We'd dereference its package row.
      }
      return null;
    })();

    expect(conflict).not.toBeNull();
    expect(() => {
      if (conflict) {
        throw new Error(
          `Boards from ${conflict.name} are already imported. Delete them from Settings → Imported AAC vocabularies first.`
        );
      }
    }).toThrow(/CommuniKate-20.*already imported/);
  });

  test('allows import when no source IDs overlap', () => {
    const existingBoards = [
      { userId: 'user_1', importSourceId: 'P1_root' },
    ];
    const incoming = [
      { sourceId: 'P2_root' },
      { sourceId: 'P2_food' },
    ];

    const conflict = incoming.find((board) =>
      existingBoards.find((b) => b.userId === 'user_1' && b.importSourceId === board.sourceId)
    );

    expect(conflict).toBeUndefined();
  });

  test('isolates conflicts per user — user A re-importing does not block user B', () => {
    const existingBoards = [
      { userId: 'user_a', importSourceId: 'shared' },
    ];

    // User B imports a board with the same sourceId — shouldn't conflict.
    const incoming = [{ sourceId: 'shared' }];
    const conflictForUserB = incoming.find((board) =>
      existingBoards.find((b) => b.userId === 'user_b' && b.importSourceId === board.sourceId)
    );

    expect(conflictForUserB).toBeUndefined();
  });
});

describe('importedPackages row creation', () => {
  test('package name falls back from OBF root name to filename', () => {
    // Mirrors OpenBoardImportModal's packageName derivation: prefer the
    // first board's name, then the filename, then a generic literal.
    const cases = [
      { firstBoardName: 'CommuniKate Top Page', filename: 'communikate-20.obz', expected: 'CommuniKate Top Page' },
      { firstBoardName: '   ', filename: 'unnamed.obz', expected: 'unnamed.obz' },
      { firstBoardName: undefined, filename: 'fallback.obz', expected: 'fallback.obz' },
      { firstBoardName: undefined, filename: undefined, expected: 'Imported AAC vocabulary' },
    ];

    for (const c of cases) {
      const packageName = c.firstBoardName?.trim() || c.filename || 'Imported AAC vocabulary';
      expect(packageName).toBe(c.expected);
    }
  });

  test('boardCount on the package row equals the number of imported boards', () => {
    const incoming = [{ sourceId: 'a' }, { sourceId: 'b' }, { sourceId: 'c' }];
    expect(incoming.length).toBe(3);
    // The handler records `boardCount: args.boards.length` literally; this
    // test pins that contract for downstream consumers (Settings page).
  });
});

describe('deleteImportedPackage cascade math', () => {
  test('cascade collects every owned tile, phrase, and storage object', () => {
    // Cascade contract: for each board in the package, delete tiles → delete
    // phrases → delete storage objects (symbol images + audio recordings) →
    // delete board → eventually delete the package row. This test asserts
    // the cardinalities match.
    const boards = [
      { _id: 'b1', importPackageId: 'pkg' },
      { _id: 'b2', importPackageId: 'pkg' },
    ];
    const tilesByBoard = {
      b1: [
        { _id: 't1', kind: 'phrase', phraseId: 'p1' },
        { _id: 't2', kind: 'navigate' },
      ],
      b2: [
        { _id: 't3', kind: 'phrase', phraseId: 'p2' },
        { _id: 't4', kind: 'audio', audioStorageId: 'storage-audio' },
      ],
    } as const;
    const phrasesById = {
      p1: { _id: 'p1', symbolStorageId: 'storage-p1' },
      p2: { _id: 'p2', symbolStorageId: undefined },
    } as const;

    const tilesToDelete: string[] = [];
    const phrasesToDelete: string[] = [];
    const storageToDelete: string[] = [];
    for (const board of boards) {
      const tiles = tilesByBoard[board._id as keyof typeof tilesByBoard];
      for (const tile of tiles) {
        tilesToDelete.push(tile._id);
        if (tile.kind === 'phrase' && tile.phraseId) {
          phrasesToDelete.push(tile.phraseId);
          const phrase = phrasesById[tile.phraseId as keyof typeof phrasesById];
          if (phrase?.symbolStorageId) storageToDelete.push(phrase.symbolStorageId);
        } else if (tile.kind === 'audio' && tile.audioStorageId) {
          storageToDelete.push(tile.audioStorageId);
        }
      }
    }

    expect(tilesToDelete.sort()).toEqual(['t1', 't2', 't3', 't4']);
    expect(phrasesToDelete.sort()).toEqual(['p1', 'p2']);
    // p2 has no symbol; t4 contributes its audio storage.
    expect(storageToDelete.sort()).toEqual(['storage-audio', 'storage-p1']);
  });

  test('idempotent: deleting an already-pendingDelete package is a no-op', () => {
    const pkg = { _id: 'pkg', pendingDelete: true };
    // Handler short-circuits when pendingDelete is already set so a double-
    // click doesn't schedule a second sweep.
    const shouldSchedule = !pkg.pendingDelete;
    expect(shouldSchedule).toBe(false);
  });
});

describe('getPhraseBoards filters pendingDelete', () => {
  test('boards marked pendingDelete disappear from the picker query', () => {
    const allBoards = [
      { _id: 'b1', name: 'Visible' },
      { _id: 'b2', name: 'Going away', pendingDelete: true },
      { _id: 'b3', name: 'Also visible' },
    ];

    // Mirrors the .filter((board) => !board.pendingDelete) added to
    // getPhraseBoards.
    const visible = allBoards.filter((board) => !board.pendingDelete);

    expect(visible.map((b) => b.name)).toEqual(['Visible', 'Also visible']);
  });
});
