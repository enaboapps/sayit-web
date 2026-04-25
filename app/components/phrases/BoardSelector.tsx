import { useState } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import BoardGridPopup from './BoardGridPopup';
import BoardActionButtons from './BoardActionButtons';
import { Button } from '@/app/components/ui/Button';
import type { BoardSummary } from './types';

interface BoardSelectorProps {
  boards: BoardSummary[];
  selectedBoard: BoardSummary | null;
  isEditMode: boolean;
  onSelectBoard: (board: BoardSummary) => void;
  onEditBoard?: (boardId: string) => void;
  onAddPhrase?: () => void;
  onAddNavigateTile?: () => void;
  onAddBoard?: () => void;
  onEdit?: () => void;
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
  onAddBoard,
  onEdit,
  embedded = false,
}: BoardSelectorProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (boards.length === 0) {
    return null;
  }

  const canEditSelected = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';
  const editSelectedBoard = selectedBoard && canEditSelected && onEditBoard
    ? () => onEditBoard(selectedBoard.id)
    : undefined;

  const renderBoardSubtitle = (board: BoardSummary | null) => {
    if (!board) {
      return null;
    }

    if (board.isShared && board.sharedBy) {
      return (
        <div className="mt-0.5 flex items-center gap-1">
          <UserGroupIcon className="h-3 w-3 text-primary-400" />
          <span className="text-xs text-primary-400">
            Shared by {board.sharedBy}
          </span>
        </div>
      );
    }

    if (board.isOwner && board.forClientName) {
      return (
        <div className="mt-0.5 flex items-center gap-1">
          <UserGroupIcon className="h-3 w-3 text-blue-400" />
          <span className="text-xs text-blue-400">
            For {board.forClientName}
          </span>
        </div>
      );
    }

    return null;
  };

  const cardClass = embedded
    ? ''
    : 'bg-surface rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300';
  const wrapperClass = embedded ? '' : 'mb-4';

  if (boards.length === 1) {
    return (
      <div className={wrapperClass}>
        <div className={`flex items-center ${cardClass}`}>
          <div className="flex flex-1 items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-foreground">{selectedBoard?.name}</h2>
              {renderBoardSubtitle(selectedBoard)}
            </div>
          </div>
        </div>
        <BoardActionButtons
          onAddPhrase={onAddPhrase}
          onAddNavigateTile={onAddNavigateTile}
          onAddBoard={onAddBoard}
          onEdit={onEdit}
          onEditBoard={editSelectedBoard}
          isEditMode={isEditMode}
          canEditBoard={canEditSelected}
        />
      </div>
    );
  }

  return (
    <>
      <div className={wrapperClass}>
        <div className={`flex items-center ${cardClass}`}>
          <div
            className="flex flex-1 cursor-pointer items-center justify-between px-6 py-4"
            onClick={() => setIsPopupOpen(true)}
          >
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-foreground">{selectedBoard?.name}</h2>
              {renderBoardSubtitle(selectedBoard)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                setIsPopupOpen(true);
              }}
            >
              <span className="text-lg text-text-secondary transition-colors duration-200 hover:text-foreground">▼</span>
            </Button>
          </div>
        </div>
        <BoardActionButtons
          onAddPhrase={onAddPhrase}
          onAddNavigateTile={onAddNavigateTile}
          onAddBoard={onAddBoard}
          onEdit={onEdit}
          onEditBoard={editSelectedBoard}
          isEditMode={isEditMode}
          canEditBoard={canEditSelected}
        />
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
