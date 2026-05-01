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
});
