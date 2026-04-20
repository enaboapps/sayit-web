'use client';

import { useRef, useEffect } from 'react';
import { useMobileBottom } from '@/app/contexts/MobileBottomContext';
import { useKeyboardOpen } from '@/lib/hooks/useKeyboardOpen';
import BottomTabBar from './BottomTabBar';

export default function MobileBottomStack() {
  const { registerDockContainer } = useMobileBottom();
  const keyboardOpen = useKeyboardOpen();
  const stackRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerDockContainer(dockRef.current);
    return () => registerDockContainer(null);
  }, [registerDockContainer]);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || typeof window === 'undefined') return;

    let animationFrameId: number | null = null;

    const updateBottomStackHeight = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const height = stack.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--active-bottom-stack-height', `${height}px`);
        animationFrameId = null;
      });
    };

    updateBottomStackHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateBottomStackHeight);
      resizeObserver.observe(stack);

      return () => {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
        }
        resizeObserver.disconnect();
        document.documentElement.style.removeProperty('--active-bottom-stack-height');
      };
    }

    window.addEventListener('resize', updateBottomStackHeight);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', updateBottomStackHeight);
      document.documentElement.style.removeProperty('--active-bottom-stack-height');
    };
  }, []);

  return (
    <div ref={stackRef} className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex flex-col">
      {/* Dock content slot - portal target */}
      <div ref={dockRef} className="bg-surface" />
      {/* Tab bar — hidden when keyboard is open to maximize content space */}
      {!keyboardOpen && <BottomTabBar />}
    </div>
  );
}
