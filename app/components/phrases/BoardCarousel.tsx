'use client';

import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import Button from '@/app/components/ui/Button';
import { PhraseBoard } from '@/lib/models/PhraseBoard';

interface BoardCarouselProps {
  boards: PhraseBoard[]
  selectedBoard: PhraseBoard | null
  currentIndex: number
  isEditMode: boolean
  phrasesCount: number
  isLoadingPhrases?: boolean
  onPrevBoard: () => void
  onNextBoard: () => void
  onSelectBoard: (index: number) => void
  onEditBoard: (boardId: string) => void
}

export default function BoardCarousel({
  boards,
  selectedBoard,
  currentIndex,
  isEditMode,
  phrasesCount,
  isLoadingPhrases = false,
  onPrevBoard,
  onNextBoard,
  onSelectBoard,
  onEditBoard,
}: BoardCarouselProps) {
  if (boards.length === 0) return null;

  return (
    <div className="flex items-center bg-white mb-2">
      {boards.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevBoard}
          aria-label="Previous board"
        >
          <ChevronLeftIcon className="h-5 w-5 text-black" />
        </Button>
      )}

      <div
        className="flex-1 flex items-center justify-between p-2 min-h-[40px] cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => {
          if (isEditMode && selectedBoard) {
            onEditBoard(selectedBoard.id ?? '');
          }
        }}
      >
        <div className="flex items-center space-x-2">
          <div>
            <h2 className="font-medium text-black text-sm">{selectedBoard?.name}</h2>
            <p className="text-xs text-black">
              {isLoadingPhrases ? (
                <span className="inline-block w-16 h-3 bg-gray-200 rounded animate-pulse" />
              ) : phrasesCount === 0 ? (
                <span className="text-gray-500">Empty board</span>
              ) : (
                `${phrasesCount} ${phrasesCount === 1 ? 'phrase' : 'phrases'}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {isEditMode && (
            <PencilIcon className="h-4 w-4 text-gray-500" />
          )}
          {boards.length > 1 && (
            <div className="flex space-x-1">
              {boards.map((_, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBoard(index);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to board ${index + 1}`}
                >
                  <span className="sr-only">Board {index + 1}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {boards.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextBoard}
          aria-label="Next board"
        >
          <ChevronRightIcon className="h-5 w-5 text-black" />
        </Button>
      )}
    </div>
  );
}
