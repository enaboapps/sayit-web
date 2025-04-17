'use client'

import { Phrase } from '@/app/lib/models/Phrase'
import { PencilIcon } from '@heroicons/react/24/outline'

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onEdit?: () => void
}

export default function PhraseTile({ phrase, onPress, onEdit }: PhraseTileProps) {
  return (
    <div 
      className="relative bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
      onClick={onPress}
    >
      <div className="absolute top-3 right-3">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            title="Edit phrase"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {phrase.symbol && (
        <div className="mb-3">
          <img src={phrase.symbol.url} alt={phrase.symbol.name} className="w-12 h-12" />
        </div>
      )}
      <div className="text-center">
        <p className="text-black text-lg font-medium">{phrase.text}</p>
      </div>
    </div>
  )
} 