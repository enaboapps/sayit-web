'use client'

import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline'
import { PhraseBoard } from '@/lib/models/PhraseBoard'

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
  if (boards.length === 0) return null

  return (
    <div className="flex items-center bg-white mb-2">
      <button
        onClick={onPrevBoard}
        className="p-2 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
        aria-label="Previous board"
      >
        <ChevronLeftIcon className="h-5 w-5 text-black" />
      </button>

      <div 
        className="flex-1 flex items-center justify-between p-2 min-h-[40px] cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => {
          if (isEditMode && selectedBoard) {
            onEditBoard(selectedBoard.id ?? '')
          }
        }}
      >
        <div className="flex items-center space-x-2">
          {selectedBoard?.symbol && (
            <img 
              src={selectedBoard.symbol.url ?? ''} 
              alt={selectedBoard.symbol.name ?? ''}
              className="w-6 h-6 object-contain"
            />
          )}
          <div>
            <h2 className="font-medium text-black text-sm">{selectedBoard?.name}</h2>
            <p className="text-xs text-black">
              {isLoadingPhrases ? (
                <span className="inline-block w-16 h-3 bg-gray-200 rounded animate-pulse" />
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
          <div className="flex space-x-1">
            {boards.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectBoard(index)
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to board ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNextBoard}
        className="p-2 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
        aria-label="Next board"
      >
        <ChevronRightIcon className="h-5 w-5 text-black" />
      </button>
    </div>
  )
} 