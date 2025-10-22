'use client';

import { PencilIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface PhraseTileProps {
  phrase: {
    id?: string;
    text: string;
    frequency?: number;
  };
  onPress: () => void;
  onEdit?: () => void;
  className?: string;
}

export default function PhraseTile({ phrase, onPress, onEdit, className = '' }: PhraseTileProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setIsSpeaking(true);
      onPress();
      setTimeout(() => setIsSpeaking(false), 800);
    }
  };

  return (
    <div
      className={`relative bg-surface rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md hover:bg-surface-hover active:ring-2 active:ring-orange active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center h-full ${
        onEdit ? 'ring-2 ring-blue-400' : ''
      } ${
        isSpeaking ? 'ring-2 ring-orange scale-[0.98]' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {onEdit && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-500 rounded-full p-1.5 shadow-sm">
            <PencilIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      {isSpeaking && !onEdit && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-orange rounded-full p-1.5 shadow-sm animate-pulse">
            <SpeakerWaveIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-center w-full">
          <p className="text-foreground text-lg font-semibold line-clamp-2 px-2 leading-tight">
            {phrase.text}
          </p>
        </div>
      </div>
    </div>
  );
}
