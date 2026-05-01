'use client';

import { useMemo, useState } from 'react';
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

export default function OpenBoardImportModal({
  isOpen,
  onClose,
  onImported,
}: OpenBoardImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<NormalizedOpenBoardImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const generateUploadUrl = useMutation(api.symbols.generateUploadUrl);
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
    setIsImporting(false);
  };

  const handleClose = () => {
    if (isImporting) return;
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

  const uploadSymbol = async (blob: Blob): Promise<Id<'_storage'>> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream' },
      body: blob,
    });
    if (!result.ok) {
      throw new Error('Could not upload an imported symbol image.');
    }
    const payload = await result.json() as { storageId: Id<'_storage'> };
    return payload.storageId;
  };

  const buildTilePayload = async (tile: NormalizedOpenBoardTile): Promise<ConvexImportBoard['tiles'][number]> => {
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

    const symbolStorageId = tile.symbolBlob ? await uploadSymbol(tile.symbolBlob) : undefined;
    return {
      kind: 'phrase',
      text: tile.text,
      position: tile.position,
      cellRow: tile.cellRow,
      cellColumn: tile.cellColumn,
      symbolStorageId,
    };
  };

  const handleImport = async () => {
    if (!preview || isImporting) return;
    setError(null);
    setIsImporting(true);

    try {
      const boards: ConvexImportBoard[] = [];
      for (const board of preview.boards) {
        const tiles = [];
        for (const tile of board.tiles) {
          tiles.push(await buildTilePayload(tile));
        }
        boards.push({
          sourceId: board.sourceId,
          name: board.name,
          gridRows: board.gridRows,
          gridColumns: board.gridColumns,
          tiles,
        });
      }

      const result = await importBoards({ boards });
      onImported(result.importedBoardIds.map(String));
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import this Open Board file.');
    } finally {
      setIsImporting(false);
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
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleImport} disabled={!preview || isParsing || isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
