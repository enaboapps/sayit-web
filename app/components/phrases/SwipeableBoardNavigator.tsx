'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  BookOpenIcon,
  PencilIcon,
  CheckIcon,
  Squares2X2Icon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import type { BoardSummary } from './types';

interface SwipeableBoardNavigatorProps {
  boards: BoardSummary[];
  currentBoardIndex: number;
  onBoardChange: (index: number) => void;
  onOpenBoardPicker?: () => void;
  children: React.ReactNode;
  // Action button props
  onAddBoard?: () => void;
  onAddPhrase?: () => void;
  onReader?: () => void;
  onEdit?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
  hasPhrases?: boolean;
}

export default function SwipeableBoardNavigator({
  boards,
  currentBoardIndex,
  onBoardChange,
  onOpenBoardPicker,
  children,
  onAddBoard,
  onAddPhrase,
  onReader,
  onEdit,
  isEditMode = false,
  canEditBoard = true,
  hasPhrases = false,
}: SwipeableBoardNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const currentBoard = boards[currentBoardIndex];
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };

    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen]);

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
        {/* Previous Arrow */}
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

        {/* Next Arrow */}
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
      </div>

      {/* Action Buttons Row */}
      {(onAddBoard || onAddPhrase || (hasPhrases && onReader) || (canEditBoard && onEdit)) && (
        <div className="flex items-center justify-center gap-2 py-2 bg-surface">
          {/* Add Dropdown */}
          {(onAddBoard || (onAddPhrase && canEditBoard)) && (
            <div ref={addMenuRef} className="relative">
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isAddMenuOpen
                    ? 'bg-surface-hover text-foreground'
                    : 'hover:bg-surface-hover text-text-secondary'
                }`}
                aria-label="Add new"
                aria-expanded={isAddMenuOpen}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add</span>
              </button>

              {/* Dropdown Menu */}
              {isAddMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                  {onAddPhrase && canEditBoard && (
                    <button
                      onClick={() => {
                        onAddPhrase();
                        setIsAddMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>New Phrase</span>
                    </button>
                  )}
                  {onAddBoard && (
                    <button
                      onClick={() => {
                        onAddBoard();
                        setIsAddMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      <span>New Board</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reader - only if board has phrases */}
          {hasPhrases && onReader && (
            <button
              onClick={onReader}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-surface-hover text-text-secondary text-sm"
              aria-label="Open reader"
            >
              <BookOpenIcon className="w-4 h-4" />
              <span>Reader</span>
            </button>
          )}

          {/* Edit/Done - only if can edit */}
          {canEditBoard && onEdit && (
            <button
              onClick={onEdit}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm ${
                isEditMode
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-surface-hover text-text-secondary'
              }`}
              aria-label={isEditMode ? 'Done editing' : 'Edit board'}
            >
              {isEditMode ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

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
