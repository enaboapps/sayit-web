'use client';

import { ChevronLeft, ChevronRight, Volume2, X } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useState, useEffect, useRef } from 'react';
import { Phrase } from '@/lib/models/Phrase';

interface ReaderPopupProps {
  phrases: Phrase[]
  isOpen: boolean
  onClose: () => void
  onSpeak: (text: string) => void
}

export default function ReaderPopup({
  phrases,
  isOpen,
  onClose,
  onSpeak,
}: ReaderPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  const currentPhrase = phrases[currentIndex];

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : phrases.length - 1;
    setCurrentIndex(newIndex);
    if (phrases[newIndex]) {
      onSpeak(phrases[newIndex].text);
    }
  };

  const goToNext = () => {
    const newIndex = currentIndex < phrases.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    if (phrases[newIndex]) {
      onSpeak(phrases[newIndex].text);
    }
  };

  const handleSpeak = () => {
    if (currentPhrase) {
      onSpeak(currentPhrase.text);
    }
  };

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
  }, [isOpen, currentPhrase]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset index when phrases change
  useEffect(() => {
    setCurrentIndex(0);
  }, [phrases]);

  if (!isOpen || !phrases.length) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={popupRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Reader Mode
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentIndex + 1} of {phrases.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              data-tooltip-id="close-reader-tooltip"
              data-tooltip-content="Close reader mode (ESC)"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Phrase Display */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9CA3AF #F3F4F6' }}>
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-gray-100 leading-relaxed break-words hyphens-auto text-center">
              {currentPhrase?.text}
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={goToPrevious}
            disabled={phrases.length <= 1}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
            data-tooltip-id="previous-tooltip"
            data-tooltip-content="Previous phrase (←)"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={handleSpeak}
            className="flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            data-tooltip-id="speak-tooltip"
            data-tooltip-content="Speak phrase (Spacebar)"
          >
            <Volume2 className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            disabled={phrases.length <= 1}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
            data-tooltip-id="next-tooltip"
            data-tooltip-content="Next phrase (→)"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Use arrow keys to navigate • Spacebar to speak • ESC to close
          </p>
        </div>

        {/* Tooltips */}
        <Tooltip id="close-reader-tooltip" place="bottom" />
        <Tooltip id="previous-tooltip" place="top" />
        <Tooltip id="speak-tooltip" place="top" />
        <Tooltip id="next-tooltip" place="top" />
      </div>
    </div>
  );
}