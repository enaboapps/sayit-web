'use client';

import { PencilIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PhraseTileProps {
  phrase: {
    id?: string;
    text: string;
    frequency?: number;
  };
  onPress: () => void;
  onEdit?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export default function PhraseTile({ phrase, onPress, onEdit, onLongPress, className = '' }: PhraseTileProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    setIsPressed(true);

    if (onLongPress && !onEdit) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setIsPressed(false);
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress();
      }, 500);
    }
  }, [onLongPress, onEdit]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = () => {
    // Ignore click if it was a long press
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    if (onEdit) {
      onEdit();
    } else {
      setIsSpeaking(true);
      onPress();
      setTimeout(() => setIsSpeaking(false), 800);
    }
  };

  return (
    <motion.div
      className={`relative bg-surface rounded-2xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[80px]
        ${onEdit ? 'ring-2 ring-blue-400' : ''}
        ${isSpeaking ? 'ring-2 ring-orange' : ''}
        ${className}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        backgroundColor: isPressed ? 'var(--surface-hover)' : 'var(--surface)',
      }}
      transition={{ duration: 0.15 }}
    >
      {onEdit && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-500 rounded-full p-1.5 shadow-sm">
            <PencilIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      {isSpeaking && !onEdit && (
        <motion.div
          className="absolute top-2 right-2 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="bg-orange rounded-full p-1.5 shadow-sm animate-pulse">
            <SpeakerWaveIcon className="h-4 w-4 text-white" />
          </div>
        </motion.div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full p-3">
        <div className="text-center w-full">
          <p className="text-foreground text-base sm:text-lg font-semibold line-clamp-3 leading-tight">
            {phrase.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
