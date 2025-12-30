'use client';

import { useRef, useEffect } from 'react';
import { PlusIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { TypingTab } from '@/app/types/typing-tabs';
import Tab from './Tab';
import { MAX_TABS } from './utils';

interface TabBarProps {
  tabs: TypingTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabCreate: () => void;
  onTabRename: (tabId: string, newLabel: string) => void;
  onManage: () => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabCreate,
  onTabRename,
  onManage,
}: TabBarProps) {
  const canCreateTab = tabs.length < MAX_TABS;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevTabCountRef = useRef(tabs.length);

  // Auto-scroll to end when new tab is added
  useEffect(() => {
    if (tabs.length > prevTabCountRef.current && scrollContainerRef.current) {
      // Smoothly scroll to the far right to show the new tab
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
    prevTabCountRef.current = tabs.length;
  }, [tabs.length]);

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 p-2 bg-surface-hover rounded-t-3xl">
      {/* Scrollable tabs column */}
      <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide min-w-0">
        <div className="flex gap-1 items-center">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => onTabSelect(tab.id)}
              onClose={() => onTabClose(tab.id)}
              onRename={(newLabel) => onTabRename(tab.id, newLabel)}
            />
          ))}
        </div>
      </div>

      {/* Fixed button column */}
      <div className="flex items-center gap-2">
        <button
          onClick={onManage}
          className="flex items-center justify-center p-1.5 md:p-2 rounded-2xl transition-all duration-200 bg-surface-hover hover:bg-primary-500/10 text-text-secondary hover:text-primary-500"
          aria-label="Manage tabs"
          title="Manage all tabs"
        >
          <QueueListIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button
          onClick={onTabCreate}
          disabled={!canCreateTab}
          className={`
            flex items-center justify-center p-1.5 md:p-2 rounded-2xl transition-all duration-200
            ${
    canCreateTab
      ? 'bg-surface-hover hover:bg-primary-500/10 text-text-secondary hover:text-primary-500 cursor-pointer'
      : 'bg-surface text-text-tertiary cursor-not-allowed opacity-50'
    }
          `}
          aria-label="Create new tab"
          title={canCreateTab ? 'Create new tab (Cmd/Ctrl+T)' : `Maximum of ${MAX_TABS} tabs reached`}
        >
          <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
}
