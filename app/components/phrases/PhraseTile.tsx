'use client';

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
        flex flex-col items-center justify-center min-h-[52px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${onEdit ? 'border-l-4 border-blue-400' : ''}
        ${isSpeaking ? 'border-l-4 border-orange' : ''}
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
      <div className="flex items-center justify-center w-full h-full p-2">
        <p className="text-foreground text-sm sm:text-base font-semibold line-clamp-2 leading-tight text-center w-full">
          {phrase.text}
        </p>
      </div>
    </motion.div>
  );
}
