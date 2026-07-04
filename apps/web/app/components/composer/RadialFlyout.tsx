'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Squares2X2Icon, XMarkIcon } from '@heroicons/react/24/outline';

export interface RadialFlyoutItem {
  key: string;
  /** Short label shown next to the tile while the wheel is open. */
  label: string;
  /**
   * The tile button itself (may be wrapped, e.g. in SubscriptionWrapper).
   * The caller is responsible for closing the wheel in the button's onClick.
   */
  content: ReactNode;
}

interface RadialFlyoutProps {
  items: RadialFlyoutItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Count badge shown on the closed trigger (e.g. available suggestions). */
  triggerBadge?: number;
}

/**
 * Position of an item along a quarter-circle arc fanning out from the
 * trigger: from straight down (90deg) to straight left (180deg), in screen
 * coordinates (y grows downward). A single item sits at the 135deg midpoint.
 */
function itemPosition(index: number, count: number, radius: number) {
  const angle =
    count === 1
      ? (3 * Math.PI) / 4
      : Math.PI / 2 + (Math.PI / 2) * (index / (count - 1));
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    // Unit vector pointing outward from the trigger, used to place labels
    // on the far side of each tile so they never overlap neighboring tiles.
    outX: Math.cos(angle),
    outY: Math.sin(angle),
  };
}

const LABEL_OFFSET = 46;

export default function RadialFlyout({
  items,
  isOpen,
  onOpen,
  onClose,
  triggerBadge = 0,
}: RadialFlyoutProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Larger wheels need a bigger radius so 48px tiles don't overlap along the arc.
  const radius = Math.max(110, 76 + items.length * 18);

  const close = () => {
    onClose();
    triggerRef.current?.focus();
  };

  // Move focus into the wheel when it opens.
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      wheelRef.current
        ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
        ?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const buttons = Array.from(
      wheelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []
    );
    if (buttons.length === 0) return;
    e.preventDefault();
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const direction = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    buttons[(currentIndex + direction + buttons.length) % buttons.length]?.focus();
  };

  if (items.length === 0) return null;

  return (
    <div className="absolute top-3 right-3 z-40" onKeyDown={handleKeyDown}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 -z-10 bg-overlay/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <button
        ref={triggerRef}
        type="button"
        onClick={isOpen ? close : onOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close actions' : 'More actions'}
        className="relative w-12 h-12 rounded-full flex items-center justify-center bg-surface border border-border text-text-secondary shadow-lg hover:bg-surface-hover hover:text-foreground transition-colors"
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Squares2X2Icon className="w-6 h-6" />}
        {!isOpen && triggerBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold px-1">
            {triggerBadge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div
            ref={wheelRef}
            role="group"
            aria-label="Composer actions"
            className="absolute left-1/2 top-1/2 w-0 h-0"
          >
            {items.map((item, index) => {
              const pos = itemPosition(index, items.length, radius);
              return (
                <motion.div
                  key={item.key}
                  className="absolute left-0 top-0"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 28,
                      delay: index * 0.03,
                    },
                  }}
                  exit={{
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0.4,
                    transition: {
                      duration: 0.15,
                      delay: (items.length - 1 - index) * 0.02,
                    },
                  }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    {item.content}
                    <span
                      className="absolute pointer-events-none whitespace-nowrap text-[10px] font-medium text-text-primary bg-surface/95 border border-border px-1.5 py-0.5 rounded-full"
                      style={{
                        left: `calc(50% + ${pos.outX * LABEL_OFFSET}px)`,
                        top: `calc(50% + ${pos.outY * LABEL_OFFSET}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      aria-hidden
                    >
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
