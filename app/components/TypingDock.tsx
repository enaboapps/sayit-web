'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  SpeakerWaveIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MinusIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLiveTyping } from '@/lib/hooks/useLiveTyping';
import { useDoubleEnter } from '@/lib/hooks/useDoubleEnter';
import { useUndoClear } from '@/lib/hooks/useUndoClear';
import { useVisualViewport } from '@/lib/hooks/useVisualViewport';
import { useTypingTabs } from './typing-tabs/useTypingTabs';
import ReplySuggestions from './typing/ReplySuggestions';
import SubscriptionWrapper from './SubscriptionWrapper';
import LiveTypingBottomSheet from './live-typing/LiveTypingBottomSheet';
import MobileTabIndicator from './typing-tabs/MobileTabIndicator';
import MobileTabList from './typing-tabs/MobileTabList';
import ActionPromptBanner from './typing/ActionPromptBanner';

interface ReplySuggestionsConfig {
  history: string[];
  enabled: boolean;
  onSelect: (suggestion: string) => void;
}

interface TypingDockProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: (source?: 'speak' | 'speakAndClear') => void;
  onMessageCompleted?: (payload: { text: string; source: 'clear'; tabId?: string | null }) => void;
  onStop?: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
  // Feature flags
  enableTabs?: boolean;
  enableLiveTyping?: boolean;
  enableFixText?: boolean;
  replySuggestions?: ReplySuggestionsConfig;
}

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

export default function TypingDock({
  text,
  onChange,
  onSpeak,
  onMessageCompleted,
  onStop,
  isSpeaking = false,
  isAvailable = true,
  className = '',
  enableTabs = false,
  enableLiveTyping = false,
  enableFixText = false,
  replySuggestions,
}: TypingDockProps) {
  const [isFixingText, setIsFixingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLiveTypingSheet, setShowLiveTypingSheet] = useState(false);
  const [showTabList, setShowTabList] = useState(false);
  const { top: viewportTop, height: viewportHeight } = useVisualViewport();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevTextRef = useRef(text); // Track previous text to detect external changes
  const prevActiveTabIdRef = useRef<string | null>(null);
  const hasProcessedInitialTextRef = useRef(false);
  const hasInitializedActiveTabRef = useRef(false);
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const { user } = useAuth();

  // Get current mode from settings
  const dockMode = uiPreferences.typingDockMode;
  const isFullscreen = dockMode === 'fullscreen';
  const isMinimized = dockMode === 'minimized';
  const lastDockModeRef = useRef<'expanded' | 'fullscreen'>('expanded');

  // Typing share hook
  const {
    isSharing,
    isCreating,
    updateContent,
    createSession,
    endSession,
    getShareableLink,
  } = useLiveTyping();
  const shareableLink = getShareableLink();

  // Typing tabs hook (only used when enableTabs is true)
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
          textareaRef.current?.focus();
        }, 0);
        return;
      }

      updateActiveTabText(restoredText);
      onChange(restoredText);
      textareaRef.current?.focus();
    },
  });

  // Sync tabs text with external text prop when tabs are enabled
  // Only sync when text prop changes externally, not when activeTab.text changes
  useEffect(() => {
    if (!enableTabs) {
      return;
    }

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
    if (dockMode === 'expanded' || dockMode === 'fullscreen') {
      lastDockModeRef.current = dockMode;
    }
  }, [dockMode]);

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

  // Text size from settings (now a number in px)
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
        if (enableTabs) {
          updateActiveTabText('');
        }
        onChange('');
        setError(null);
        textareaRef.current?.focus();
      },
    });
  }, [activeTabId, clearWithUndo, enableTabs, onChange, onMessageCompleted, updateActiveTabText]);

  const handleClear = useCallback(() => {
    clearTextWithUndo(currentText, 'clear');
  }, [clearTextWithUndo, currentText]);

  useEffect(() => {
    if (!canUndo) return;
    if (currentText.trim().length > 0) {
      resetUndo();
    }
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
        setTimeout(() => {
          clearTextWithUndo(textSnapshot, 'skip');
        }, 100);
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

  const toggleFullscreen = () => {
    const newMode = isFullscreen ? 'expanded' : 'fullscreen';
    updateUIPreference('typingDockMode', newMode);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const minimizeDock = () => {
    updateUIPreference('typingDockMode', 'minimized');
  };

  const restoreDock = () => {
    updateUIPreference('typingDockMode', lastDockModeRef.current);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Update shared session content when text changes
  useEffect(() => {
    if (enableLiveTyping && isSharing) {
      updateContent(currentText);
    }
  }, [currentText, enableLiveTyping, isSharing, updateContent]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) {
        return;
      }

      if (handleEnter()) {
        e.preventDefault();
      }
    },
    [handleEnter]
  );

  // Fix Text handler
  const handleFixText = async () => {
    if (!currentText.trim() || isFixingText) return;

    setIsFixingText(true);
    setError(null);

    try {
      const response = await fetch('/api/fix-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: currentText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.text && data.text !== currentText) {
        onChange(data.text);
      }
    } catch (err) {
      console.error('Error fixing text:', err);
      setError(err instanceof Error ? err.message : 'Failed to fix text');
    } finally {
      setIsFixingText(false);
    }
  };

  if (isMinimized) {
    return (
      <>
        <button
          onClick={restoreDock}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-4 z-50 flex items-center justify-center rounded-full bg-surface-hover text-text-secondary shadow-lg p-3 hover:bg-surface transition-colors md:bottom-4"
          aria-label="Open typing dock"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2.5" y="7" width="19" height="9" rx="2" />
            <path d="M6 11h.01M9 11h.01M12 11h.01M15 11h.01M18 11h.01" />
            <path d="M6 14h12" />
          </svg>
        </button>

        {/* Live Typing Bottom Sheet */}
        {enableLiveTyping && user && (
          <LiveTypingBottomSheet
            isOpen={showLiveTypingSheet}
            onClose={() => setShowLiveTypingSheet(false)}
            isSharing={isSharing}
            isCreating={isCreating}
            shareableLink={shareableLink}
            onStartSharing={async () => {
              await createSession();
              if (isSharing) {
                updateContent(currentText);
              }
            }}
            onEndSession={async () => {
              await endSession();
            }}
          />
        )}

        {/* Tab List Bottom Sheet */}
        {enableTabs && (
          <MobileTabList
            isOpen={showTabList}
            onClose={() => setShowTabList(false)}
            tabs={tabs}
            activeTabId={activeTabId}
            onSwitchTab={(tabId) => {
              switchTab(tabId);
              const tab = tabs.find(t => t.id === tabId);
              if (tab) {
                onChange(tab.text);
              }
            }}
            onCloseTab={(tabId) => {
              closeTab(tabId);
              // Update the text to the new active tab's text
              const remainingTabs = tabs.filter(t => t.id !== tabId);
              if (remainingTabs.length > 0) {
                onChange(remainingTabs[0].text);
              }
            }}
            onCloseAllTabs={() => {
              closeAllTabs();
              onChange('');
            }}
            onCreateTab={() => {
              createTab();
              onChange('');
            }}
            onRenameTab={renameTab}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`border-t border-border ${className} ${isFullscreen ? 'fixed left-0 right-0 z-50 flex flex-col' : ''}`}
        style={
          isFullscreen
            ? {
              top: viewportTop,
              height: viewportHeight ? `${viewportHeight}px` : '100dvh',
              backgroundColor: '#242424',
            }
            : { backgroundColor: '#242424' }
        }
      >
        <div className={`px-3 py-2 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: isFullscreen ? '100%' : 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`space-y-2 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}
          >
            <div className="flex items-center justify-between">
              {enableTabs ? (
                <div className="flex items-center">
                  <MobileTabIndicator
                    tabs={tabs}
                    activeTab={activeTab}
                    onClick={() => setShowTabList(true)}
                  />
                </div>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={minimizeDock}
                  className="p-1.5 rounded-full hover:bg-surface transition-colors"
                  aria-label="Minimize"
                >
                  <MinusIcon className="w-4 h-4 text-text-secondary" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-full hover:bg-surface transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded textarea */}
            <div className={`relative flex flex-col ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
              {(showUndoHint || showDoubleEnterHint) && (
                <div className="mb-2 shrink-0">
                  {showUndoHint ? (
                    <ActionPromptBanner
                      variant="undo"
                      remainingMs={undoRemainingMs}
                      onUndo={undo}
                    />
                  ) : (
                    <ActionPromptBanner
                      variant="doubleEnter"
                      actionLabel={doubleEnterActionLabel[settings.doubleEnterAction]}
                      remainingMs={remainingMs}
                    />
                  )}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={currentText}
                onChange={(e) => {
                  if (canUndo && e.target.value.trim().length > 0) {
                    resetUndo();
                  }
                  if (enableTabs) {
                    updateActiveTabText(e.target.value);
                  }
                  onChange(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className={`w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-2xl px-4 py-3 ${enableTabs ? '' : 'pr-16'} resize-none ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
                rows={isFullscreen ? undefined : 3}
                style={{
                  fontSize: `${textSizePx}px`,
                  ...(isFullscreen ? { minHeight: '100%' } : {}),
                }}
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="px-1">
                <span className="text-xs text-red-500">{error}</span>
              </div>
            )}

            {/* Reply suggestions (inline variant — no card/header) */}
            {replySuggestions && (
              <ReplySuggestions
                history={replySuggestions.history}
                enabled={replySuggestions.enabled}
                onSelectSuggestion={replySuggestions.onSelect}
                variant="inline"
              />
            )}

            {/* Row 1: AI Features (when text exists) */}
            {currentText.trim() && enableFixText && (
              <div className="flex items-center gap-2">
                {/* Fix Text button (Pro) */}
                <SubscriptionWrapper
                  fallback={
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-warning text-text-secondary hover:text-amber-500 transition-all duration-200"
                      aria-label="Fix Text (Pro)"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Fix Text</span>
                    </button>
                  }
                >
                  <button
                    onClick={handleFixText}
                    disabled={!currentText.trim() || isFixingText}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isFixingText
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : 'bg-surface-hover hover:bg-status-purple text-text-secondary hover:text-purple-500'
                    }`}
                    aria-label="Fix Text"
                  >
                    {isFixingText ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Fixing...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Fix Text</span>
                      </>
                    )}
                  </button>
                </SubscriptionWrapper>
              </div>
            )}

            {/* Row 2: Primary Actions */}
            <div className="flex items-center gap-2">
              {/* Clear button */}
              <button
                onClick={handleClear}
                disabled={!currentText.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-error text-text-secondary hover:text-red-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Clear"
              >
                <XMarkIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Clear</span>
              </button>

              {/* Live Typing button */}
              {enableLiveTyping && user && (
                <button
                  onClick={() => setShowLiveTypingSheet(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 ${
                    isSharing
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-surface-hover hover:bg-status-success text-text-secondary hover:text-green-500'
                  }`}
                  aria-label="Live Typing"
                >
                  <ShareIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isSharing ? 'Live Typing Active' : 'Live Typing'}
                  </span>
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Speak/Stop button - primary CTA */}
              <motion.button
                onClick={isSpeaking ? onStop : () => onSpeak('speak')}
                disabled={!isAvailable || (!isSpeaking && !currentText.trim())}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
                whileTap={{ scale: 0.95 }}
                aria-label={isSpeaking ? 'Stop' : 'Speak'}
              >
                {isSpeaking ? (
                  <>
                    <StopIcon className="w-5 h-5" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <SpeakerWaveIcon className="w-5 h-5" />
                    <span>Speak</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Typing Bottom Sheet */}
      {enableLiveTyping && user && (
        <LiveTypingBottomSheet
          isOpen={showLiveTypingSheet}
          onClose={() => setShowLiveTypingSheet(false)}
          isSharing={isSharing}
          isCreating={isCreating}
          shareableLink={shareableLink}
          onStartSharing={async () => {
            await createSession();
            if (isSharing) {
              updateContent(currentText);
            }
          }}
          onEndSession={async () => {
            await endSession();
          }}
        />
      )}

      {/* Tab List Bottom Sheet */}
      {enableTabs && (
        <MobileTabList
          isOpen={showTabList}
          onClose={() => setShowTabList(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={(tabId) => {
            switchTab(tabId);
            const tab = tabs.find(t => t.id === tabId);
            if (tab) {
              onChange(tab.text);
            }
          }}
          onCloseTab={(tabId) => {
            closeTab(tabId);
            // Update the text to the new active tab's text
            const remainingTabs = tabs.filter(t => t.id !== tabId);
            if (remainingTabs.length > 0) {
              onChange(remainingTabs[0].text);
            }
          }}
          onCloseAllTabs={() => {
            closeAllTabs();
            onChange('');
          }}
          onCreateTab={() => {
            createTab();
            onChange('');
          }}
          onRenameTab={renameTab}
        />
      )}
    </>
  );
}
