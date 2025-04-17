'use client'

import { Phrase } from '../../lib/models/Phrase'

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onDelete?: () => void
}

export default function PhraseTile({ phrase, onPress, onDelete }: PhraseTileProps) {
  return (
    <div className="relative bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200">
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          ×
        </button>
      )}
      {phrase.symbol && (
        <div className="mb-2">
          <img src={phrase.symbol.url} alt={phrase.symbol.name} className="w-12 h-12" />
        </div>
      )}
      <div className="text-center" onClick={onPress}>
        <p className="text-gray-900 text-lg">{phrase.text}</p>
      </div>
    </div>
  )
} 