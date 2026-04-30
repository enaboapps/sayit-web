'use client';

import type { ReactNode } from 'react';
import { MobileDockPortal } from '../../contexts/MobileBottomContext';

interface ComposerFooterProps {
  shouldPortal: boolean;
  children: ReactNode;
}

export default function ComposerFooter({ shouldPortal, children }: ComposerFooterProps) {
  if (shouldPortal) {
    return (
      <MobileDockPortal>
        <div className="border-t border-border bg-surface">
          {children}
        </div>
      </MobileDockPortal>
    );
  }

  return (
    <div className="shrink-0">
      {children}
    </div>
  );
}
