'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { SparklesIcon, XMarkIcon, ArrowPathIcon, ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLiveTyping } from '@/lib/hooks/useLiveTyping';
import { useDoubleEnter } from '@/lib/hooks/useDoubleEnter';
import { useUndoClear } from '@/lib/hooks/useUndoClear';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useTypingTabs } from './typing-tabs/useTypingTabs';
import SpeakButton from './typing/SpeakButton';
import { applyToneTag } from './typing/ToneSheet';
import type { TonePreset } from './typing/ToneSheet';
import SubscriptionWrapper from './SubscriptionWrapper';
import ReplySuggestions from './typing/ReplySuggestions';
import ActionPromptBanner from './typing/ActionPromptBanner';
import MobileTabList from './typing-tabs/MobileTabList';
import TabBar from './typing-tabs/TabBar';
import TabManagementDialog from './typing-tabs/TabManagementDialog';
import LiveTypingBottomSheet from './live-typing/LiveTypingBottomSheet';
import LiveTypingLinkModal from './live-typing/LiveTypingLinkModal';
import { MobileDockPortal, useOptionalMobileBottom } from '../contexts/MobileBottomContext';

interface ReplySuggestionsConfig {
  history: string[];
  enabled: boolean;
  onSelect: (suggestion: string) => void;
}

interface ComposerProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: (source?: 'speak' | 'speakAndClear') => void;
  onSpeakWithTone?: (toneTag: string, options?: { modelId?: string }) => void;
  onMessageCompleted?: (payload: { text: string; source: 'clear'; tabId?: string | null }) => void;
  onStop?: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
  enableTabs?: boolean;
  enableLiveTyping?: boolean;
  enableFixText?: boolean;
  enableToneControl?: boolean;
  onAddAsPhrase?: (text: string) => void;
  replySuggestions?: ReplySuggestionsConfig;
}

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

type TextareaScrollIntent = {
  selectionStart: number;
  selectionEnd: number;
  shouldScrollToEnd: boolean;
};

type TextareaScrollSnapshot = {
  selectionStart: number;
  selectionEnd: number;
  wasAtEnd: boolean;
  wasNearBottom: boolean;
};

export default function Composer({
  text,
  onChange,
  onSpeak,
  onSpeakWithTone,
  onMessageCompleted,
  onStop,
  isSpeaking = false,
  isAvailable = true,
  className = '',
  enableTabs = false,
  enableLiveTyping = false,
  enableFixText = false,
  enableToneControl = false,
  onAddAsPhrase,
  replySuggestions,
}: ComposerProps) {
  const [isFixingText, setIsFixingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTabList, setShowTabList] = useState(false);
  const [showTabManagement, setShowTabManagement] = useState(false);
  const [showLiveTypingSheet, setShowLiveTypingSheet] = useState(false);
  const [showLiveTypingModal, setShowLiveTypingModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingTextareaScrollRef = useRef<TextareaScrollIntent | null>(null);
  const previousRenderedTextRef = useRef('');
  const lastTextareaSnapshotRef = useRef<TextareaScrollSnapshot | null>(null);
  const prevTextRef = useRef(text);
  const prevActiveTabIdRef = useRef<string | null>(null);
  const hasProcessedInitialTextRef = useRef(false);
  const hasInitializedActiveTabRef = useRef(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useSettings();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const isMobile = useIsMobile();
  const mobileBottom = useOptionalMobileBottom();
  const shouldPortalToolbar = isMobile && !!mobileBottom?.dockContainer;
  const {
    isSharing: isLiveTypingSharing,
    isCreating: isLiveTypingCreating,
    updateContent: updateLiveTypingContent,
    createSession: createLiveTypingSession,
    endSession: endLiveTypingSession,
    getShareableLink,
  } = useLiveTyping();

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

  const textSizePx = settings.textSize;
  const currentText = enableTabs ? activeTab.text : text;
  const shareableLink = getShareableLink();
  const isLiveTypingButtonActive = isLiveTypingSharing || showLiveTypingModal || showLiveTypingSheet;

  const captureTextareaSnapshot = useCallback((value?: string) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const currentValue = value ?? textarea.value;
    const selectionStart = textarea.selectionStart ?? currentValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const distanceFromBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight;
    const wasNearBottom = distanceFromBottom <= 24;

    lastTextareaSnapshotRef.current = {
      selectionStart,
      selectionEnd,
      wasAtEnd: selectionStart >= currentValue.length,
      wasNearBottom,
    };
  }, []);

  const captureTextareaScrollIntent = useCallback((nextValue: string) => {
    const textarea = inputRef.current;
    if (!textarea || document.activeElement !== textarea) {
      pendingTextareaScrollRef.current = null;
      return;
    }

    const selectionStart = textarea.selectionStart ?? nextValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const distanceFromBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight;
    const isNearBottom = distanceFromBottom <= 24;
    const isCaretAtEnd = selectionStart >= nextValue.length;
    const previousSnapshot = lastTextareaSnapshotRef.current;
    const wasEditingEarlier = !!previousSnapshot
      && !previousSnapshot.wasAtEnd
      && !previousSnapshot.wasNearBottom;
    const shouldScrollToEnd = !wasEditingEarlier
      && (isCaretAtEnd || isNearBottom || !!previousSnapshot?.wasAtEnd || !!previousSnapshot?.wasNearBottom);

    pendingTextareaScrollRef.current = {
      selectionStart,
      selectionEnd,
      shouldScrollToEnd,
    };
    lastTextareaSnapshotRef.current = {
      selectionStart,
      selectionEnd,
      wasAtEnd: isCaretAtEnd,
      wasNearBottom: isNearBottom,
    };
  }, []);

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
  }, [activeTabId, clearWithUndo, enableTabs, onChange, onMessageCompleted, updateActiveTabText]);

  const handleClear = useCallback(() => {
    clearTextWithUndo(currentText, 'clear');
  }, [clearTextWithUndo, currentText]);

  useEffect(() => {
    if (!canUndo) return;
    if (currentText.trim().length > 0) resetUndo();
  }, [canUndo, currentText, resetUndo]);

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

  const { handleEnter, isPending, remainingMs } = useDoubleEnter({
    enabled: settings.doubleEnterEnabled,
    timeoutMs: settings.doubleEnterTimeoutMs,
    onSingleEnter: () => runEnterAction(settings.enterKeyBehavior),
    onDoubleEnter: () => runEnterAction(settings.doubleEnterAction),
  });

  const showDoubleEnterHint = settings.doubleEnterEnabled && isPending;
  const doubleEnterActionLabel: Record<EnterKeyBehavior, string> = {
    newline: 'add a new line',
    speak: 'speak',
    clear: 'clear',
    speakAndClear: 'speak and clear',
  };

  const handleToneSelected = useCallback((tone: TonePreset) => {
    if (!currentText.trim()) return;
    const options = tone.v3Only ? { modelId: 'eleven_v3' } : undefined;
    onSpeakWithTone?.(applyToneTag(tone, currentText), options);
  }, [currentText, onSpeakWithTone]);

  // Auto-dismiss errors after 4 s; also dismiss when user starts typing
  useEffect(() => {
    if (!error) return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
      if (handleEnter()) e.preventDefault();
    },
    [handleEnter]
  );

  const handleFixText = async () => {
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
  };

  const handleShare = async () => {
    if (!isOnline) {
      setError('Live Typing is unavailable offline.');
      return;
    }

    if (isMobile) {
      setShowLiveTypingSheet(true);
      return;
    }

    setShowLiveTypingModal(true);
  };

  const handleTextChange = (value: string) => {
    captureTextareaScrollIntent(value);
    if (canUndo && value.trim().length > 0) resetUndo();
    if (error) setError(null);
    if (enableTabs) updateActiveTabText(value);
    onChange(value);
  };

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) {
      previousRenderedTextRef.current = currentText;
      pendingTextareaScrollRef.current = null;
      return;
    }

    const pending = pendingTextareaScrollRef.current;
    const previousText = previousRenderedTextRef.current;
    const snapshot = lastTextareaSnapshotRef.current;
    const wasExternalAppend = currentText.length > previousText.length
      && !!snapshot
      && (snapshot.wasAtEnd || snapshot.wasNearBottom);

    if (pending && document.activeElement === textarea) {
      const selectionStart = Math.min(pending.selectionStart, currentText.length);
      const selectionEnd = Math.min(pending.selectionEnd, currentText.length);
      textarea.setSelectionRange(selectionStart, selectionEnd);

      if (pending.shouldScrollToEnd) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    } else if (wasExternalAppend) {
      textarea.setSelectionRange(currentText.length, currentText.length);
      textarea.scrollTop = textarea.scrollHeight;
    }

    previousRenderedTextRef.current = currentText;
    pendingTextareaScrollRef.current = null;
    captureTextareaSnapshot(currentText);
  }, [captureTextareaSnapshot, currentText]);

  const handleTabSelect = useCallback((tabId: string) => {
    switchTab(tabId);
    pendingTextareaScrollRef.current = {
      selectionStart: Number.MAX_SAFE_INTEGER,
      selectionEnd: Number.MAX_SAFE_INTEGER,
      shouldScrollToEnd: true,
    };
  }, [switchTab]);

  const toolbarContent = (
    <div className={`flex items-center gap-3 px-4 pt-2 ${shouldPortalToolbar ? 'pb-2' : 'pb-4'}`}>
      {/* Secondary tools */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleClear}
          disabled={!currentText.trim()}
          className="p-2.5 rounded-xl bg-surface-hover text-text-secondary hover:text-red-500 hover:bg-status-error transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Clear"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {enableFixText && (
          !isOnline ? (
            <button type="button" disabled className="p-2.5 rounded-xl bg-surface-hover text-text-tertiary opacity-40 cursor-not-allowed">
              <SparklesIcon className="w-5 h-5" />
            </button>
          ) : (
            <SubscriptionWrapper
              fallback={
                <button onClick={() => window.location.href = '/pricing'} className="p-2.5 rounded-xl bg-surface-hover text-text-secondary hover:text-amber-500 hover:bg-status-warning transition-all">
                  <SparklesIcon className="w-5 h-5" />
                </button>
              }
            >
              <button
                onClick={handleFixText}
                disabled={!currentText.trim() || isFixingText}
                className={`p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isFixingText ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-surface-hover text-text-secondary hover:text-purple-500 hover:bg-status-purple'
                }`}
                aria-label="Fix Text"
              >
                {isFixingText ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
              </button>
            </SubscriptionWrapper>
          )
        )}

        {enableLiveTyping && user && (
          <button
            onClick={handleShare}
            disabled={!isOnline}
            className={`p-2.5 rounded-xl transition-all ${
              !isOnline ? 'bg-surface-hover text-text-tertiary opacity-40'
                : isLiveTypingButtonActive ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-surface-hover text-text-secondary hover:text-green-500 hover:bg-status-success'
            }`}
            aria-label={isLiveTypingButtonActive ? 'Live Typing Active' : 'Live Typing'}
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        )}

        {onAddAsPhrase && (
          <button
            onClick={() => onAddAsPhrase(currentText)}
            disabled={!currentText.trim()}
            className="p-2.5 rounded-xl bg-surface-hover text-text-secondary hover:text-primary-500 hover:bg-surface-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Save as phrase"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Speak — the big action */}
      <SpeakButton
        onSpeak={() => onSpeak('speak')}
        onStop={onStop}
        onSelectTone={handleToneSelected}
        isSpeaking={isSpeaking}
        disabled={!isAvailable || !currentText.trim()}
        enableToneControl={enableToneControl}
      />
    </div>
  );

  return (
    <>
      <div className={`flex flex-col flex-1 min-h-0 h-full overflow-hidden ${className}`}>
        {/* Tab bar */}
        {enableTabs && (
          <div className="sticky top-0 z-10 shrink-0">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={handleTabSelect}
              onTabClose={closeTab}
              onTabCreate={createTab}
              onTabRename={renameTab}
              onManage={() => isMobile ? setShowTabList(true) : setShowTabManagement(true)}
            />
          </div>
        )}

        {/* Textarea — full bleed, fills the screen */}
        <div className="flex-1 min-h-0 overflow-hidden md:min-h-[120px]">
          <textarea
            ref={inputRef}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            onSelect={() => captureTextareaSnapshot()}
            onClick={() => captureTextareaSnapshot()}
            onKeyUp={() => captureTextareaSnapshot()}
            onBlur={() => captureTextareaSnapshot()}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to say?"
            className="w-full h-full overflow-y-auto bg-transparent text-foreground placeholder:text-text-tertiary px-6 py-5 resize-none focus:outline-none"
            style={{ fontSize: `${textSizePx}px`, lineHeight: '1.6' }}
          />
        </div>

        {/* Reply suggestions — inline on desktop/offline, portaled on mobile */}
        {replySuggestions && !shouldPortalToolbar && (
          <div className="shrink-0 px-4 pb-2">
            <ReplySuggestions
              history={replySuggestions.history}
              enabled={replySuggestions.enabled}
              onSelectSuggestion={replySuggestions.onSelect}
              variant="inline"
            />
          </div>
        )}

        {/* Undo / double-enter banners — inline only when not portaled */}
        {(showUndoHint || showDoubleEnterHint) && !shouldPortalToolbar && (
          <div className="shrink-0 px-4 pb-2">
            {showUndoHint ? (
              <ActionPromptBanner variant="undo" remainingMs={undoRemainingMs} onUndo={undo} />
            ) : (
              <ActionPromptBanner variant="doubleEnter" actionLabel={doubleEnterActionLabel[settings.doubleEnterAction]} remainingMs={remainingMs} />
            )}
          </div>
        )}

        {/* Error — inline only when not portaled */}
        {error && !shouldPortalToolbar && (
          <div className="shrink-0 px-6 pb-2">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Toolbar — inline on desktop/offline, portaled on mobile */}
        {!shouldPortalToolbar && (
          <div className="shrink-0">
            {toolbarContent}
          </div>
        )}
      </div>

      {/* Portal toolbar + suggestions into the mobile dock so it sits above the keyboard */}
      {shouldPortalToolbar && (
        <MobileDockPortal>
          <div className="border-t border-border bg-surface">
            {replySuggestions && (
              <div className="px-4 pt-2">
                <ReplySuggestions
                  history={replySuggestions.history}
                  enabled={replySuggestions.enabled}
                  onSelectSuggestion={replySuggestions.onSelect}
                  variant="inline"
                />
              </div>
            )}
            {(showUndoHint || showDoubleEnterHint || error) ? (
              <div className="px-4 pt-2 pb-2">
                {error ? (
                  <span className="text-sm text-red-400">{error}</span>
                ) : showUndoHint ? (
                  <ActionPromptBanner variant="undo" remainingMs={undoRemainingMs} onUndo={undo} />
                ) : (
                  <ActionPromptBanner variant="doubleEnter" actionLabel={doubleEnterActionLabel[settings.doubleEnterAction]} remainingMs={remainingMs} />
                )}
              </div>
            ) : (
              toolbarContent
            )}
          </div>
        </MobileDockPortal>
      )}

      {/* Tab management sheets/dialogs */}
      {enableTabs && (
        <MobileTabList
          isOpen={showTabList}
          onClose={() => setShowTabList(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={(tabId) => { handleTabSelect(tabId); const tab = tabs.find(t => t.id === tabId); if (tab) onChange(tab.text); }}
          onCloseTab={(tabId) => { closeTab(tabId); const remaining = tabs.filter(t => t.id !== tabId); if (remaining.length > 0) onChange(remaining[0].text); }}
          onCloseAllTabs={() => { closeAllTabs(); onChange(''); }}
          onCreateTab={() => { createTab(); onChange(''); }}
          onRenameTab={renameTab}
        />
      )}
      {enableTabs && (
        <TabManagementDialog
          isOpen={showTabManagement}
          onClose={() => setShowTabManagement(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onCloseAllTabs={() => { closeAllTabs(); onChange(''); }}
          onRenameTab={renameTab}
        />
      )}

      {enableLiveTyping && user && (
        <>
          <LiveTypingBottomSheet
            isOpen={showLiveTypingSheet}
            onClose={() => setShowLiveTypingSheet(false)}
            isSharing={isLiveTypingSharing}
            isCreating={isLiveTypingCreating}
            shareableLink={shareableLink}
            onStartSharing={handleStartLiveTyping}
            onEndSession={async () => { await endLiveTypingSession(); }}
          />
          {showLiveTypingModal && !isMobile && (
            <LiveTypingLinkModal
              shareableLink={shareableLink}
              isCreating={isLiveTypingCreating}
              onStartSharing={handleStartLiveTyping}
              onClose={() => setShowLiveTypingModal(false)}
              onEndSession={async () => {
                await endLiveTypingSession();
                setShowLiveTypingModal(false);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
