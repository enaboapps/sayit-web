'use client';

import { useEffect, useRef, useState } from 'react';

const KEYBOARD_OPEN_THRESHOLD_PX = 150;

const TEXT_INPUT_TYPES = new Set([
  'email', 'number', 'password', 'search', 'tel', 'text', 'url',
]);

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement) {
    return !element.disabled && !element.readOnly && TEXT_INPUT_TYPES.has(element.type.toLowerCase());
  }
  return false;
}

/**
 * Detects whether the mobile keyboard is open.
 *
 * With `interactiveWidget: 'resizes-content'`, the layout viewport shrinks
 * when the keyboard opens. We track the maximum window.innerHeight (full
 * screen without keyboard) and compare against the current height.
 */
export function useKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);
  const maxHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const currentHeight = window.innerHeight;
      // Update max height when no editable element is focused (keyboard definitely closed)
      if (!isEditableElement(document.activeElement)) {
        maxHeightRef.current = Math.max(maxHeightRef.current, currentHeight);
        setIsOpen(false);
        return;
      }
      // Keyboard is open if height dropped significantly while an input is focused
      const heightDrop = maxHeightRef.current - currentHeight;
      setIsOpen(heightDrop > KEYBOARD_OPEN_THRESHOLD_PX);
    };

    check();

    window.addEventListener('resize', check);
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);

    return () => {
      window.removeEventListener('resize', check);
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
    };
  }, []);

  return isOpen;
}
