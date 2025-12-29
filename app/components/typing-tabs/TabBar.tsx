'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
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
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabCreate,
  onTabRename,
}: TabBarProps) {
  const canCreateTab = tabs.length < MAX_TABS;

  return (
    <div className="flex gap-2 p-2 bg-surface-hover rounded-t-3xl">
      {/* Scrollable tabs container */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
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

      {/* Fixed button - stays visible */}
      <div className="flex-shrink-0">
        <button
          onClick={onTabCreate}
          disabled={!canCreateTab}
          className={`
            flex items-center justify-center p-1.5 md:p-2 rounded-2xl transition-all duration-200
            ${
    canCreateTab
      ? 'bg-surface hover:bg-primary-500/10 text-text-secondary hover:text-primary-500 cursor-pointer'
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
