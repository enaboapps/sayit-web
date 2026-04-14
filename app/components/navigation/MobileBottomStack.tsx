'use client';

import { useRef, useEffect } from 'react';
import { useMobileBottom } from '@/app/contexts/MobileBottomContext';
import BottomTabBar from './BottomTabBar';

export default function MobileBottomStack() {
  const { registerDockContainer } = useMobileBottom();
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerDockContainer(dockRef.current);
    return () => registerDockContainer(null);
  }, [registerDockContainer]);

  return (
    <div className="fixed bottom-keyboard-aware left-0 right-0 z-50 md:hidden flex flex-col">
      {/* Dock content slot - portal target */}
      <div ref={dockRef} className="bg-surface" />
      {/* Tab bar */}
      <div className="mobile-keyboard-hide">
        <BottomTabBar />
      </div>
    </div>
  );
}
