'use client';

import { useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { Button } from '@/app/components/ui/Button';
import { localOpenBoardAdapter } from '@/lib/open-board-format/localAdapter';
import type { NormalizedOpenBoardImport } from '@/lib/open-board-format/types';

interface OpenBoardImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (boardIds: string[]) => void;
}

export default function OpenBoardImportModal({ isOpen, onClose, onImported }: OpenBoardImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [normalized, setNormalized] = useState<NormalizedOpenBoardImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const generateUploadUrl = useMutation(api.symbols.generateUploadUrl);
  const importBoards = useMutation(api.openBoardImport.importBoards);

  const summary = useMemo(() => {
    if (!normalized) return null;
    const phraseCount = normalized.boards.reduce((total, board) => total + board.phrases.length, 0);
    const symbolCount = normalized.boards.reduce(
      (total, board) => total + board.phrases.filter((phrase) => phrase.symbolBlob).length,
      0
    );
    return {
      boards: normalized.boards.length,
      phrases: phraseCount,
      symbols: symbolCount,
    };
  }, [normalized]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
    setNormalized(null);
    setError(null);

    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await localOpenBoardAdapter.parseUpload(file);
      setNormalized(localOpenBoardAdapter.normalize(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse Open Board file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!normalized) return;
    setError(null);
    setIsImporting(true);

    try {
      const boards = [];

      for (const board of normalized.boards) {
        const phrases = [];

        for (const phrase of board.phrases) {
          let symbolStorageId: Id<'_storage'> | undefined;

          if (phrase.symbolBlob) {
            const uploadUrl = await generateUploadUrl();
            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': phrase.symbolBlob.type || 'image/png' },
              body: phrase.symbolBlob,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload symbol for "${phrase.text}".`);
            }

            const uploadResult: { storageId: Id<'_storage'> } = await uploadResponse.json();
            symbolStorageId = uploadResult.storageId;
          }

          phrases.push({
            text: phrase.text,
            position: phrase.position,
            ...(symbolStorageId ? { symbolStorageId } : {}),
          });
        }

        boards.push({
          name: board.name,
          phrases,
        });
      }

      const importedIds = await importBoards({ boards });
      onImported(importedIds.map(String));
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setNormalized(null);
    setError(null);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting) {
          reset();
          onClose();
        }
      }}
      title="Import Open Board"
      snapPoints={[70, 90]}
    >
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">Open Board file</span>
          <input
            type="file"
            accept=".obf,.obz,application/json,application/zip"
            onChange={handleFileChange}
            disabled={isParsing || isImporting}
            className="block w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </label>

        {fileName && (
          <div className="rounded-xl bg-surface-hover px-4 py-3 text-sm text-text-secondary">
            {isParsing ? 'Reading ' : 'Selected '}
            <span className="font-medium text-foreground">{fileName}</span>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <SummaryValue label="Boards" value={summary.boards} />
            <SummaryValue label="Phrases" value={summary.phrases} />
            <SummaryValue label="Symbols" value={summary.symbols} />
          </div>
        )}

        {normalized && normalized.warnings.length > 0 && (
          <div className="max-h-40 overflow-auto rounded-xl border border-amber-700/40 bg-status-warning px-4 py-3">
            <h3 className="mb-2 text-sm font-semibold text-amber-500">Import warnings</h3>
            <ul className="space-y-1 text-sm text-amber-500">
              {normalized.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-status-error px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!normalized || isParsing || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-hover px-3 py-2 text-center">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-text-tertiary">{label}</div>
    </div>
  );
}
