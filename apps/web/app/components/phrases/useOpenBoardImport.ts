'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  canUseAacProcessorsForFile,
  normalizeAacProcessorsUpload,
} from '@/lib/open-board-format/aacProcessors';
import { OpenBoardFormatError } from '@/lib/open-board-format/validation';
import type {
  NormalizedOpenBoardImport,
  NormalizedOpenBoardTile,
} from '@/lib/open-board-format/types';

export type ConvexImportBoard = {
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

export type StagedSymbolUpload = {
  uploadSessionId: Id<'stagedSymbolUploads'>;
  storageId: Id<'_storage'>;
};

export type ImportStage =
  | { kind: 'idle' }
  | { kind: 'uploading'; uploaded: number; total: number }
  | { kind: 'saving' };

export type UploadJob = {
  boardIndex: number;
  tileIndex: number;
  blob: Blob;
};

type UseOpenBoardImportOptions = {
  onClose: () => void;
  onImported: (boardIds: string[]) => void;
};

// How many symbol uploads to keep in flight at once. Real-world AAC packages
// can carry 1300+ images; 6 saturates uplink without overwhelming Convex.
const SYMBOL_UPLOAD_CONCURRENCY = 6;

// Sentinel thrown when the user cancels a running import. Cleanup still runs,
// but the UI should not show a user-visible error for deliberate cancel.
export class ImportCancelledError extends Error {
  constructor() {
    super('Import cancelled');
    this.name = 'ImportCancelledError';
  }
}

export function getOpenBoardPackageName(
  preview: NormalizedOpenBoardImport,
  selectedFileName?: string
) {
  return preview.boards[0]?.name?.trim() || selectedFileName || 'Imported AAC vocabulary';
}

export function collectOpenBoardSymbolUploadJobs(
  preview: NormalizedOpenBoardImport
): UploadJob[] {
  const uploadJobs: UploadJob[] = [];

  preview.boards.forEach((board, boardIndex) => {
    board.tiles.forEach((tile, tileIndex) => {
      if (tile.kind === 'phrase' && tile.symbolBlob) {
        uploadJobs.push({ boardIndex, tileIndex, blob: tile.symbolBlob });
      }
    });
  });

  return uploadJobs;
}

export function buildOpenBoardTilePayload(
  tile: NormalizedOpenBoardTile,
  symbolStorageId: Id<'_storage'> | undefined
): ConvexImportBoard['tiles'][number] {
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
}

export function buildOpenBoardImportPayload(
  preview: NormalizedOpenBoardImport,
  uploadJobs: UploadJob[],
  symbolUploads: StagedSymbolUpload[]
): ConvexImportBoard[] {
  const symbolByKey = new Map<string, Id<'_storage'>>();

  uploadJobs.forEach((job, index) => {
    symbolByKey.set(`${job.boardIndex}:${job.tileIndex}`, symbolUploads[index].storageId);
  });

  return preview.boards.map((board, boardIndex) => ({
    sourceId: board.sourceId,
    name: board.name,
    gridRows: board.gridRows,
    gridColumns: board.gridColumns,
    tiles: board.tiles.map((tile, tileIndex) => buildOpenBoardTilePayload(
      tile,
      symbolByKey.get(`${boardIndex}:${tileIndex}`)
    )),
  }));
}

export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress: (completed: number) => void,
  signal: AbortSignal
): Promise<R[]> {
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
}

export function useOpenBoardImport({
  onClose,
  onImported,
}: UseOpenBoardImportOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<NormalizedOpenBoardImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importStage, setImportStage] = useState<ImportStage>({ kind: 'idle' });
  const isImporting = importStage.kind !== 'idle';

  const abortRef = useRef<AbortController | null>(null);
  const uploadedRef = useRef<StagedSymbolUpload[]>([]);

  const startImportSymbolUpload = useMutation(api.symbols.startImportSymbolUpload);
  const registerImportSymbolUpload = useMutation(api.symbols.registerImportSymbolUpload);
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

  const cleanupOrphans = async () => {
    const ids = uploadedRef.current;
    uploadedRef.current = [];
    if (ids.length === 0) return;

    try {
      await cleanupOrphanSymbols({ uploads: ids });
    } catch {
      // Best-effort cleanup. A network failure means the server-side orphan
      // sweep has to catch it later; the user cannot recover this locally.
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    reset();
    onClose();
  };

  const handleCancel = async () => {
    if (importStage.kind === 'uploading') {
      abortRef.current?.abort();
      setImportStage({ kind: 'idle' });
      void cleanupOrphans();
      return;
    }

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
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
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

  const uploadSymbol = async (blob: Blob, signal: AbortSignal): Promise<StagedSymbolUpload> => {
    if (signal.aborted) throw new ImportCancelledError();
    const { uploadUrl, uploadSessionId } = await startImportSymbolUpload();
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
    await registerImportSymbolUpload({ uploadSessionId, storageId: payload.storageId });
    return { uploadSessionId, storageId: payload.storageId };
  };

  const handleImport = async () => {
    if (!preview || isImporting) return;
    setError(null);

    const uploadJobs = collectOpenBoardSymbolUploadJobs(preview);
    const controller = new AbortController();
    abortRef.current = controller;
    uploadedRef.current = [];

    setImportStage({ kind: 'uploading', uploaded: 0, total: uploadJobs.length });

    try {
      const symbolUploads = uploadJobs.length === 0
        ? []
        : await runWithConcurrency(
          uploadJobs,
          SYMBOL_UPLOAD_CONCURRENCY,
          async (job) => {
            const upload = await uploadSymbol(job.blob, controller.signal);
            uploadedRef.current.push(upload);
            return upload;
          },
          (uploaded) => setImportStage({ kind: 'uploading', uploaded, total: uploadJobs.length }),
          controller.signal
        );

      setImportStage({ kind: 'saving' });
      const boards = buildOpenBoardImportPayload(preview, uploadJobs, symbolUploads);
      const packageName = getOpenBoardPackageName(preview, selectedFile?.name);
      const result = await importBoards({ packageName, boards });

      uploadedRef.current = [];
      onImported(result.importedBoardIds.map(String));
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ImportCancelledError || (err instanceof Error && err.name === 'AbortError')) {
        await cleanupOrphans();
        setImportStage({ kind: 'idle' });
        return;
      }

      await cleanupOrphans();
      setError(err instanceof Error ? err.message : 'Could not import this Open Board file.');
      setImportStage({ kind: 'idle' });
    }
  };

  return {
    selectedFile,
    preview,
    error,
    isParsing,
    importStage,
    isImporting,
    tileCount,
    handleCancel,
    handleClose,
    handleFileChange,
    handleImport,
  };
}
