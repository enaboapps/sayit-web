'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { TypingTab } from '@/app/types/typing-tabs';

interface TabManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TypingTab[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newLabel: string) => void;
}

export default function TabManagementDialog({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onRenameTab,
}: TabManagementDialogProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Reset editing state if tab being edited is closed
  useEffect(() => {
    if (editingTabId && !tabs.find(t => t.id === editingTabId)) {
      setEditingTabId(null);
      setEditLabel('');
    }
  }, [tabs, editingTabId]);

  const handleTabClick = (tabId: string) => {
    onSwitchTab(tabId);
    onClose();
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onCloseTab(tabId);
  };

  const handleStartEdit = (e: React.MouseEvent, tab: TypingTab) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditLabel(tab.label);
  };

  const handleSaveEdit = () => {
    if (!isCanceling && editLabel.trim() && editingTabId) {
      onRenameTab(editingTabId, editLabel);
    }
    setEditingTabId(null);
    setEditLabel('');
    setIsCanceling(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsCanceling(true);
      setEditingTabId(null);
      setEditLabel('');
    }
  };

  const handleCloseAll = () => {
    setShowCloseAllConfirm(true);
  };

  const handleConfirmCloseAll = () => {
    tabs.forEach(tab => {
      if (tab.id !== activeTabId) {
        onCloseTab(tab.id);
      }
    });
    setShowCloseAllConfirm(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop with fade animation */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-overlay" />
        </Transition.Child>

        {/* Dialog panel with scale animation */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ backgroundColor: '#242424' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-foreground">
                    Manage Tabs
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-surface-hover transition-colors"
                    aria-label="Close dialog"
                  >
                    <XMarkIcon className="h-6 w-6 text-text-secondary" />
                  </button>
                </div>

                {/* Scrollable tab list */}
                <div className="overflow-y-auto max-h-[50vh] mb-4 space-y-2">
                  {tabs.map(tab => {
                    const isActive = tab.id === activeTabId;
                    const isEditing = editingTabId === tab.id;

                    return (
                      <div
                        key={tab.id}
                        className={`
                          border-2 rounded-2xl p-4 cursor-pointer transition-all
                          ${isActive
                        ? 'border-primary-500 bg-surface-hover shadow-lg'
                        : 'border-border hover:border-primary-300 hover:bg-surface-hover'
                      }
                        `}
                        onClick={() => !isEditing && handleTabClick(tab.id)}
                      >
                        {/* Header: Label + Active Badge + Actions */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isEditing ? (
                              <input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent outline-none border-b border-current text-foreground"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                maxLength={20}
                              />
                            ) : (
                              <>
                                <span className="font-medium text-foreground truncate">
                                  {tab.label}
                                </span>
                                {isActive && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs flex-shrink-0">
                                    Active
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => handleStartEdit(e, tab)}
                              className="p-1.5 rounded-full hover:bg-surface-hover text-text-secondary hover:text-foreground transition-colors"
                              aria-label={`Rename ${tab.label}`}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleCloseTab(e, tab.id)}
                              className="p-1.5 rounded-full hover:bg-status-error text-text-secondary hover:text-red-500 transition-colors"
                              aria-label={`Close ${tab.label}`}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content preview */}
                        <p className="text-sm text-text-secondary truncate">
                          {tab.text.slice(0, 100) || '(Empty)'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Close All button (only if more than 1 tab) */}
                {tabs.length > 1 && (
                  <button
                    onClick={handleCloseAll}
                    className="w-full h-12 rounded-full bg-status-error hover:bg-red-900 text-red-500 hover:text-red-400 border-2 border-red-900 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span>Close All (Keep Active)</span>
                  </button>
                )}

                {/* Confirmation overlay */}
                {showCloseAllConfirm && (
                  <div className="absolute inset-0 bg-overlay flex items-center justify-center rounded-2xl z-10">
                    <div className="bg-surface p-6 rounded-2xl shadow-2xl max-w-sm mx-4">
                      <h4 className="text-lg font-bold text-foreground mb-2">
                        Close All Other Tabs?
                      </h4>
                      <p className="text-text-secondary mb-4">
                        This will close {tabs.length - 1} tab{tabs.length - 1 !== 1 ? 's' : ''} and keep only the active tab.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleConfirmCloseAll}
                          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowCloseAllConfirm(false)}
                          className="flex-1 px-4 py-2 bg-surface-hover hover:bg-background text-foreground rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
