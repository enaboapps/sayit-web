'use client';

import { Phrase } from '@/lib/models/Phrase';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import SymbolImage from '@/app/components/symbols/SymbolImage';

interface PhraseTileProps {
  phrase: Phrase
  onPress: () => void
  onEdit?: () => void
  className?: string
}

export default function PhraseTile({ phrase, onPress, onEdit, className = '' }: PhraseTileProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const symbol = await phrase.getSymbol()?.getImageURL();
        if (symbol) {
          setUrl(symbol);
        }
      } catch {
        setImageError(true);
      }
    };
    fetchImageUrl();
  }, [phrase]);

  const handleClick = () => {
    if (onEdit) {
      // In edit mode, clicking anywhere on the tile should edit
      onEdit();
    } else {
      // Not in edit mode, use normal press behavior
      onPress();
    }
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 flex flex-col items-center justify-center h-full ${
        onEdit ? 'ring-2 ring-gray-300 dark:ring-gray-600' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {onEdit && (
        <div className="absolute top-2 right-2">
          <PencilIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full">
        {url && !imageError && (
          <div className="mb-3">
            <SymbolImage
              url={url}
              alt={`Symbol for ${phrase.text}`}
              size="md"
            />
          </div>
        )}
        <div className="text-center w-full">
          <p className="text-black dark:text-gray-100 text-xl font-medium line-clamp-3 px-2">{phrase.text}</p>
        </div>
      </div>
    </div>
  );
}
