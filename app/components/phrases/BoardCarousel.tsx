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
    <div className="flex items-center space-x-2 mb-6">
      <button
        onClick={onPrevBoard}
        className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
        aria-label="Previous board"
      >
        <ChevronLeftIcon className="h-5 w-5 text-black" />
      </button>

      <div 
        className="flex-1 flex items-center justify-between bg-white rounded-xl shadow-md p-4 min-h-[60px] cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
        onClick={() => {
          if (isEditMode && selectedBoard) {
            onEditBoard(selectedBoard.id ?? '')
          }
        }}
      >
        <div className="flex items-center space-x-3">
          {selectedBoard?.symbol && (
            <img 
              src={selectedBoard.symbol.url ?? ''} 
              alt={selectedBoard.symbol.name ?? ''}
              className="w-8 h-8 object-contain"
            />
          )}
          <div>
            <h2 className="font-medium text-black">{selectedBoard?.name}</h2>
            <p className="text-sm text-black">
              {isLoadingPhrases ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                `${phrasesCount} ${phrasesCount === 1 ? 'phrase' : 'phrases'}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditMode && (
            <PencilIcon className="h-5 w-5 text-gray-500" />
          )}
          <div className="flex space-x-1">
            {boards.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectBoard(index)
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-gray-600 scale-125' : 'bg-gray-300'
                }`}
                aria-label={`Go to board ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNextBoard}
        className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
        aria-label="Next board"
      >
        <ChevronRightIcon className="h-5 w-5 text-black" />
      </button>
    </div>
  )
} 