'use client';

import { useState } from 'react';
import { PlusIcon, XMarkIcon, PencilIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';
import type { TypingTab } from '@/app/types/typing-tabs';

interface TabManagementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TypingTab[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllTabs: () => void;
  onCreateTab: () => void;
  onRenameTab: (tabId: string, newLabel: string) => void;
}

export default function TabManagementSheet({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onCloseAllTabs,
  onCreateTab,
  onRenameTab,
}: TabManagementSheetProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleStartEditing = (tab: TypingTab) => {
    setEditingTabId(tab.id);
    setEditLabel(tab.label);
  };

  const handleSaveEdit = (tabId: string) => {
    if (editLabel.trim()) {
      onRenameTab(tabId, editLabel.trim());
    }
    setEditingTabId(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingTabId(null);
    setEditLabel('');
  };

  const handleSelectTab = (tabId: string) => {
    onSwitchTab(tabId);
    onClose();
  };

  const handleCreateTab = () => {
    onCreateTab();
    onClose();
  };

  const handleCloseAll = () => {
    onCloseAllTabs();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Messages"
      snapPoints={[50, 80]}
      initialSnap={0}
    >
      <div className="p-2">
        {/* Action buttons row */}
        <div className="flex gap-2 mb-3">
          {/* Add new tab button */}
          <button
            onClick={handleCreateTab}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary-500 flex items-center justify-center gap-2 text-text-secondary hover:text-primary-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">New</span>
          </button>

          {/* Close all tabs button - only show if more than 1 tab */}
          {tabs.length > 1 && (
            <button
              onClick={handleCloseAll}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 text-white transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
              <span className="font-medium">Close All</span>
            </button>
          )}
        </div>

        {/* Tab list */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                tab.id === activeTabId
                  ? 'bg-primary-500/20 border border-primary-500'
                  : 'bg-surface-hover hover:bg-surface'
              }`}
            >
              {editingTabId === tab.id ? (
                /* Editing mode */
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(tab.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={20}
                  />
                  <button
                    onClick={() => handleSaveEdit(tab.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-green-500 text-white"
                    aria-label="Save"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-secondary"
                    aria-label="Cancel"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                /* Normal mode */
                <>
                  <button
                    onClick={() => handleSelectTab(tab.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-foreground truncate">
                      {tab.label}
                    </div>
                    {tab.text && (
                      <div className="text-xs text-text-tertiary truncate mt-0.5">
                        {tab.text.slice(0, 50)}{tab.text.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEditing(tab)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
                    aria-label={`Rename ${tab.label}`}
                  >
                    <PencilIcon className="w-4 h-4 text-text-secondary" />
                  </button>

                  {tabs.length > 1 && (
                    <button
                      onClick={() => onCloseTab(tab.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-status-error transition-colors"
                      aria-label={`Close ${tab.label}`}
                    >
                      <XMarkIcon className="w-4 h-4 text-text-secondary hover:text-red-500" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
