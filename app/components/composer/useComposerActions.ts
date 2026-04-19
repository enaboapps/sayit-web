import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useDoubleEnter } from '@/lib/hooks/useDoubleEnter';
import { useUndoClear } from '@/lib/hooks/useUndoClear';
import { useLiveTyping } from '@/lib/hooks/useLiveTyping';
import { applyToneTag } from '../typing/ToneSheet';
import type { TonePreset } from '../typing/ToneSheet';
import type { EnterKeyBehavior, ComposerProps } from './types';

interface UseComposerActionsConfig {
  currentText: string;
  activeTabId: string | null;
  enableTabs: boolean;
  onChange: (text: string) => void;
  updateActiveTabText: (text: string) => void;
  switchTab: (tabId: string) => void;
  onSpeak: ComposerProps['onSpeak'];
  onSpeakWithTone?: ComposerProps['onSpeakWithTone'];
  onMessageCompleted?: ComposerProps['onMessageCompleted'];
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  enableLiveTyping: boolean;
}

const DOUBLE_ENTER_ACTION_LABELS: Record<EnterKeyBehavior, string> = {
  newline: 'add a new line',
  speak: 'speak',
  clear: 'clear',
  speakAndClear: 'speak and clear',
};

export function useComposerActions({
  currentText,
  activeTabId,
  enableTabs,
  onChange,
  updateActiveTabText,
  switchTab,
  onSpeak,
  onSpeakWithTone,
  onMessageCompleted,
  inputRef,
  enableLiveTyping,
}: UseComposerActionsConfig) {
  const [isFixingText, setIsFixingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useSettings();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const {
    isSharing: isLiveTypingSharing,
    isCreating: isLiveTypingCreating,
    updateContent: updateLiveTypingContent,
    createSession: createLiveTypingSession,
    endSession: endLiveTypingSession,
    getShareableLink,
  } = useLiveTyping();

  const shareableLink = getShareableLink();

  // Undo clear
  const { clearWithUndo, undo, resetUndo, canUndo, remainingMs: undoRemainingMs, entry } = useUndoClear({
    timeoutMs: 20000,
    onRestore: ({ tabId, text: restoredText }) => {
      if (tabId !== activeTabId && tabId) {
        switchTab(tabId);
        setTimeout(() => {
          updateActiveTabText(restoredText);
          onChange(restoredText);
          inputRef.current?.focus();
        }, 0);
        return;
      }
      updateActiveTabText(restoredText);
      onChange(restoredText);
      inputRef.current?.focus();
    },
  });

  const showUndoHint = canUndo
    && entry?.tabId === (activeTabId || 'default')
    && currentText.trim().length === 0;

  const clearTextWithUndo = useCallback((textToClear: string, source: 'clear' | 'skip' = 'clear') => {
    if (source === 'clear' && textToClear.trim()) {
      onMessageCompleted?.({
        text: textToClear,
        source: 'clear',
        tabId: activeTabId,
      });
    }
    clearWithUndo({
      tabId: activeTabId || 'default',
      text: textToClear,
      onClear: () => {
        if (enableTabs) updateActiveTabText('');
        onChange('');
        setError(null);
        inputRef.current?.focus();
      },
    });
  }, [activeTabId, clearWithUndo, enableTabs, onChange, onMessageCompleted, updateActiveTabText, inputRef]);

  const handleClear = useCallback(() => {
    clearTextWithUndo(currentText, 'clear');
  }, [clearTextWithUndo, currentText]);

  // Reset undo when user starts typing
  useEffect(() => {
    if (!canUndo) return;
    if (currentText.trim().length > 0) resetUndo();
  }, [canUndo, currentText, resetUndo]);

  // Enter key actions
  const runEnterAction = useCallback((action: EnterKeyBehavior) => {
    switch (action) {
    case 'speak':
      if (currentText.trim()) onSpeak('speak');
      break;
    case 'clear':
      clearTextWithUndo(currentText, 'clear');
      break;
    case 'speakAndClear':
      if (currentText.trim()) {
        onSpeak('speakAndClear');
        const textSnapshot = currentText;
        setTimeout(() => clearTextWithUndo(textSnapshot, 'skip'), 100);
      }
      break;
    case 'newline':
    default:
      onChange(currentText + '\n');
      break;
    }
  }, [clearTextWithUndo, currentText, onChange, onSpeak]);

  const { handleEnter, isPending: isDoubleEnterPending, remainingMs: doubleEnterRemainingMs } = useDoubleEnter({
    enabled: settings.doubleEnterEnabled,
    timeoutMs: settings.doubleEnterTimeoutMs,
    onSingleEnter: () => runEnterAction(settings.enterKeyBehavior),
    onDoubleEnter: () => runEnterAction(settings.doubleEnterAction),
  });

  const showDoubleEnterHint = settings.doubleEnterEnabled && isDoubleEnterPending;
  const doubleEnterActionLabel = DOUBLE_ENTER_ACTION_LABELS[settings.doubleEnterAction];

  // Tone
  const handleToneSelected = useCallback((tone: TonePreset) => {
    if (!currentText.trim()) return;
    const options = tone.v3Only ? { modelId: 'eleven_v3' } : undefined;
    onSpeakWithTone?.(applyToneTag(tone, currentText), options);
  }, [currentText, onSpeakWithTone]);

  // Error auto-dismiss
  useEffect(() => {
    if (!error) return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error]);

  // Live typing content sync
  useEffect(() => {
    if (enableLiveTyping && user && isLiveTypingSharing) {
      updateLiveTypingContent(currentText);
    }
  }, [currentText, enableLiveTyping, isLiveTypingSharing, updateLiveTypingContent, user]);

  const handleStartLiveTyping = useCallback(async () => {
    const created = await createLiveTypingSession();
    if (created) {
      updateLiveTypingContent(currentText);
    }
  }, [createLiveTypingSession, currentText, updateLiveTypingContent]);

  // Fix text
  const handleFixText = useCallback(async () => {
    if (!currentText.trim() || isFixingText) return;
    if (!isOnline) {
      setError('Fix Text is unavailable offline.');
      return;
    }
    setIsFixingText(true);
    setError(null);
    try {
      const response = await fetch('/api/fix-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.text && data.text !== currentText) {
        if (enableTabs) updateActiveTabText(data.text);
        onChange(data.text);
      }
    } catch (err) {
      console.error('Error fixing text:', err);
      setError(err instanceof Error ? err.message : 'Failed to fix text');
    } finally {
      setIsFixingText(false);
    }
  }, [currentText, enableTabs, isFixingText, isOnline, onChange, updateActiveTabText]);

  // Key down handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
      if (handleEnter()) e.preventDefault();
    },
    [handleEnter]
  );

  const isLiveTypingButtonActive = isLiveTypingSharing || false;

  return {
    // clear/undo
    handleClear,
    showUndoHint,
    undoRemainingMs,
    undo,
    canUndo,
    resetUndo,
    // double-enter
    showDoubleEnterHint,
    doubleEnterActionLabel,
    doubleEnterRemainingMs,
    // fix text
    handleFixText,
    isFixingText,
    // error
    error,
    setError,
    // tone
    handleToneSelected,
    // keyboard
    handleKeyDown,
    // live typing
    isLiveTypingButtonActive,
    isLiveTypingSharing,
    isLiveTypingCreating,
    shareableLink,
    handleStartLiveTyping,
    endLiveTypingSession,
    // context
    isOnline,
    user,
  };
}
