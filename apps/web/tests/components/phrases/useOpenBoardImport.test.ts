import type { Id } from '@/convex/_generated/dataModel';
import type { NormalizedOpenBoardImport } from '@/lib/open-board-format/types';
import {
  buildOpenBoardImportPayload,
  collectOpenBoardSymbolUploadJobs,
  getOpenBoardPackageName,
  ImportCancelledError,
  runWithConcurrency,
  type StagedSymbolUpload,
} from '@/app/components/phrases/useOpenBoardImport';

describe('useOpenBoardImport helpers', () => {
  const symbolBlob = new Blob(['symbol'], { type: 'image/png' });

  const preview: NormalizedOpenBoardImport = {
    warnings: [],
    boards: [
      {
        sourceId: 'root',
        name: 'Root Board',
        gridRows: 2,
        gridColumns: 2,
        tiles: [
          {
            kind: 'phrase',
            text: 'Hello',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            sourceButtonId: 'hello',
            symbolBlob,
          },
          {
            kind: 'navigate',
            label: 'Food',
            position: 1,
            cellRow: 0,
            cellColumn: 1,
            targetSourceId: 'food',
            sourceButtonId: 'food-link',
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
            text: 'Apple',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            sourceButtonId: 'apple',
          },
        ],
      },
    ],
  };

  it('derives the package name from board metadata before falling back to file name', () => {
    expect(getOpenBoardPackageName(preview, 'fallback.obz')).toBe('Root Board');
    expect(getOpenBoardPackageName({
      ...preview,
      boards: [{ ...preview.boards[0], name: '   ' }],
    }, 'fallback.obz')).toBe('fallback.obz');
    expect(getOpenBoardPackageName({
      ...preview,
      boards: [{ ...preview.boards[0], name: '   ' }],
    })).toBe('Imported AAC vocabulary');
  });

  it('collects only phrase tiles that have symbol blobs', () => {
    expect(collectOpenBoardSymbolUploadJobs(preview)).toEqual([
      { boardIndex: 0, tileIndex: 0, blob: symbolBlob },
    ]);
  });

  it('builds Convex import payloads with uploaded symbol storage IDs stitched in', () => {
    const uploads: StagedSymbolUpload[] = [
      {
        uploadSessionId: 'session-1' as Id<'stagedSymbolUploads'>,
        storageId: 'storage-1' as Id<'_storage'>,
      },
    ];

    const payload = buildOpenBoardImportPayload(
      preview,
      collectOpenBoardSymbolUploadJobs(preview),
      uploads
    );

    expect(payload).toEqual([
      {
        sourceId: 'root',
        name: 'Root Board',
        gridRows: 2,
        gridColumns: 2,
        tiles: [
          {
            kind: 'phrase',
            text: 'Hello',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            symbolStorageId: 'storage-1',
          },
          {
            kind: 'navigate',
            label: 'Food',
            position: 1,
            cellRow: 0,
            cellColumn: 1,
            targetSourceId: 'food',
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
            text: 'Apple',
            position: 0,
            cellRow: 0,
            cellColumn: 0,
            symbolStorageId: undefined,
          },
        ],
      },
    ]);
  });

  it('runs workers with a concurrency cap and reports progress in completion order', async () => {
    const controller = new AbortController();
    const progress: number[] = [];
    let active = 0;
    let maxActive = 0;

    const results = await runWithConcurrency(
      [1, 2, 3, 4],
      2,
      async (item) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 0));
        active -= 1;
        return item * 10;
      },
      (completed) => progress.push(completed),
      controller.signal
    );

    expect(results).toEqual([10, 20, 30, 40]);
    expect(maxActive).toBeLessThanOrEqual(2);
    expect(progress).toEqual([1, 2, 3, 4]);
  });

  it('stops queueing work when cancellation is requested', async () => {
    const controller = new AbortController();
    controller.abort();
    const worker = jest.fn();

    await expect(runWithConcurrency([1], 1, worker, jest.fn(), controller.signal))
      .rejects
      .toBeInstanceOf(ImportCancelledError);
    expect(worker).not.toHaveBeenCalled();
  });
});
