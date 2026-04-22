'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StopIcon } from '@heroicons/react/24/solid';
import { SymbolImage } from '../symbols';

interface PhraseTileProps {
  phrase: {
    id?: string;
    text: string;
    symbolUrl?: string;
  };
  onPress: () => void;
  onStop?: () => void;
  onEdit?: () => void;
  onLongPress?: () => void;
  isSpeaking?: boolean;
  className?: string;
  textSizePx: number;
}

export default function PhraseTile({
  phrase,
  onPress,
  onStop,
  onEdit,
  onLongPress,
  isSpeaking = false,
  className = '',
  textSizePx,
}: PhraseTileProps) {
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
    } else if (isSpeaking && onStop) {
      onStop();
    } else {
      onPress();
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className={`relative bg-surface rounded-xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[52px] aspect-square overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${onEdit ? 'border-l-4 border-blue-400' : isSpeaking ? 'border-2 border-warning' : ''}
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
      aria-label={onEdit ? `Edit phrase: ${phrase.text}` : isSpeaking ? `Stop: ${phrase.text}` : `Speak phrase: ${phrase.text}`}
      aria-pressed={isSpeaking}
    >
      {isSpeaking && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center animate-pulse">
          <StopIcon className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full min-h-0 p-2 gap-1">
        {phrase.symbolUrl && (
          <SymbolImage src={phrase.symbolUrl} alt={phrase.text} size="md" />
        )}
        <p
          className="text-foreground font-semibold line-clamp-2 leading-tight text-center w-full"
          style={{ fontSize: `${textSizePx}px` }}
        >
          {phrase.text}
        </p>
      </div>
    </motion.div>
  );
}
