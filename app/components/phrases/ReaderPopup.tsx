'use client';

import { X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface ReaderPopupProps {
  phrases: {
    id?: string;
    text: string;
  }[];
  isOpen: boolean;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export default function ReaderPopup({
  phrases,
  isOpen,
  onClose,
  onSpeak,
}: ReaderPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPhrase = phrases[currentIndex];

  const goToPrevious = useCallback(() => {
    if (phrases.length <= 1) return;
    setDirection(-1);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : phrases.length - 1;
    setCurrentIndex(newIndex);
    if (phrases[newIndex]) {
      onSpeak(phrases[newIndex].text);
    }
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20);
  }, [currentIndex, phrases, onSpeak]);

  const goToNext = useCallback(() => {
    if (phrases.length <= 1) return;
    setDirection(1);
    const newIndex = currentIndex < phrases.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    if (phrases[newIndex]) {
      onSpeak(phrases[newIndex].text);
    }
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20);
  }, [currentIndex, phrases, onSpeak]);

  const handleSpeak = useCallback(() => {
    if (currentPhrase) {
      onSpeak(currentPhrase.text);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [currentPhrase, onSpeak]);

  // Handle tap and double-tap
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - repeat speak
      handleSpeak();
    } else {
      // Single tap - speak
      handleSpeak();
    }

    lastTapRef.current = now;
  }, [handleSpeak]);

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      if (offset < -threshold || velocity < -500) {
        goToNext();
      } else if (offset > threshold || velocity > 500) {
        goToPrevious();
      }
    },
    [goToNext, goToPrevious]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case ' ':
          event.preventDefault();
          handleSpeak();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goToPrevious, goToNext, handleSpeak, onClose]);

  // Reset index when phrases change
  useEffect(() => {
    setCurrentIndex(0);
  }, [phrases]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !phrases.length) {
    return null;
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10 safe-area-inset-top">
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close reader mode"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 safe-area-inset-top">
        <span className="text-white/60 text-sm font-medium">
          {currentIndex + 1} / {phrases.length}
        </span>
      </div>

      {/* Main content area - swipeable */}
      <motion.div
        ref={containerRef}
        className="flex-1 flex items-center justify-center cursor-pointer select-none touch-pan-y"
        onClick={handleTap}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 },
            }}
            className="px-8 md:px-16 max-w-4xl"
          >
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-medium leading-relaxed text-center">
              {currentPhrase?.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Dot indicators */}
      {phrases.length > 1 && (
        <div className="flex items-center justify-center gap-2 pb-8 safe-area-inset-bottom">
          {phrases.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
                if (phrases[index]) {
                  onSpeak(phrases[index].text);
                }
                if (navigator.vibrate) navigator.vibrate(20);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to phrase ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe hint - only shown briefly */}
      <div className="absolute bottom-20 left-0 right-0 text-center">
        <p className="text-white/40 text-sm">
          Tap to speak • Swipe to navigate
        </p>
      </div>
    </div>
  );
}
