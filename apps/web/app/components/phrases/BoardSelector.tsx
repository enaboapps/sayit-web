import { useState } from 'react';
import { CheckIcon, ChevronDownIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import BoardGridPopup from './BoardGridPopup';
import BoardActionButtons from './BoardActionButtons';
import type { BoardSummary } from './types';

interface BoardSelectorProps {
  boards: BoardSummary[];
  selectedBoard: BoardSummary | null;
  isEditMode: boolean;
  onSelectBoard: (board: BoardSummary) => void;
  onEditBoard?: (boardId: string) => void;
  onAddPhrase?: () => void;
  onAddNavigateTile?: () => void;
  onAddAudioTile?: () => void;
  onAddBoard?: () => void;
  onEdit?: () => void;
  onImportOpenBoard?: () => void;
  onExportOpenBoard?: () => void;
  onExportAllOpenBoards?: () => void;
  embedded?: boolean;
}

export default function BoardSelector({
  boards,
  selectedBoard,
  isEditMode,
  onSelectBoard,
  onEditBoard,
  onAddPhrase,
  onAddNavigateTile,
  onAddAudioTile,
  onAddBoard,
  onEdit,
  onImportOpenBoard,
  onExportOpenBoard,
  onExportAllOpenBoards,
  embedded = false,
}: BoardSelectorProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (boards.length === 0) return null;

  const canEditSelected = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';
  const editSelectedBoard = selectedBoard && canEditSelected && onEditBoard
    ? () => onEditBoard(selectedBoard.id)
    : undefined;

  const subtitle = selectedBoard?.isShared && selectedBoard.sharedBy
    ? `Shared by ${selectedBoard.sharedBy}`
    : selectedBoard?.isOwner && selectedBoard.forClientName
      ? `For ${selectedBoard.forClientName}`
      : null;

  const boardIdentity = (
    <>
      <span className="min-w-0 text-left">
        <span className="block truncate text-base font-semibold text-foreground">{selectedBoard?.name}</span>
        {subtitle && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-primary-300">
            <UserGroupIcon className="h-3.5 w-3.5" />
            {subtitle}
          </span>
        )}
      </span>
      {boards.length > 1 && <ChevronDownIcon className="h-5 w-5 shrink-0 text-text-secondary" />}
    </>
  );

  return (
    <>
      <div className={embedded ? '' : 'mb-4'}>
        <section
          aria-label="Board workspace"
          className={`flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 ${embedded ? '' : 'rounded-[var(--radius-card)] border shadow-[var(--shadow-card)]'}`}
        >
          {boards.length > 1 ? (
            <button
              type="button"
              onClick={() => setIsPopupOpen(true)}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:max-w-sm"
              aria-label={`Choose board. Current board: ${selectedBoard?.name ?? 'None'}`}
              aria-haspopup="dialog"
              aria-expanded={isPopupOpen}
            >
              {boardIdentity}
            </button>
          ) : (
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-3 py-2 sm:max-w-sm">
              {boardIdentity}
            </div>
          )}

          {isEditMode && canEditSelected && onEdit && (
            <div className="flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-blue-400/60 bg-blue-950/40 px-3" role="status">
              <span className="text-sm font-medium text-blue-200">Edit mode</span>
              <button type="button" onClick={onEdit} className="flex min-h-9 items-center gap-1 rounded-[var(--radius-small)] bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600" aria-label="Done editing">
                <CheckIcon className="h-4 w-4" />
                Done
              </button>
            </div>
          )}

          <BoardActionButtons
            onAddPhrase={onAddPhrase}
            onAddNavigateTile={onAddNavigateTile}
            onAddAudioTile={onAddAudioTile}
            onAddBoard={onAddBoard}
            onEdit={!isEditMode && canEditSelected ? onEdit : undefined}
            onEditBoard={editSelectedBoard}
            onImportOpenBoard={onImportOpenBoard}
            onExportOpenBoard={onExportOpenBoard}
            onExportAllOpenBoards={onExportAllOpenBoards}
            isEditMode={isEditMode}
            canEditBoard={canEditSelected}
          />
        </section>
      </div>

      <BoardGridPopup
        boards={boards}
        selectedBoard={selectedBoard}
        isEditMode={isEditMode}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSelectBoard={onSelectBoard}
        onEditBoard={onEditBoard}
      />
    </>
  );
}
