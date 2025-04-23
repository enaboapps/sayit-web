'use client'

import { Phrase } from '@/lib/models/Phrase'
import { PencilIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onEdit?: () => void
  className?: string
}

export default function PhraseTile({ phrase, onPress, onEdit, className = '' }: PhraseTileProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchImageUrl = async () => {
      const symbol = await phrase.getSymbol()?.getImageURL()
      if (symbol) {
        setUrl(symbol)
      }
    }
    fetchImageUrl()
  }, [phrase])

  console.log('PhraseTile rendering:', {
    phraseId: phrase.id,
    symbolId: phrase.symbol_id,
    symbolUrl: url
  })
  
  const handleClick = () => {
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
      className={`relative bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-center h-full ${
        onEdit ? 'ring-2 ring-gray-300' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {onEdit && (
        <div className="absolute top-2 right-2">
          <PencilIcon className="h-5 w-5 text-gray-500" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full">
        {url && !imageError && (
          <div className="mb-3">
            <img 
              src={url} 
              alt={`Symbol for ${phrase.text}`} 
              className="w-16 h-16 object-contain"
              onError={() => {
                console.error('Error loading image:', url)
                setImageError(true)
              }}
            />
          </div>
        )}
        <div className="text-center w-full">
          <p className="text-black text-xl font-medium line-clamp-3 px-2">{phrase.text}</p>
        </div>
      </div>
    </div>
  )
} 