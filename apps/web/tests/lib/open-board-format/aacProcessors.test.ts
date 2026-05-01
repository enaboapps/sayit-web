import {
  normalizeAacProcessorsTree,
  normalizeAacProcessorsUpload,
} from '@/lib/open-board-format/aacProcessors';
import {
  MAX_OPEN_BOARD_FILE_BYTES,
  MAX_OPEN_BOARD_FILE_MB,
} from '@/lib/open-board-format/types';
import { OpenBoardFormatError } from '@/lib/open-board-format/validation';

describe('AAC upload size guard', () => {
  it('rejects files larger than the import limit before parsing', async () => {
    // Construct a File whose `size` exceeds the cap without actually allocating
    // that many bytes — the guard checks `file.size`, never reads it.
    const overLimit = new File(['stub'], 'huge.obz', { type: 'application/zip' });
    Object.defineProperty(overLimit, 'size', { value: MAX_OPEN_BOARD_FILE_BYTES + 1 });

    await expect(normalizeAacProcessorsUpload(overLimit)).rejects.toBeInstanceOf(OpenBoardFormatError);
    await expect(normalizeAacProcessorsUpload(overLimit)).rejects.toThrow(
      `File is larger than the ${MAX_OPEN_BOARD_FILE_MB} MB import limit.`
    );
  });
});

describe('AACProcessors normalization', () => {
  it('rewrites .obz path-based navigation targets back to the destination page id', () => {
    // Mirrors the AACTree the willwade library produces for an .obz: each
    // navigation button stores the ZIP entry path on `targetPageId`, while
    // `tree.metadata._obfPagePaths` carries the pageId -> entryPath map so
    // we can resolve the link back to the destination page id.
    const normalized = normalizeAacProcessorsTree({
      metadata: {
        _obfPagePaths: {
          root_board: 'boards/root_board.obf',
          food_board: 'boards/food_board.obf',
        },
      },
      pages: {
        root_board: {
          id: 'root_board',
          name: 'Home',
          grid: [
            [
              {
                id: 'b_food',
                label: 'Food',
                targetPageId: 'boards/food_board.obf',
              },
            ],
          ],
        },
        food_board: {
          id: 'food_board',
          name: 'Food',
          grid: [[{ id: 'b_apple', label: 'apple', message: 'apple' }]],
        },
      },
    });

    const rootBoard = normalized.boards.find((board) => board.sourceId === 'root_board');
    expect(rootBoard?.tiles).toEqual([
      {
        kind: 'navigate',
        label: 'Food',
        position: 0,
        cellRow: 0,
        cellColumn: 0,
        targetSourceId: 'food_board',
        sourceButtonId: 'b_food',
      },
    ]);
  });

  it('converts generic AAC tree pages to fixed-grid import boards', () => {
    const normalized = normalizeAacProcessorsTree({
      pages: {
        root: {
          id: 'root',
          name: 'Home',
          grid: [
            [
              { id: 'want', label: 'want', message: 'want' },
              { id: 'food_nav', label: 'Food', targetPageId: 'food' },
            ],
          ],
        },
        food: {
          id: 'food',
          name: 'Food',
          grid: [[{ id: 'apple', label: 'apple', message: 'apple' }]],
        },
      },
    });

    expect(normalized.boards).toEqual([
      {
        sourceId: 'root',
        name: 'Home',
        gridRows: 1,
        gridColumns: 2,
        tiles: [
          {
            kind: 'phrase',
            text: 'want',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            symbolBlob: undefined,
            sourceButtonId: 'want',
          },
          {
            kind: 'navigate',
            label: 'Food',
            position: 1,
            cellRow: 0,
            cellColumn: 1,
            targetSourceId: 'food',
            sourceButtonId: 'food_nav',
          },
        ],
      },
      {
        sourceId: 'food',
        name: 'Food',
        gridRows: 1,
        gridColumns: 1,
        tiles: [
          {
            kind: 'phrase',
            text: 'apple',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            symbolBlob: undefined,
            sourceButtonId: 'apple',
          },
        ],
      },
    ]);
  });

  it('skips hidden, empty, and disabled buttons', () => {
    // OBF supports a `visibility` property; the willwade library mirrors that
    // onto AACButton.visibility. Anything other than 'Visible' must be left
    // out of the imported board so the destination grid doesn't ship invisible
    // dead cells. Each row tests one of the values our isHidden() filter checks.
    const normalized = normalizeAacProcessorsTree({
      pages: {
        root: {
          id: 'root',
          name: 'Home',
          grid: [
            [
              { id: 'visible', label: 'visible', message: 'visible' },
              { id: 'hidden', label: 'hidden', message: 'hidden', visibility: 'Hidden' },
              { id: 'empty', label: 'empty', message: 'empty', visibility: 'Empty' },
              { id: 'disabled', label: 'disabled', message: 'disabled', visibility: 'Disabled' },
            ],
          ],
        },
      },
    });

    const board = normalized.boards[0];
    expect(board.tiles.map((tile) => tile.sourceButtonId)).toEqual(['visible']);
  });

  it('produces an empty tile list for a board whose grid has no buttons', () => {
    // Real-world .obz files sometimes carry placeholder pages with empty grids
    // (e.g. an unfinished category). Importing should yield a 1x1 board (the
    // gridRows/gridColumns floor) with zero tiles, not crash and not pollute
    // warnings. The Math.max(1, ...) defaults are what guarantee 1x1.
    const normalized = normalizeAacProcessorsTree({
      pages: {
        empty: { id: 'empty', name: 'Empty', grid: [] },
      },
    });

    expect(normalized.boards).toEqual([
      {
        sourceId: 'empty',
        name: 'Empty',
        gridRows: 1,
        gridColumns: 1,
        tiles: [],
      },
    ]);
    expect(normalized.warnings).toEqual([]);
  });

  it('warns when a navigation tile points at a path not in the upload', () => {
    // The willwade library may emit a `targetPageId` that's a manifest path
    // (e.g. "boards/external.obf") for which no corresponding page exists in
    // tree.pages — typically because the source .obz referenced a sibling
    // file that wasn't bundled. Without the warning, openBoardImport silently
    // drops these tiles and users never learn why a link disappeared.
    const normalized = normalizeAacProcessorsTree({
      metadata: { _obfPagePaths: { root: 'boards/root.obf' } },
      pages: {
        root: {
          id: 'root',
          name: 'Home',
          grid: [
            [
              {
                id: 'broken_nav',
                label: 'External',
                targetPageId: 'boards/external.obf',
              },
            ],
          ],
        },
      },
    });

    expect(normalized.boards[0].tiles).toEqual([]);
    expect(normalized.warnings).toEqual([
      'Home: dropped navigation tile "External" — target "boards/external.obf" is not in this upload.',
    ]);
  });

  it('warns and keeps the first mapping when two pageIds claim the same manifest path', () => {
    // A malformed manifest can list the same `entryPath` for multiple page ids.
    // We can't tell which is correct, so keep the first and warn — silently
    // overwriting would route every link to the wrong destination.
    const normalized = normalizeAacProcessorsTree({
      metadata: {
        _obfPagePaths: {
          first: 'boards/dup.obf',
          second: 'boards/dup.obf',
        },
      },
      pages: {
        first: { id: 'first', name: 'First', grid: [[{ id: 'b', label: 'b', message: 'b' }]] },
        second: { id: 'second', name: 'Second', grid: [[{ id: 'c', label: 'c', message: 'c' }]] },
      },
    });

    expect(normalized.warnings).toEqual([
      'Manifest path "boards/dup.obf" maps to multiple boards (first, second); navigation links to "second" will resolve to "first".',
    ]);
    // Both pages should still produce boards — the warning is informational,
    // not a parse error.
    expect(normalized.boards.map((b) => b.sourceId).sort()).toEqual(['first', 'second']);
  });

  it('warns when a button has recorded audio attached', () => {
    // OBF buttons can carry sound_id; the willwade library exposes that as
    // `audioRecording`. We don't import these as native audio tiles today —
    // the warning lets users know the audio data is dropped on import so
    // they aren't surprised by silent buttons.
    const normalized = normalizeAacProcessorsTree({
      pages: {
        root: {
          id: 'root',
          name: 'Sounds',
          grid: [
            [
              {
                id: 'with_audio',
                label: 'hello',
                message: 'hello',
                audioRecording: { id: 1 },
              },
            ],
          ],
        },
      },
    });

    // The phrase tile is still imported (just without audio).
    expect(normalized.boards[0].tiles).toHaveLength(1);
    expect(normalized.warnings).toEqual([
      'Sounds: dropped audio for "hello" — recorded sounds are not imported.',
    ]);
  });

  it('warns and skips the tile when a button image is a malformed data URI', () => {
    // The willwade library returns inline images as data URIs on
    // button.image / button.resolvedImageEntry. A malformed URI shouldn't
    // crash the import — the tile is kept (sans symbol) and a warning is
    // pushed for the user.
    const normalized = normalizeAacProcessorsTree({
      pages: {
        root: {
          id: 'root',
          name: 'Home',
          grid: [
            [
              {
                id: 'bad_img',
                label: 'broken',
                message: 'broken',
                image: 'data:not-a-valid-uri',
              },
            ],
          ],
        },
      },
    });

    const tile = normalized.boards[0].tiles[0];
    expect(tile.kind).toBe('phrase');
    if (tile.kind !== 'phrase') throw new Error('expected phrase tile');
    expect(tile.symbolBlob).toBeUndefined();
    expect(normalized.warnings).toEqual([
      'Home: could not decode image for "broken".',
    ]);
  });
});
