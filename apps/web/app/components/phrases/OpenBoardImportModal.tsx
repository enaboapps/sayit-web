'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { Button } from '@/app/components/ui/Button';
import {
  AAC_PROCESSOR_ACCEPT,
  canUseAacProcessorsForFile,
  normalizeAacProcessorsUpload,
} from '@/lib/open-board-format/aacProcessors';
import { OpenBoardFormatError } from '@/lib/open-board-format/validation';
import type { NormalizedOpenBoardImport, NormalizedOpenBoardTile } from '@/lib/open-board-format/types';

type ConvexImportBoard = {
  sourceId: string;
  name: string;
  gridRows: number;
  gridColumns: number;
  tiles: Array<
    | {
        kind: 'phrase';
        text: string;
        position: number;
        cellRow: number;
        cellColumn: number;
        symbolStorageId?: Id<'_storage'>;
      }
    | {
        kind: 'navigate';
        label: string;
        position: number;
        cellRow: number;
        cellColumn: number;
        targetSourceId: string;
      }
  >;
};

interface OpenBoardImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (boardIds: string[]) => void;
}

// How many symbol uploads to keep in flight at once. Real-world AAC packages
// (e.g. CommuniKate-20) can carry 1300+ embedded images; sequential uploads
// at ~150-500ms each turn into multi-minute hangs. 6 matches the conventional
// browser per-origin connection ceiling — enough to saturate uplink without
// overwhelming Convex's rate limiting.
const SYMBOL_UPLOAD_CONCURRENCY = 6;

// Sentinel thrown when the user cancels a running import. Keeps the catch
// path small: cleanup runs unconditionally, but we don't want to surface a
// user-visible error message for a deliberate cancel.
class ImportCancelledError extends Error {
  constructor() {
    super('Import cancelled');
    this.name = 'ImportCancelledError';
  }
}

type ImportStage =
  | { kind: 'idle' }
  | { kind: 'uploading'; uploaded: number; total: number }
  | { kind: 'saving' };

export default function OpenBoardImportModal({
  isOpen,
  onClose,
  onImported,
}: OpenBoardImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<NormalizedOpenBoardImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importStage, setImportStage] = useState<ImportStage>({ kind: 'idle' });
  const isImporting = importStage.kind !== 'idle';

  // Mutable refs that survive across the async import: the AbortController
  // backing in-flight uploads, and the running list of storage IDs we've
  // successfully created. Both feed the cancel/error cleanup path so we
  // never leak storage objects when the import doesn't reach the final
  // `importBoards` mutation.
  const abortRef = useRef<AbortController | null>(null);
  const uploadedRef = useRef<Id<'_storage'>[]>([]);

  const generateUploadUrl = useMutation(api.symbols.generateUploadUrl);
  const cleanupOrphanSymbols = useMutation(api.symbols.cleanupOrphanSymbols);
  const importBoards = useMutation(api.openBoardImport.importBoards);

  const tileCount = useMemo(
    () => preview?.boards.reduce((total, board) => total + board.tiles.length, 0) ?? 0,
    [preview]
  );

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setIsParsing(false);
    setImportStage({ kind: 'idle' });
    abortRef.current = null;
    uploadedRef.current = [];
  };

  // Best-effort: if we've uploaded anything since the last reset, ask the
  // server to delete those storage objects. Fire-and-forget — a network
  // failure here just means the orphans live on, but we've already done what
  // we can for the user.
  const cleanupOrphans = async () => {
    const ids = uploadedRef.current;
    uploadedRef.current = [];
    if (ids.length === 0) return;
    try {
      await cleanupOrphanSymbols({ storageIds: ids });
    } catch {
      // Swallow — if cleanup fails we don't have a sensible recovery path
      // and the user already has bigger fish to fry.
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    reset();
    onClose();
  };

  // Cancel button during upload: abort in-flight fetches, await them so the
  // cleanup IDs are stable, then delete the orphans on the server.
  const handleCancel = async () => {
    if (importStage.kind === 'uploading') {
      abortRef.current?.abort();
      // The runWithConcurrency loop will throw ImportCancelledError on the
      // next iteration; handleImport's catch runs cleanup. Reset is
      // optimistic so the UI stops showing "Uploading X of Y..." right away.
      setImportStage({ kind: 'idle' });
      // Schedule cleanup in case the abort beat us to the catch handler
      // (rare but possible if abort fires between iterations).
      void cleanupOrphans();
      return;
    }
    // Idle / parsing / saving — no in-flight uploads to abort, plain close.
    reset();
    onClose();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setError(null);
    if (!file) return;

    setIsParsing(true);
    // Force a paint so "Reading <filename>..." appears before the synchronous
    // ZIP/JSON parsing chunk locks the main thread. setState alone schedules
    // a render but the next macrotask runs `loadIntoTree` before the paint
    // completes; the rAF hop yields long enough for the browser to flush.
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    try {
      // All AAC formats (.obf, .obz, .dot, .opml) flow through a single
      // adapter backed by @willwade/aac-processors' browser bundle.
      if (!canUseAacProcessorsForFile(file.name)) {
        throw new OpenBoardFormatError('Choose a supported AAC board file.');
      }
      setPreview(await normalizeAacProcessorsUpload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this AAC board file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Single symbol upload. Threads the AbortSignal so handleCancel can yank
  // every in-flight fetch when the user clicks Cancel.
  const uploadSymbol = async (blob: Blob, signal: AbortSignal): Promise<Id<'_storage'>> => {
    if (signal.aborted) throw new ImportCancelledError();
    const uploadUrl = await generateUploadUrl();
    if (signal.aborted) throw new ImportCancelledError();
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream' },
      body: blob,
      signal,
    });
    if (!result.ok) {
      throw new Error('Could not upload an imported symbol image.');
    }
    const payload = await result.json() as { storageId: Id<'_storage'> };
    return payload.storageId;
  };

  // Pure shape transform — uploads happen in handleImport's parallel pass and
  // the resolved storage id is plumbed back in here. Keeping this sync makes
  // the per-board map() call obvious and predictable.
  const buildTilePayload = (
    tile: NormalizedOpenBoardTile,
    symbolStorageId: Id<'_storage'> | undefined
  ): ConvexImportBoard['tiles'][number] => {
    if (tile.kind === 'navigate') {
      return {
        kind: 'navigate',
        label: tile.label,
        position: tile.position,
        cellRow: tile.cellRow,
        cellColumn: tile.cellColumn,
        targetSourceId: tile.targetSourceId,
      };
    }
    return {
      kind: 'phrase',
      text: tile.text,
      position: tile.position,
      cellRow: tile.cellRow,
      cellColumn: tile.cellColumn,
      symbolStorageId,
    };
  };

  // Run an async worker over `items` with at most `concurrency` in flight.
  // We call setProgress after each completion so the modal can show
  // "Uploading 543 of 1379..." live instead of staring at a spinner for
  // multiple minutes. The signal short-circuits the queue so a Cancel click
  // doesn't keep firing fetches after the user has bailed.
  const runWithConcurrency = async <T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>,
    onProgress: (completed: number) => void,
    signal: AbortSignal
  ): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let cursor = 0;
    let completed = 0;

    const runOne = async () => {
      while (true) {
        if (signal.aborted) throw new ImportCancelledError();
        const index = cursor;
        cursor += 1;
        if (index >= items.length) return;
        results[index] = await worker(items[index], index);
        completed += 1;
        onProgress(completed);
      }
    };

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, runOne);
    await Promise.all(runners);
    return results;
  };

  const handleImport = async () => {
    if (!preview || isImporting) return;
    setError(null);

    // Walk the preview once to (a) collect every blob that needs uploading
    // (with a back-reference for stitching results onto the right tile) and
    // (b) record per-tile metadata so we can rebuild the import payload
    // after uploads finish. Doing the walk up-front lets us show an accurate
    // "X of Y" progress count.
    type UploadJob = { boardIndex: number; tileIndex: number; blob: Blob };
    const uploadJobs: UploadJob[] = [];
    preview.boards.forEach((board, boardIndex) => {
      board.tiles.forEach((tile, tileIndex) => {
        if (tile.kind === 'phrase' && tile.symbolBlob) {
          uploadJobs.push({ boardIndex, tileIndex, blob: tile.symbolBlob });
        }
      });
    });

    // Fresh abort controller + uploaded list per attempt — handleCancel and
    // the catch handler both consult these refs.
    const controller = new AbortController();
    abortRef.current = controller;
    uploadedRef.current = [];

    setImportStage({ kind: 'uploading', uploaded: 0, total: uploadJobs.length });

    try {
      const symbolIds = uploadJobs.length === 0
        ? []
        : await runWithConcurrency(
          uploadJobs,
          SYMBOL_UPLOAD_CONCURRENCY,
          async (job) => {
            const id = await uploadSymbol(job.blob, controller.signal);
            // Track as we go (not after Promise.all settles) so a cancel
            // mid-batch still picks up the in-flight successes for cleanup.
            uploadedRef.current.push(id);
            return id;
          },
          (uploaded) => setImportStage({ kind: 'uploading', uploaded, total: uploadJobs.length }),
          controller.signal
        );

      // Stitch storageIds back onto the tile payloads.
      const symbolByKey = new Map<string, Id<'_storage'>>();
      uploadJobs.forEach((job, index) => {
        symbolByKey.set(`${job.boardIndex}:${job.tileIndex}`, symbolIds[index]);
      });

      setImportStage({ kind: 'saving' });
      const boards: ConvexImportBoard[] = preview.boards.map((board, boardIndex) => ({
        sourceId: board.sourceId,
        name: board.name,
        gridRows: board.gridRows,
        gridColumns: board.gridColumns,
        tiles: board.tiles.map((tile, tileIndex) => buildTilePayload(
          tile,
          symbolByKey.get(`${boardIndex}:${tileIndex}`)
        )),
      }));

      // Package name shown in Settings → Imported AAC vocabularies. Prefer
      // the OBF root board name (CommuniKate's first board is "CommuniKate
      // Top Page"); fall back to the filename so users can identify the
      // upload regardless of OBF metadata quality.
      const packageName = preview.boards[0]?.name?.trim() || selectedFile?.name || 'Imported AAC vocabulary';

      const result = await importBoards({ packageName, boards });
      // Boards are now persisted — the storage IDs are referenced by phrase
      // rows and must NOT be cleaned up. Clear the ref before reset() runs.
      uploadedRef.current = [];
      onImported(result.importedBoardIds.map(String));
      reset();
      onClose();
    } catch (err) {
      // Cancel: cleanup runs, no error message shown.
      if (err instanceof ImportCancelledError || (err instanceof Error && err.name === 'AbortError')) {
        await cleanupOrphans();
        setImportStage({ kind: 'idle' });
        return;
      }
      // Real failure (server error, network drop, conflict): clean up the
      // partial uploads, surface the message, leave the modal open so the
      // user can read the error and adjust.
      await cleanupOrphans();
      setError(err instanceof Error ? err.message : 'Could not import this Open Board file.');
      setImportStage({ kind: 'idle' });
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Open Board"
      snapPoints={[70]}
      showHandle
      showCloseButton
    >
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Open Board file</span>
          <input
            type="file"
            accept={`.obf,.obz,application/json,application/zip,${AAC_PROCESSOR_ACCEPT}`}
            onChange={handleFileChange}
            disabled={isImporting}
            className="block w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </label>

        {isParsing && (
          <p className="text-sm text-text-secondary">Reading {selectedFile?.name ?? 'file'}...</p>
        )}

        {importStage.kind === 'uploading' && (
          <div className="space-y-1">
            <p className="text-sm text-text-secondary">
              Uploading symbols ({importStage.uploaded} of {importStage.total})...
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full bg-primary-500 transition-[width] duration-150"
                style={{
                  width: importStage.total === 0
                    ? '100%'
                    : `${Math.round((importStage.uploaded / importStage.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {importStage.kind === 'saving' && (
          <p className="text-sm text-text-secondary">Saving boards...</p>
        )}

        {preview && (
          <div className="rounded-xl border border-border bg-surface-hover p-3 text-sm text-foreground">
            <div className="font-medium">
              {preview.boards.length} board{preview.boards.length === 1 ? '' : 's'} · {tileCount} tile{tileCount === 1 ? '' : 's'}
            </div>
            <div className="mt-2 max-h-28 overflow-auto text-text-secondary">
              {preview.boards.map((board) => (
                <div key={board.sourceId}>
                  {board.name} ({board.gridRows}x{board.gridColumns})
                </div>
              ))}
            </div>
          </div>
        )}

        {preview && preview.warnings.length > 0 && (
          <div className="max-h-32 overflow-auto rounded-xl border border-yellow-700/40 bg-yellow-900/20 p-3 text-sm text-yellow-200">
            {preview.warnings.map((warning, index) => (
              <div key={`${warning}-${index}`}>{warning}</div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {/* Cancel stays interactive during upload so the user can bail out
              of a long import. Disabled only during the (very fast) saving
              tick, where aborting mid-mutation would just confuse things. */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={importStage.kind === 'saving'}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleImport} disabled={!preview || isParsing || isImporting}>
            {importStage.kind === 'uploading'
              ? `Uploading ${importStage.uploaded}/${importStage.total}`
              : importStage.kind === 'saving'
                ? 'Saving...'
                : 'Import'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
