'use client';

import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

interface OpenBoardExportMenuProps {
  onImportOpenBoard?: () => void;
  onExportCurrentBoard?: () => void;
  onExportAllBoards?: () => void;
  canExportCurrentBoard?: boolean;
  canExportAllBoards?: boolean;
  onAction?: () => void;
}

export default function OpenBoardExportMenu({
  onImportOpenBoard,
  onExportCurrentBoard,
  onExportAllBoards,
  canExportCurrentBoard = false,
  canExportAllBoards = false,
  onAction,
}: OpenBoardExportMenuProps) {
  if (!onImportOpenBoard && !onExportCurrentBoard && !onExportAllBoards) {
    return null;
  }

  const handleClick = (action?: () => void) => {
    action?.();
    onAction?.();
  };

  return (
    <>
      {onImportOpenBoard && (
        <button
          onClick={() => handleClick(onImportOpenBoard)}
          className="w-full flex items-center gap-2.5 border-t border-border px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
        >
          <ArrowUpTrayIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-foreground">Import Open Board...</span>
        </button>
      )}
      {onExportCurrentBoard && (
        <button
          onClick={() => handleClick(onExportCurrentBoard)}
          disabled={!canExportCurrentBoard}
          className="w-full flex items-center gap-2.5 border-t border-border px-4 py-3 text-sm transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-foreground">Export Current Board (.obf)</span>
        </button>
      )}
      {onExportAllBoards && (
        <button
          onClick={() => handleClick(onExportAllBoards)}
          disabled={!canExportAllBoards}
          className="w-full flex items-center gap-2.5 border-t border-border px-4 py-3 text-sm transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-foreground">Export All Boards (.obz)</span>
        </button>
      )}
    </>
  );
}
