'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
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

interface ReplySuggestionsConfig {
  history: string[];
  enabled: boolean;
  onSelect: (suggestion: string) => void;
}

interface ComposerProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: (source?: 'speak' | 'speakAndClear') => void;
  onSpeakWithTone?: (toneTag: string) => void;
  onMessageCompleted?: (payload: { text: string; source: 'clear'; tabId?: string | null }) => void;
  onStop?: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
  enableTabs?: boolean;
  enableLiveTyping?: boolean;
  enableFixText?: boolean;
  enableToneControl?: boolean;
  replySuggestions?: ReplySuggestionsConfig;
}

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

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
  replySuggestions,
}: ComposerProps) {
  const [isFixingText, setIsFixingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showTabList, setShowTabList] = useState(false);
  const [showTabManagement, setShowTabManagement] = useState(false);
  const [showLiveTypingSheet, setShowLiveTypingSheet] = useState(false);
  const [showLiveTypingModal, setShowLiveTypingModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const expandedRef = useRef<HTMLTextAreaElement>(null);
  const prevTextRef = useRef(text);
  const prevActiveTabIdRef = useRef<string | null>(null);
  const hasProcessedInitialTextRef = useRef(false);
  const hasInitializedActiveTabRef = useRef(false);

  const { settings } = useSettings();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const isMobile = useIsMobile();

  const {
    isSharing,
    isCreating,
    updateContent,
    createSession,
    endSession,
    getShareableLink,
  } = useLiveTyping();
  const shareableLink = getShareableLink();

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
    onSpeakWithTone?.(applyToneTag(tone, currentText));
  }, [currentText, onSpeakWithTone]);

  // Update shared session content when text changes
  useEffect(() => {
    if (enableLiveTyping && isSharing) updateContent(currentText);
  }, [currentText, enableLiveTyping, isSharing, updateContent]);

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
    if (isSharing) {
      if (isMobile) setShowLiveTypingSheet(true);
      else setShowLiveTypingModal(true);
      return;
    }
    await createSession();
    if (isSharing) {
      updateContent(currentText);
      if (isMobile) setShowLiveTypingSheet(true);
      else setShowLiveTypingModal(true);
    }
  };

  // Expanded editing — sync text back when closing
  const handleExpandedClose = () => {
    setShowExpanded(false);
    inputRef.current?.focus();
  };

  const handleTextChange = (value: string) => {
    if (canUndo && value.trim().length > 0) resetUndo();
    if (enableTabs) updateActiveTabText(value);
    onChange(value);
  };

  // Shared action buttons JSX (used in both desktop inline and mobile expanded)
  const actionButtons = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Clear */}
      <button
        onClick={handleClear}
        disabled={!currentText.trim()}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-hover hover:bg-status-error text-text-secondary hover:text-red-500 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Clear"
      >
        <XMarkIcon className="w-3.5 h-3.5" />
        <span>Clear</span>
      </button>

      {/* Fix Text */}
      {enableFixText && (
        !isOnline ? (
          <button
            type="button"
            disabled
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-hover text-text-tertiary opacity-60 cursor-not-allowed text-xs font-medium"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Fix Text</span>
          </button>
        ) : (
          <SubscriptionWrapper
            fallback={
              <button
                onClick={() => window.location.href = '/pricing'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-hover hover:bg-status-warning text-text-secondary hover:text-amber-500 transition-all text-xs font-medium"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Fix Text</span>
              </button>
            }
          >
            <button
              onClick={handleFixText}
              disabled={!currentText.trim() || isFixingText}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                isFixingText
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                  : 'bg-surface-hover hover:bg-status-purple text-text-secondary hover:text-purple-500'
              }`}
            >
              {isFixingText ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="w-3.5 h-3.5" />
              )}
              <span>{isFixingText ? 'Fixing...' : 'Fix Text'}</span>
            </button>
          </SubscriptionWrapper>
        )
      )}

      {/* Live Typing */}
      {enableLiveTyping && user && (
        <button
          onClick={handleShare}
          disabled={!isOnline}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all text-xs font-medium ${
            !isOnline
              ? 'bg-surface-hover text-text-tertiary'
              : isSharing
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                : 'bg-surface-hover hover:bg-status-success text-text-secondary hover:text-green-500'
          }`}
        >
          <ShareIcon className="w-3.5 h-3.5" />
          <span>{isSharing ? 'Live' : 'Live Typing'}</span>
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className={`border-t border-border bg-surface ${className}`}>
        {/* Action prompt banners */}
        {(showUndoHint || showDoubleEnterHint) && (
          <div className="px-3 pt-2">
            {showUndoHint ? (
              <ActionPromptBanner variant="undo" remainingMs={undoRemainingMs} onUndo={undo} />
            ) : (
              <ActionPromptBanner variant="doubleEnter" actionLabel={doubleEnterActionLabel[settings.doubleEnterAction]} remainingMs={remainingMs} />
            )}
          </div>
        )}

        {/* Desktop: Tab bar + reply suggestions */}
        <div className="hidden md:block">
          {enableTabs && (
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={switchTab}
              onTabClose={closeTab}
              onTabCreate={createTab}
              onTabRename={renameTab}
              onManage={() => setShowTabManagement(true)}
            />
          )}

          {replySuggestions && (
            <div className="px-3 py-1.5">
              <ReplySuggestions
                history={replySuggestions.history}
                enabled={replySuggestions.enabled}
                onSelectSuggestion={replySuggestions.onSelect}
                variant="inline"
              />
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Mobile: tap to expand. Desktop: normal editable input */}
          <div
            className="flex-1 min-w-0"
            {...(isMobile ? { onClick: () => setShowExpanded(true) } : {})}
          >
            <textarea
              ref={inputRef}
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={isMobile ? (e) => { e.target.blur(); setShowExpanded(true); } : undefined}
              placeholder="Type your message..."
              rows={1}
              className={`w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-xl px-4 py-2.5 resize-none ${isMobile ? 'cursor-pointer' : ''}`}
              style={{ fontSize: `${Math.min(textSizePx, 20)}px` }}
              readOnly={isMobile}
            />
          </div>

          {/* Clear — icon only, always visible when text exists */}
          {currentText.trim() && (
            <button
              onClick={handleClear}
              className="shrink-0 p-2 rounded-full text-text-secondary hover:text-red-500 hover:bg-status-error transition-all"
              aria-label="Clear"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          {/* Speak button */}
          <div className="shrink-0">
            <SpeakButton
              onSpeak={() => onSpeak('speak')}
              onStop={onStop}
              onSelectTone={handleToneSelected}
              isSpeaking={isSpeaking}
              disabled={!isAvailable || !currentText.trim()}
              enableToneControl={enableToneControl}
            />
          </div>
        </div>

        {/* Desktop: secondary actions */}
        {currentText.trim() && (
          <div className="hidden md:flex items-center gap-1.5 px-3 pb-2">
            {actionButtons}

            <button
              type="button"
              onClick={() => setShowExpanded(true)}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label="Expand editor"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>

            <div className="flex-1" />
            {error && <span className="text-xs text-red-500 truncate">{error}</span>}
          </div>
        )}

        {/* Mobile error display (compact mode) */}
        {error && (
          <div className="px-3 pb-1.5 md:hidden">
            <span className="text-xs text-red-500">{error}</span>
          </div>
        )}
      </div>

      {/* Mobile expanded: full-screen editor panel */}
      <AnimatePresence>
        {isMobile && showExpanded && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col"
            style={{ backgroundColor: 'var(--surface, #242424)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header with Done button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Compose</h2>
              <button
                type="button"
                onClick={handleExpandedClose}
                className="px-4 py-1.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                Done
              </button>
            </div>

            {/* Tabs */}
            {enableTabs && (
              <div className="shrink-0">
                <TabBar
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabSelect={switchTab}
                  onTabClose={closeTab}
                  onTabCreate={createTab}
                  onTabRename={renameTab}
                  onManage={() => setShowTabManagement(true)}
                />
              </div>
            )}

            {/* Full textarea */}
            <div className="flex-1 p-4 min-h-0">
              <textarea
                ref={expandedRef}
                value={currentText}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full h-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-2xl px-4 py-3 resize-none"
                style={{ fontSize: `${textSizePx}px` }}
                autoFocus
              />
            </div>

            {/* Reply suggestions */}
            {replySuggestions && (
              <div className="px-4 py-2 border-t border-border shrink-0">
                <ReplySuggestions
                  history={replySuggestions.history}
                  enabled={replySuggestions.enabled}
                  onSelectSuggestion={replySuggestions.onSelect}
                  variant="inline"
                />
              </div>
            )}

            {/* Action buttons + speak */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
              {actionButtons}
              <div className="flex-1" />
              <SpeakButton
                onSpeak={() => onSpeak('speak')}
                onStop={onStop}
                onSelectTone={handleToneSelected}
                isSpeaking={isSpeaking}
                disabled={!isAvailable || !currentText.trim()}
                enableToneControl={enableToneControl}
              />
            </div>

            {error && (
              <div className="px-4 pb-2 shrink-0">
                <span className="text-xs text-red-500">{error}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop expanded: modal overlay */}
      {!isMobile && showExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleExpandedClose}>
          <div className="w-full max-w-2xl mx-4 bg-surface rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit message</h3>
              <button onClick={handleExpandedClose} className="p-2 rounded-full hover:bg-surface-hover transition-colors">
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <textarea
              ref={expandedRef}
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full min-h-[300px] bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-2xl px-4 py-3 resize-none"
              style={{ fontSize: `${textSizePx}px` }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile tab list sheet */}
      {enableTabs && (
        <MobileTabList
          isOpen={showTabList}
          onClose={() => setShowTabList(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={(tabId) => {
            switchTab(tabId);
            const tab = tabs.find(t => t.id === tabId);
            if (tab) onChange(tab.text);
          }}
          onCloseTab={(tabId) => {
            closeTab(tabId);
            const remainingTabs = tabs.filter(t => t.id !== tabId);
            if (remainingTabs.length > 0) onChange(remainingTabs[0].text);
          }}
          onCloseAllTabs={() => { closeAllTabs(); onChange(''); }}
          onCreateTab={() => { createTab(); onChange(''); }}
          onRenameTab={renameTab}
        />
      )}

      {/* Desktop tab management dialog */}
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

      {/* Live Typing Bottom Sheet (mobile) */}
      {enableLiveTyping && user && (
        <LiveTypingBottomSheet
          isOpen={showLiveTypingSheet}
          onClose={() => setShowLiveTypingSheet(false)}
          isSharing={isSharing}
          isCreating={isCreating}
          shareableLink={shareableLink}
          onStartSharing={async () => {
            await createSession();
            if (isSharing) updateContent(currentText);
          }}
          onEndSession={async () => { await endSession(); }}
        />
      )}

      {/* Live Typing Link Modal (desktop) */}
      {showLiveTypingModal && shareableLink && (
        <LiveTypingLinkModal
          shareableLink={shareableLink}
          onClose={() => setShowLiveTypingModal(false)}
          onEndSession={async () => {
            await endSession();
            setShowLiveTypingModal(false);
          }}
        />
      )}
    </>
  );
}
