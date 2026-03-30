'use client';

import { PencilIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useCallback, useEffect } from 'react';
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

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
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

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className={`relative bg-surface rounded-xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[80px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      animate={prefersReducedMotion ? undefined : {
        scale: isPressed ? 0.95 : 1,
        backgroundColor: isPressed ? 'var(--surface-hover)' : 'var(--surface)',
      }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      aria-label={onEdit ? `Edit phrase: ${phrase.text}` : `Speak phrase: ${phrase.text}`}
      aria-pressed={isSpeaking}
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
