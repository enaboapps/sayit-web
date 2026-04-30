'use client';

import { useEffect, useRef, useState } from 'react';

const LONG_PRESS_THRESHOLD_MS = 500;
const HAPTIC_DURATION_MS = 50;

interface UseTileGestureArgs {
  /**
   * Triggered after `LONG_PRESS_THRESHOLD_MS` of sustained press. Pass
   * `undefined` to disable long-press detection (e.g. when the tile is in
   * edit mode and tap-to-edit takes over).
   */
  onLongPress?: () => void;
  /**
   * When `true`, every gesture side effect is suppressed: touch/mouse start
   * events become no-ops, the press visual never flips on, and no long-press
   * timer is scheduled. Use for "broken" tiles that should silently ignore
   * input. Click events still bubble — wrap your `onClick` with `wrapClick`
   * and let your component's own logic decide what to do.
   */
  disabled?: boolean;
}

interface UseTileGestureBindHandlers {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

interface UseTileGestureReturn {
  /** Tracks the press visual: true between mouse/touch-down and -up. */
  isPressed: boolean;
  /**
   * `prefers-reduced-motion` snapshot taken at mount. Not reactive — the OS
   * setting can't change in practice without remount, and re-reading every
   * render would just be wasted work.
   */
  prefersReducedMotion: boolean;
  /** Spread these handlers onto the gesture-receiving element. */
  bind: UseTileGestureBindHandlers;
  /**
   * Wraps an `onClick` handler so the click that browsers naturally fire
   * after a long-press (mousedown → timer fires → mouseup → click) is
   * swallowed instead of double-invoking the tile's primary action.
   */
  wrapClick: (onClick: () => void) => () => void;
}

/**
 * Shared gesture state machine for the board tile components (PhraseTile,
 * NavigateTile, AudioTile). Encapsulates:
 *
 * - the `isPressed` press-visual flag,
 * - the 500 ms long-press timer + cleanup,
 * - the trailing-click suppression after a long-press fires,
 * - the haptic vibrate(50) on long-press fire (SSR-safe),
 * - a one-shot `prefers-reduced-motion` read.
 *
 * Each tile keeps its own click routing (broken/edit/play/speak), audio /
 * speaking state, and visual chrome — only the gesture mechanics live here.
 */
export function useTileGesture({
  onLongPress,
  disabled = false,
}: UseTileGestureArgs = {}): UseTileGestureReturn {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Cleanup on unmount — don't let a fired-after-unmount timer reach into
  // a torn-down React tree.
  useEffect(() => {
    return () => clearLongPressTimer();
  }, []);

  const handlePressStart = () => {
    if (disabled) return;
    isLongPressRef.current = false;
    setIsPressed(true);

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsPressed(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(HAPTIC_DURATION_MS);
        }
        onLongPress();
      }, LONG_PRESS_THRESHOLD_MS);
    }
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    clearLongPressTimer();
  };

  const wrapClick = (onClick: () => void) => () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onClick();
  };

  return {
    isPressed,
    prefersReducedMotion,
    bind: {
      onTouchStart: handlePressStart,
      onTouchEnd: handlePressEnd,
      onTouchCancel: handlePressEnd,
      onMouseDown: handlePressStart,
      onMouseUp: handlePressEnd,
      onMouseLeave: handlePressEnd,
    },
    wrapClick,
  };
}
