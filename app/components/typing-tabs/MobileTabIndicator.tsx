'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import type { TypingTab } from '@/app/types/typing-tabs';

interface MobileTabIndicatorProps {
  tabs: TypingTab[];
  activeTab: TypingTab;
  onClick: () => void;
}

export default function MobileTabIndicator({ tabs, activeTab, onClick }: MobileTabIndicatorProps) {
  const tabCount = tabs.length;
  const activeIndex = tabs.findIndex(t => t.id === activeTab.id) + 1;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-hover hover:bg-surface transition-colors min-h-[32px]"
      aria-label={`Tab ${activeIndex} of ${tabCount}: ${activeTab.label}`}
    >
      <DocumentTextIcon className="w-4 h-4 text-text-secondary" />
      <span className="text-xs font-medium text-text-secondary truncate max-w-[80px]">
        {activeTab.label}
      </span>
      {tabCount > 1 && (
        <span className="text-xs text-text-tertiary">
          ({activeIndex}/{tabCount})
        </span>
      )}
    </button>
  );
}
