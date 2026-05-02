'use client';

import BottomSheet from '@/app/components/ui/BottomSheet';
import { Button } from '@/app/components/ui/Button';
import { AAC_PROCESSOR_ACCEPT } from '@/lib/open-board-format/aacProcessors';
import { useOpenBoardImport } from './useOpenBoardImport';

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
  const {
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
  } = useOpenBoardImport({ onClose, onImported });

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
              {preview.boards.length} board{preview.boards.length === 1 ? '' : 's'} - {tileCount} tile{tileCount === 1 ? '' : 's'}
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
