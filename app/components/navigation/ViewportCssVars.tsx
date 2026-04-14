'use client';

import { useEffect, useRef } from 'react';
import { useVisualViewport } from '@/lib/hooks/useVisualViewport';

const KEYBOARD_OPEN_THRESHOLD_PX = 80;

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;

  return element.isContentEditable
    || element.tagName === 'TEXTAREA'
    || element.tagName === 'INPUT';
}

export default function ViewportCssVars() {
  const viewport = useVisualViewport();
  const layoutHeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const viewportHeight = viewport.height ?? window.innerHeight;
    const currentLayoutHeight = viewport.innerHeight ?? window.innerHeight;
    const focusedEditable = isEditableElement(document.activeElement);
    const previousLayoutHeight = layoutHeightRef.current ?? currentLayoutHeight;
    const layoutHeight = Math.max(previousLayoutHeight, currentLayoutHeight, viewportHeight);
    const keyboardInset = Math.max(
      0,
      layoutHeight - ((viewport.top ?? 0) + viewportHeight)
    );
    const isKeyboardOpen = focusedEditable && keyboardInset > KEYBOARD_OPEN_THRESHOLD_PX;

    if (!isKeyboardOpen) {
      layoutHeightRef.current = currentLayoutHeight;
    } else {
      layoutHeightRef.current = layoutHeight;
    }

    root.style.setProperty('--visual-viewport-height', `${viewportHeight}px`);
    root.style.setProperty('--keyboard-inset', `${isKeyboardOpen ? keyboardInset : 0}px`);
    root.dataset.keyboardOpen = isKeyboardOpen ? 'true' : 'false';

    return () => {
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--keyboard-inset');
      delete root.dataset.keyboardOpen;
    };
  }, [viewport.height, viewport.innerHeight, viewport.top]);

  return null;
}
