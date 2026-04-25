'use client';

import { useCallback, useRef } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { BoardSummary } from './types';
import BoardActionButtons from './BoardActionButtons';

interface SwipeableBoardNavigatorProps {
  boards: BoardSummary[];
  currentBoardIndex: number;
  onBoardChange: (index: number) => void;
  onOpenBoardPicker?: () => void;
  children: React.ReactNode;
  // Action button props
  onAddPhrase?: () => void;
  onAddNavigateTile?: () => void;
  onAddBoard?: () => void;
  onEdit?: () => void;
  onEditBoard?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
}

export default function SwipeableBoardNavigator({
  boards,
  currentBoardIndex,
  onBoardChange,
  onOpenBoardPicker,
  children,
  onAddPhrase,
  onAddNavigateTile,
  onAddBoard,
  onEdit,
  onEditBoard,
  isEditMode = false,
  canEditBoard = true,
}: SwipeableBoardNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentBoard = boards[currentBoardIndex];

  // Navigate to previous board
  const goToPrevious = useCallback(() => {
    if (currentBoardIndex > 0) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      onBoardChange(currentBoardIndex - 1);
    }
  }, [currentBoardIndex, onBoardChange]);

  // Navigate to next board
  const goToNext = useCallback(() => {
    if (currentBoardIndex < boards.length - 1) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      onBoardChange(currentBoardIndex + 1);
    }
  }, [currentBoardIndex, boards.length, onBoardChange]);

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50; // Minimum swipe distance
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Swipe left (next board)
      if ((offset < -threshold || velocity < -500) && currentBoardIndex < boards.length - 1) {
        goToNext();
      }
      // Swipe right (previous board)
      else if ((offset > threshold || velocity > 500) && currentBoardIndex > 0) {
        goToPrevious();
      }
    },
    [currentBoardIndex, boards.length, goToNext, goToPrevious]
  );

  const hasPrevious = currentBoardIndex > 0;
  const hasNext = currentBoardIndex < boards.length - 1;

  return (
    <div className="flex flex-col">
      {/* Board Header with Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-t-2xl">
        {/* Previous Arrow - only show if multiple boards */}
        {boards.length > 1 && (
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            className={`p-2 rounded-full transition-all duration-200 ${
              hasPrevious
                ? 'hover:bg-surface-hover text-foreground'
                : 'text-text-tertiary cursor-not-allowed'
            }`}
            aria-label="Previous board"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Board Name (tappable to open picker) */}
        <button
          onClick={onOpenBoardPicker}
          className="flex-1 text-center px-4"
        >
          <h2 className="font-semibold text-foreground text-base truncate">
            {currentBoard?.name || 'No Board Selected'}
          </h2>
          {boards.length > 1 && (
            <span className="text-xs text-text-tertiary">
              Tap to select • Swipe to navigate
            </span>
          )}
        </button>

        {/* Next Arrow - only show if multiple boards */}
        {boards.length > 1 && (
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className={`p-2 rounded-full transition-all duration-200 ${
              hasNext
                ? 'hover:bg-surface-hover text-foreground'
                : 'text-text-tertiary cursor-not-allowed'
            }`}
            aria-label="Next board"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Action Buttons Row */}
      <BoardActionButtons
        onAddPhrase={onAddPhrase}
        onAddNavigateTile={onAddNavigateTile}
        onAddBoard={onAddBoard}
        onEdit={onEdit}
        onEditBoard={onEditBoard}
        isEditMode={isEditMode}
        canEditBoard={canEditBoard}
      />

      {/* Dot Indicators */}
      {boards.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2 bg-surface">
          {boards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (index !== currentBoardIndex) {
                  if (navigator.vibrate) {
                    navigator.vibrate(20);
                  }
                  onBoardChange(index);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentBoardIndex
                  ? 'bg-primary-500 w-4'
                  : 'bg-text-tertiary hover:bg-text-secondary'
              }`}
              aria-label={`Go to board ${index + 1}`}
              aria-current={index === currentBoardIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Swipeable Content Area */}
      <motion.div
        ref={containerRef}
        className="flex-1 overflow-hidden touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: hasPrevious ? 0.2 : 0, right: hasNext ? 0.2 : 0 }}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBoardIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
