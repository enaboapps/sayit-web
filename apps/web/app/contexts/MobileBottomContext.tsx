'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MobileBottomContextType {
  registerDockContainer: (element: HTMLDivElement | null) => void;
  dockContainer: HTMLDivElement | null;
}

const MobileBottomContext = createContext<MobileBottomContextType | null>(null);

export function MobileBottomProvider({ children }: { children: ReactNode }) {
  const [dockContainer, setDockContainer] = useState<HTMLDivElement | null>(null);

  const value = useMemo(() => ({ dockContainer, registerDockContainer: setDockContainer }), [dockContainer]);

  return (
    <MobileBottomContext.Provider value={value}>
      {children}
    </MobileBottomContext.Provider>
  );
}

export function useMobileBottom() {
  const context = useContext(MobileBottomContext);
  if (!context) {
    throw new Error('useMobileBottom must be used within MobileBottomProvider');
  }
  return context;
}

/** Safe variant — returns null when used outside MobileBottomProvider. */
export function useOptionalMobileBottom() {
  return useContext(MobileBottomContext);
}

// Component to portal dock content into the mobile bottom stack
export function MobileDockPortal({ children }: { children: ReactNode }) {
  const { dockContainer } = useMobileBottom();

  if (!dockContainer) return null;

  return createPortal(children, dockContainer);
}
