'use client'

import { Phrase } from '@/app/lib/models/Phrase'
import { PencilIcon } from '@heroicons/react/24/outline'

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onEdit?: () => void
}

export default function PhraseTile({ phrase, onPress, onEdit }: PhraseTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onEdit) {
      // In edit mode, clicking anywhere on the tile should edit
      onEdit()
    } else {
      // Not in edit mode, use normal press behavior
      onPress()
    }
  }

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5 ${
        onEdit ? 'ring-2 ring-gray-300' : ''
      }`}
      onClick={handleClick}
    >
      {onEdit && (
        <div className="absolute top-3 right-3">
          <PencilIcon className="h-5 w-5 text-gray-500" />
        </div>
      )}
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