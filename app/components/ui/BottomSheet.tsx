'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentages (e.g., [50, 90])
  initialSnap?: number; // Index of initial snap point
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Calculate snap point heights (in viewport height percentage)
  const getSnapHeight = useCallback((snapPercent: number) => {
    return `${snapPercent}vh`;
  }, []);

  // Get the current snap point percentage
  const currentSnapPercent = snapPoints[currentSnapIndex] || snapPoints[0];

  // Handle keyboard visibility (for mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Detect virtual keyboard by comparing visualViewport to window height
      if (window.visualViewport) {
        const keyboardH = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(keyboardH > 100 ? keyboardH : 0);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    const sheet = sheetRef.current;
    const focusableElements = sheet.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when opened
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      // If swiped down fast or far enough, close
      if (velocity > 500 || offset > 100) {
        onClose();
        return;
      }

      // If swiped up fast, go to higher snap point
      if (velocity < -500 && currentSnapIndex < snapPoints.length - 1) {
        setCurrentSnapIndex(currentSnapIndex + 1);
        return;
      }

      // Snap to nearest point based on current position
      const sheetHeight = sheetRef.current?.offsetHeight || 0;
      const viewportHeight = window.innerHeight;
      const currentHeightPercent = ((sheetHeight - offset) / viewportHeight) * 100;

      // Find closest snap point
      let closestIndex = 0;
      let closestDistance = Infinity;
      snapPoints.forEach((snap, index) => {
        const distance = Math.abs(snap - currentHeightPercent);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentSnapIndex(closestIndex);
    },
    [currentSnapIndex, onClose, snapPoints]
  );

  // Animate to current snap point when it changes
  useEffect(() => {
    if (isOpen) {
      controls.start({
        height: getSnapHeight(currentSnapPercent),
        transition: { type: 'spring', damping: 30, stiffness: 300 },
      });
    }
  }, [controls, currentSnapPercent, getSnapHeight, isOpen]);

  // Reset to initial snap when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnap);
    }
  }, [isOpen, initialSnap]);

  // Prevent body scroll when open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-2xl flex flex-col ${className}`}
            style={{
              maxHeight: '95vh',
              paddingBottom: keyboardHeight > 0 ? keyboardHeight : 'env(safe-area-inset-bottom)',
            }}
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              height: getSnapHeight(currentSnapPercent),
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                {title && (
                  <h2
                    id="bottom-sheet-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-full hover:bg-surface-hover transition-colors"
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
