import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { TypingTab, TypingTabsState } from '@/app/types/typing-tabs';
import { createDefaultTab, validateTabLabel, generateLabelFromText, MAX_TABS } from './utils';

const STORAGE_KEY = 'typingTabs';
const DEBOUNCE_DELAY = 300;

export function useTypingTabs(initialText?: string) {
  const { uiPreferences, updateUIPreference } = useSettings();
  const { user } = useAuth();
  const updateSettingsMutation = useMutation(api.userSettings.updateSettings);
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tabs state
  const [tabsState, setTabsState] = useState<TypingTabsState>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as TypingTabsState;
          if (parsed.tabs.length > 0) {
            // Migration: Add isCustomLabel field to existing tabs
            const migratedTabs = parsed.tabs.map(tab => ({
              ...tab,
              isCustomLabel: tab.isCustomLabel ?? false,
            }));
            return {
              ...parsed,
              tabs: migratedTabs,
            };
          }
        } catch (error) {
          console.error('Failed to parse stored tabs:', error);
        }
      }
    }

    // Migration: If no tabs exist but initialText exists, create first tab with that text
    const firstTab = createDefaultTab(1, initialText || '');
    return {
      tabs: [firstTab],
      activeTabId: firstTab.id,
      nextTabNumber: 2,
    };
  });

  // Get active tab
  const activeTab = tabsState.tabs.find(tab => tab.id === tabsState.activeTabId) || tabsState.tabs[0];

  // Auto-create new empty tab on mount if active tab has text
  const hasAutoCreated = useRef(false);
  useEffect(() => {
    // Only run once on mount
    if (hasAutoCreated.current) return;
    hasAutoCreated.current = true;

    // Check if active tab has text and we're not at max tabs
    if (activeTab.text.trim().length > 0 && tabsState.tabs.length < MAX_TABS) {
      const newTab = createDefaultTab(tabsState.nextTabNumber);
      setTabsState(prev => ({
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
        nextTabNumber: prev.nextTabNumber + 1,
      }));
    }
  }, [activeTab.text, tabsState.tabs.length, tabsState.nextTabNumber]);

  // Persist tabs to localStorage and Convex (debounced)
  const persistTabs = useCallback((state: TypingTabsState) => {
    // Clear existing timeout
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    // Debounce the persistence
    persistTimeoutRef.current = setTimeout(() => {
      // Save to localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      // Sync to Convex for authenticated users
      if (user) {
        updateSettingsMutation({
          typingTabs: JSON.stringify(state),
          lastSyncedAt: Date.now(),
        }).catch(error => {
          console.error('Failed to sync tabs to Convex:', error);
        });
      }
    }, DEBOUNCE_DELAY);
  }, [user, updateSettingsMutation]);

  // Sync active tab ID to UIPreferences
  useEffect(() => {
    if (uiPreferences.activeTypingTabId !== tabsState.activeTabId) {
      updateUIPreference('activeTypingTabId', tabsState.activeTabId);
    }
  }, [tabsState.activeTabId, uiPreferences.activeTypingTabId, updateUIPreference]);

  // Persist tabs whenever they change
  useEffect(() => {
    persistTabs(tabsState);
  }, [tabsState, persistTabs]);

  // Create a new tab
  const createTab = useCallback(() => {
    if (tabsState.tabs.length >= MAX_TABS) {
      alert(`Maximum of ${MAX_TABS} tabs reached`);
      return;
    }

    const newTab = createDefaultTab(tabsState.nextTabNumber);
    setTabsState(prev => ({
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
      nextTabNumber: prev.nextTabNumber + 1,
    }));
  }, [tabsState.tabs.length, tabsState.nextTabNumber]);

  // Switch to a different tab
  const switchTab = useCallback((tabId: string) => {
    setTabsState(prev => ({
      ...prev,
      activeTabId: tabId,
    }));
  }, []);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabsState(prev => {
      // Special handling for last tab: create new empty tab instead of preventing close
      if (prev.tabs.length === 1) {
        const newTab = createDefaultTab(prev.nextTabNumber);
        return {
          tabs: [...prev.tabs, newTab],
          activeTabId: newTab.id,
          nextTabNumber: prev.nextTabNumber + 1,
        };
      }

      const tabIndex = prev.tabs.findIndex(t => t.id === tabId);
      const newTabs = prev.tabs.filter(t => t.id !== tabId);

      // If closing the active tab, switch to an adjacent one
      let newActiveTabId = prev.activeTabId;
      if (prev.activeTabId === tabId) {
        // Try to switch to the tab to the right, or left if this was the last tab
        const nextIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveTabId = newTabs[nextIndex].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
        nextTabNumber: prev.nextTabNumber,
      };
    });
  }, []);

  // Rename a tab
  const renameTab = useCallback((tabId: string, newLabel: string) => {
    const validated = validateTabLabel(newLabel);
    setTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, label: validated, isCustomLabel: true, lastModified: Date.now() }
          : tab
      ),
    }));
  }, []);

  // Update the text of the active tab
  const updateActiveTabText = useCallback((text: string) => {
    setTabsState(prev => {
      const activeTabIndex = prev.tabs.findIndex(t => t.id === prev.activeTabId);
      const activeTab = prev.tabs[activeTabIndex];

      if (!activeTab) return prev;

      // Auto-update label from text if user hasn't manually renamed the tab
      const newLabel = activeTab.isCustomLabel
        ? activeTab.label
        : generateLabelFromText(text, activeTabIndex + 1);

      return {
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === prev.activeTabId
            ? { ...tab, text, label: newLabel, lastModified: Date.now() }
            : tab
        ),
      };
    });
  }, []);

  // Switch to tab by index (for keyboard shortcuts)
  const switchToTabByIndex = useCallback((index: number) => {
    if (index >= 0 && index < tabsState.tabs.length) {
      switchTab(tabsState.tabs[index].id);
    }
  }, [tabsState.tabs, switchTab]);

  // Switch to previous tab
  const switchToPreviousTab = useCallback(() => {
    const currentIndex = tabsState.tabs.findIndex(t => t.id === tabsState.activeTabId);
    if (currentIndex > 0) {
      switchTab(tabsState.tabs[currentIndex - 1].id);
    }
  }, [tabsState.tabs, tabsState.activeTabId, switchTab]);

  // Switch to next tab
  const switchToNextTab = useCallback(() => {
    const currentIndex = tabsState.tabs.findIndex(t => t.id === tabsState.activeTabId);
    if (currentIndex < tabsState.tabs.length - 1) {
      switchTab(tabsState.tabs[currentIndex + 1].id);
    }
  }, [tabsState.tabs, tabsState.activeTabId, switchTab]);

  return {
    tabs: tabsState.tabs,
    activeTab,
    activeTabId: tabsState.activeTabId,
    createTab,
    switchTab,
    closeTab,
    renameTab,
    updateActiveTabText,
    switchToTabByIndex,
    switchToPreviousTab,
    switchToNextTab,
  };
}
