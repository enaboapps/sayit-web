import { useCallback, useEffect, useRef } from 'react';
import { useTypingTabs } from '../typing-tabs/useTypingTabs';

export function useComposerTabs(
  text: string,
  onChange: (text: string) => void,
  enableTabs: boolean,
) {
  const {
    tabs,
    activeTab,
    activeTabId,
    createTab,
    switchTab,
    closeTab,
    closeAllTabs,
    renameTab,
    updateActiveTabText,
  } = useTypingTabs(text);

  const prevTextRef = useRef(text);
  const prevActiveTabIdRef = useRef<string | null>(null);
  const hasProcessedInitialTextRef = useRef(false);
  const hasInitializedActiveTabRef = useRef(false);

  // Sync tabs text with external text prop
  useEffect(() => {
    if (!enableTabs) return;
    if (!hasProcessedInitialTextRef.current) {
      hasProcessedInitialTextRef.current = true;
      prevTextRef.current = text;
      if (!text.trim() && activeTab.text.trim()) {
        onChange(activeTab.text);
        return;
      }
    }
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      if (text !== activeTab.text) {
        updateActiveTabText(text);
      }
    }
  }, [activeTab.text, enableTabs, onChange, text, updateActiveTabText]);

  useEffect(() => {
    if (!enableTabs || !activeTabId) return;
    if (!hasInitializedActiveTabRef.current) {
      hasInitializedActiveTabRef.current = true;
      prevActiveTabIdRef.current = activeTabId;
      return;
    }
    if (prevActiveTabIdRef.current && prevActiveTabIdRef.current !== activeTabId) {
      onChange(activeTab.text);
    }
    prevActiveTabIdRef.current = activeTabId;
  }, [activeTabId, activeTab.text, enableTabs, onChange]);

  const currentText = enableTabs ? activeTab.text : text;

  const handleTextChange = useCallback((value: string) => {
    if (enableTabs) updateActiveTabText(value);
    onChange(value);
  }, [enableTabs, onChange, updateActiveTabText]);

  return {
    currentText,
    handleTextChange,
    tabs,
    activeTab,
    activeTabId,
    createTab,
    switchTab,
    closeTab,
    closeAllTabs,
    renameTab,
    updateActiveTabText,
  };
}
