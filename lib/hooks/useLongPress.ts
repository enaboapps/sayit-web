import { useRef, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  /** Delay in ms before long press fires (default 500) */
  delay?: number;
  /** Called on normal tap/click (short press) */
  onPress?: () => void;
  /** Called when a long press is detected */
  onLongPress?: () => void;
  /** Whether the long press is enabled (default true) */
  enabled?: boolean;
}

/**
 * Hook that distinguishes between short press (tap/click) and long press.
 *
 * Returns event handlers for touch and mouse events. When `enabled` is false,
 * `onPress` fires immediately on click and long-press detection is skipped.
 */
export function useLongPress({
  delay = 500,
  onPress,
  onLongPress,
  enabled = true,
}: UseLongPressOptions) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const startPress = useCallback(() => {
    if (!enabled || !onLongPress) return;

    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress();
    }, delay);
  }, [delay, enabled, onLongPress]);

  const endPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onPress?.();
  }, [onPress]);

  return {
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onTouchCancel: endPress,
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onClick: handleClick,
  };
}
