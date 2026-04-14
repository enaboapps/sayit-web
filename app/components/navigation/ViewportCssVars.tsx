'use client';

import { useEffect } from 'react';
import { useVisualViewport } from '@/lib/hooks/useVisualViewport';

const KEYBOARD_OPEN_THRESHOLD_PX = 80;

export default function ViewportCssVars() {
  const viewport = useVisualViewport();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const viewportHeight = viewport.height ?? window.innerHeight;
    const keyboardInset = Math.max(
      0,
      window.innerHeight - ((viewport.top ?? 0) + viewportHeight)
    );
    const isKeyboardOpen = keyboardInset > KEYBOARD_OPEN_THRESHOLD_PX;

    root.style.setProperty('--visual-viewport-height', `${viewportHeight}px`);
    root.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
    root.dataset.keyboardOpen = isKeyboardOpen ? 'true' : 'false';

    return () => {
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--keyboard-inset');
      delete root.dataset.keyboardOpen;
    };
  }, [viewport.height, viewport.top]);

  return null;
}
