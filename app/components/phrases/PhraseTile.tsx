'use client'

import { Phrase } from '../../lib/models/Phrase'

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onDelete?: () => void
}

export default function PhraseTile({ phrase, onPress, onDelete }: PhraseTileProps) {
  return (
    <div 
      className="relative bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
      onClick={onPress}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors duration-200"
        >
          ×
        </button>
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