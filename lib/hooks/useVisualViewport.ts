'use client';

import { useEffect, useState } from 'react';

type VisualViewportState = {
  top: number;
  height: number | null;
  innerHeight: number | null;
};

const DEFAULT_VIEWPORT: VisualViewportState = {
  top: 0,
  height: null,
  innerHeight: null,
};

export function useVisualViewport(): VisualViewportState {
  const [viewport, setViewport] = useState<VisualViewportState>(DEFAULT_VIEWPORT);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewport({
          top: window.visualViewport.offsetTop,
          height: window.visualViewport.height,
          innerHeight: window.innerHeight,
        });
      } else {
        setViewport({ top: 0, height: window.innerHeight, innerHeight: window.innerHeight });
      }
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return viewport;
}
