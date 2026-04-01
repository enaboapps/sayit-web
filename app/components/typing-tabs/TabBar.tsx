'use client';

import { useRef, useEffect } from 'react';
import { PlusIcon, QueueListIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TypingTab } from '@/app/types/typing-tabs';
import Tab from './Tab';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevTabCountRef = useRef(tabs.length);
  const isMobile = useIsMobile();

  // Auto-scroll to end when new tab is added (desktop only)
  useEffect(() => {
    if (!isMobile && tabs.length > prevTabCountRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
    prevTabCountRef.current = tabs.length;
  }, [isMobile, tabs.length]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const actionButtons = (
    <div className="flex items-center gap-2">
      <button
        onClick={onManage}
        className="flex items-center justify-center p-1.5 md:p-2 rounded-2xl transition-all duration-200 bg-surface-hover hover:bg-surface-hover text-text-secondary hover:text-primary-500"
        aria-label="Manage tabs"
        title="Manage all tabs"
      >
        <QueueListIcon className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        onClick={onTabCreate}
        className="flex items-center justify-center p-1.5 md:p-2 rounded-2xl transition-all duration-200 bg-surface-hover hover:bg-surface-hover text-text-secondary hover:text-primary-500 cursor-pointer"
        aria-label="Create new tab"
        title="Create new tab (Cmd/Ctrl+T)"
      >
        <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2 p-2 bg-surface-hover rounded-t-3xl">
        {/* Active tab — full width, tapping label opens list */}
        <button
          onClick={onManage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-primary-500 text-white min-w-0"
          aria-label={`Active tab: ${activeTab?.label ?? 'Tab'}. Tap to manage tabs.`}
        >
          <span className="text-sm font-medium truncate flex-1 text-left">
            {activeTab?.label ?? 'Tab'}
          </span>
          {activeTab && (
            <button
              onClick={(e) => { e.stopPropagation(); onTabClose(activeTab.id); }}
              className="p-0.5 rounded-full shrink-0 hover:bg-white/20 transition-colors"
              aria-label={`Close ${activeTab.label}`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </button>

        {actionButtons}
      </div>
    );
  }

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

      {actionButtons}
    </div>
  );
}
