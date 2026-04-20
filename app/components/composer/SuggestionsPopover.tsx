'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import ReplySuggestions from '../typing/ReplySuggestions';
import BottomSheet from '../ui/BottomSheet';

interface SuggestionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  history: string[];
  enabled: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onCountChange?: (count: number) => void;
}

export default function SuggestionsPopover({
  isOpen,
  onClose,
  history,
  enabled,
  onSelectSuggestion,
  onCountChange,
}: SuggestionsPopoverProps) {
  const isMobile = useIsMobile();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click (desktop only)
  useEffect(() => {
    if (isMobile || !isOpen) return;

    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMobile, isOpen, onClose]);

  const handleSelect = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    onClose();
  };

  const suggestionsContent = (
    <ReplySuggestions
      history={history}
      enabled={enabled}
      onSelectSuggestion={handleSelect}
      variant="card"
      onCountChange={onCountChange}
    />
  );

  // Mobile: BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Suggestions"
        snapPoints={[40]}
        initialSnap={0}
      >
        <div className="px-4 py-3">
          {suggestionsContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop: popover anchored to the right side
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          className="absolute right-full top-0 mr-2 w-72 z-50 rounded-2xl border border-border bg-surface shadow-xl"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
        >
          <div className="p-3">
            {suggestionsContent}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
