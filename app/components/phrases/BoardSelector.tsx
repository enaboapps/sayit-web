import { useState } from 'react';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import { PencilIcon } from '@heroicons/react/24/outline';
import BoardGridPopup from './BoardGridPopup';
import { Button } from '@/app/components/ui/Button';

interface BoardSelectorProps {
  boards: PhraseBoard[];
  selectedBoard: PhraseBoard | null;
  isEditMode: boolean;
  isLoadingPhrases?: boolean;
  onSelectBoard: (board: PhraseBoard) => void;
  onEditBoard: (boardId: string) => void;
}

export default function BoardSelector({
  boards,
  selectedBoard,
  isEditMode,
  isLoadingPhrases = false,
  onSelectBoard,
  onEditBoard,
}: BoardSelectorProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (boards.length === 0) return null;

  // If there's only one board, show it directly
  if (boards.length === 1) {
    return (
      <div className="flex items-center bg-surface mb-2">
        <div
          className="flex-1 flex items-center justify-between p-3 min-h-[40px] cursor-pointer hover:bg-surface-hover/50 transition-colors duration-200"
          onClick={() => {
            if (isEditMode && selectedBoard) {
              onEditBoard(selectedBoard.id ?? '');
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <div>
              <h2 className="font-medium text-foreground text-sm">{selectedBoard?.name}</h2>
              <p className="text-xs text-text-secondary">
                {isLoadingPhrases ? (
                  <span className="inline-block w-16 h-3 bg-surface-hover rounded animate-pulse" />
                ) : selectedBoard?.phrases.length === 0 ? (
                  <span className="text-text-secondary">Empty board</span>
                ) : (
                  `${selectedBoard?.phrases.length} ${selectedBoard?.phrases.length === 1 ? 'phrase' : 'phrases'}`
                )}
              </p>
            </div>
          </div>
          {isEditMode && (
            <PencilIcon className="h-4 w-4 text-text-secondary" />
          )}
        </div>
      </div>
    );
  }

  // If there are multiple boards, show a button to open the popup
  return (
    <>
      <div className="flex items-center bg-surface mb-2">
        <div
          className="flex-1 flex items-center justify-between p-3 min-h-[40px] cursor-pointer hover:bg-surface-hover/50 transition-colors duration-200"
          onClick={() => setIsPopupOpen(true)}
        >
          <div className="flex items-center space-x-2">
            <div>
              <h2 className="font-medium text-foreground text-sm">{selectedBoard?.name}</h2>
              <p className="text-xs text-text-secondary">
                {isLoadingPhrases ? (
                  <span className="inline-block w-16 h-3 bg-surface-hover rounded animate-pulse" />
                ) : selectedBoard?.phrases.length === 0 ? (
                  <span className="text-text-secondary">Empty board</span>
                ) : (
                  `${selectedBoard?.phrases.length} ${selectedBoard?.phrases.length === 1 ? 'phrase' : 'phrases'}`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (selectedBoard) {
                    onEditBoard(selectedBoard.id ?? '');
                  }
                }}
              >
                <PencilIcon className="h-4 w-4 text-text-secondary" />
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
              <span className="text-text-secondary">▼</span>
            </Button>
          </div>
        </div>
      </div>

      <BoardGridPopup
        boards={boards}
        selectedBoard={selectedBoard}
        isEditMode={isEditMode}
        isLoadingPhrases={isLoadingPhrases}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSelectBoard={onSelectBoard}
        onEditBoard={onEditBoard}
      />
    </>
  );
} 