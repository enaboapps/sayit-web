import { useState } from 'react';
import { PencilIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import BoardGridPopup from './BoardGridPopup';
import { Button } from '@/app/components/ui/Button';
import type { BoardSummary } from './types';

interface BoardSelectorProps {
  boards: BoardSummary[];
  selectedBoard: BoardSummary | null;
  isEditMode: boolean;
  onSelectBoard: (board: BoardSummary) => void;
  onEditBoard: (boardId: string) => void;
}

export default function BoardSelector({
  boards,
  selectedBoard,
  isEditMode,
  onSelectBoard,
  onEditBoard,
}: BoardSelectorProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (boards.length === 0) return null;

  const canEditSelected = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';

  // If there's only one board, show it directly
  if (boards.length === 1) {
    return (
      <div className="flex items-center bg-surface rounded-3xl shadow-2xl hover:shadow-3xl mb-4 transition-all duration-300">
        <div
          className="flex-1 flex items-center justify-between px-6 py-4 cursor-pointer"
          onClick={() => {
            if (isEditMode && selectedBoard && canEditSelected) {
              onEditBoard(selectedBoard.id);
            }
          }}
        >
          <div className="flex flex-col">
            <h2 className="font-semibold text-foreground text-base">{selectedBoard?.name}</h2>
            {selectedBoard?.isShared && selectedBoard?.sharedBy && (
              <div className="flex items-center gap-1 mt-0.5">
                <UserGroupIcon className="h-3 w-3 text-primary-400" />
                <span className="text-xs text-primary-400">
                  Shared by {selectedBoard.sharedBy}
                </span>
              </div>
            )}
          </div>
          {isEditMode && canEditSelected && (
            <PencilIcon className="h-5 w-5 text-text-secondary hover:text-foreground transition-colors duration-200" />
          )}
        </div>
      </div>
    );
  }

  // If there are multiple boards, show a button to open the popup
  return (
    <>
      <div className="flex items-center bg-surface rounded-3xl shadow-2xl hover:shadow-3xl mb-4 transition-all duration-300">
        <div
          className="flex-1 flex items-center justify-between px-6 py-4 cursor-pointer"
          onClick={() => setIsPopupOpen(true)}
        >
          <div className="flex flex-col">
            <h2 className="font-semibold text-foreground text-base">{selectedBoard?.name}</h2>
            {selectedBoard?.isShared && selectedBoard?.sharedBy && (
              <div className="flex items-center gap-1 mt-0.5">
                <UserGroupIcon className="h-3 w-3 text-primary-400" />
                <span className="text-xs text-primary-400">
                  Shared by {selectedBoard.sharedBy}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {isEditMode && canEditSelected && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (selectedBoard) {
                    onEditBoard(selectedBoard.id);
                  }
                }}
              >
                <PencilIcon className="h-5 w-5 text-text-secondary hover:text-foreground transition-colors duration-200" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsPopupOpen(true);
              }}
            >
              <span className="text-text-secondary hover:text-foreground transition-colors duration-200 text-lg">▼</span>
            </Button>
          </div>
        </div>
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
