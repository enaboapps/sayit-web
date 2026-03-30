'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, SparklesIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ShareIcon, StopIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionWrapper from './SubscriptionWrapper';
import { useLiveTyping } from '@/lib/hooks/useLiveTyping';
import { useDoubleEnter } from '@/lib/hooks/useDoubleEnter';
import { useUndoClear } from '@/lib/hooks/useUndoClear';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useLongPress } from '@/lib/hooks/useLongPress';
import LiveTypingLinkModal from './live-typing/LiveTypingLinkModal';
import ToneSheet from './typing/ToneSheet';
import type { TonePreset } from './typing/ToneSheet';
import { useTypingTabs } from './typing-tabs/useTypingTabs';
import TabBar from './typing-tabs/TabBar';
import TabManagementDialog from './typing-tabs/TabManagementDialog';
import ActionPromptBanner from './typing/ActionPromptBanner';

interface TypingAreaProps {
  initialText?: string
  text?: string  // External text to sync with active tab
  tts: {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    isAvailable: boolean;
  }
  onChange?: (text: string) => void
  onMessageCompleted?: (payload: { text: string; source: 'speak' | 'speakAndClear' | 'clear'; tabId?: string | null }) => void
  enableFixText?: boolean
  enableLiveTyping?: boolean
  enableToneControl?: boolean
}

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

export default function TypingArea({
  initialText = '',
  text: externalText,
  tts,
  onChange,
  onMessageCompleted,
  enableFixText = true,
  enableLiveTyping = true,
  enableToneControl = false,
}: TypingAreaProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFixingText, setIsFixingText] = useState(false);
  const [showLiveTypingModal, setShowLiveTypingModal] = useState(false);
  const [showTabManagementDialog, setShowTabManagementDialog] = useState(false);
  const [showToneSheet, setShowToneSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevExternalTextRef = useRef(externalText);
  const prevActiveTabIdRef = useRef<string | null>(null);
  const hasProcessedInitialExternalTextRef = useRef(false);
  const hasInitializedActiveTabRef = useRef(false);
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { speak, stop, isSpeaking, isAvailable } = tts;
  const {
    isSharing,
    isCreating,
    updateContent,
    createSession,
    endSession,
    getShareableLink,
  } = useLiveTyping();
  const shareableLink = getShareableLink();
  const isVisible = uiPreferences.typingAreaVisible;
  const isExpanded = uiPreferences.typingAreaExpanded;

  // Use tabs instead of single text state
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
    switchToTabByIndex,
    switchToPreviousTab,
    switchToNextTab,
  } = useTypingTabs(externalText === undefined ? initialText : undefined);

  const text = activeTab.text;
  // Sync external text prop with active tab
  useEffect(() => {
    if (externalText === undefined) {
      return;
    }

    if (!hasProcessedInitialExternalTextRef.current) {
      hasProcessedInitialExternalTextRef.current = true;
      prevExternalTextRef.current = externalText;

      if (!externalText.trim() && activeTab.text.trim()) {
        onChange?.(activeTab.text);
        return;
      }

      if (externalText !== activeTab.text) {
        updateActiveTabText(externalText);
        return;
      }
    }

    if (externalText !== prevExternalTextRef.current) {
      prevExternalTextRef.current = externalText;

      if (externalText !== activeTab.text) {
        updateActiveTabText(externalText);
      }
    }
  }, [activeTab.text, externalText, onChange, updateActiveTabText]);

  useEffect(() => {
    if (!activeTabId) return;

    if (!hasInitializedActiveTabRef.current) {
      hasInitializedActiveTabRef.current = true;
      prevActiveTabIdRef.current = activeTabId;

      if (externalText === undefined && activeTab.text.trim()) {
        onChange?.(activeTab.text);
      }
      return;
    }

    if (prevActiveTabIdRef.current && prevActiveTabIdRef.current !== activeTabId) {
      onChange?.(activeTab.text);
    }

    prevActiveTabIdRef.current = activeTabId;
  }, [activeTabId, activeTab.text, externalText, onChange]);

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Don't trigger shortcuts if user is typing in an input field (other than textarea)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== textareaRef.current) {
        return;
      }

      if (isMod && e.key === 't') {
        e.preventDefault();
        createTab();
      } else if (isMod && e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId!);
      } else if (isMod && e.key === '[') {
        e.preventDefault();
        switchToPreviousTab();
      } else if (isMod && e.key === ']') {
        e.preventDefault();
        switchToNextTab();
      } else if (isMod && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        switchToTabByIndex(parseInt(e.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTab, closeTab, activeTabId, switchToTabByIndex, switchToPreviousTab, switchToNextTab]);

  // Text size from settings (now a number in px)
  const textSizePx = settings.textSize;

  // Update shared session content when text changes
  useEffect(() => {
    if (isSharing) {
      updateContent(text);
    }
  }, [text, isSharing, updateContent]);

  const handleShare = async () => {
    if (!isOnline) {
      setError('Live Typing is unavailable offline.');
      return;
    }

    if (isSharing) {
      setShowLiveTypingModal(true);
      return;
    }

    await createSession();

    if (isSharing) {
      updateContent(text);
      setShowLiveTypingModal(true);
    }
  };

  const { clearWithUndo, undo, resetUndo, canUndo, remainingMs: undoRemainingMs, entry } = useUndoClear({
    timeoutMs: 20000,
    onRestore: ({ tabId, text: restoredText }) => {
      if (tabId !== activeTabId && tabId) {
        switchTab(tabId);
        setTimeout(() => {
          updateActiveTabText(restoredText);
          onChange?.(restoredText);
          textareaRef.current?.focus();
        }, 0);
        return;
      }

      updateActiveTabText(restoredText);
      onChange?.(restoredText);
      textareaRef.current?.focus();
    },
  });

  const showUndoHint = canUndo
    && entry?.tabId === (activeTabId || 'default')
    && activeTab.text.trim().length === 0;

  const handleClear = useCallback((source: 'clear' | 'skip' = 'clear') => {
    if (source === 'clear' && text.trim()) {
      onMessageCompleted?.({
        text,
        source: 'clear',
        tabId: activeTabId,
      });
    }

    clearWithUndo({
      tabId: activeTabId || 'default',
      text,
      onClear: () => {
        updateActiveTabText('');
        setError(null);
        onChange?.('');
        textareaRef.current?.focus();
      },
    });
  }, [activeTabId, clearWithUndo, onChange, onMessageCompleted, text, updateActiveTabText]);

  useEffect(() => {
    if (!canUndo) return;
    if (text.trim().length > 0) {
      resetUndo();
    }
  }, [canUndo, resetUndo, text]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else if (text.trim()) {
      speak(text);
      onMessageCompleted?.({
        text,
        source: 'speak',
        tabId: activeTabId,
      });
      textareaRef.current?.focus();
    }
  }, [activeTabId, isSpeaking, onMessageCompleted, speak, stop, text]);

  const handleSpeakWithTone = useCallback((tone: TonePreset) => {
    if (!text.trim()) return;
    const taggedText = `${tone.tag} ${text}`;
    speak(taggedText);
    onMessageCompleted?.({
      text,
      source: 'speak',
      tabId: activeTabId,
    });
    textareaRef.current?.focus();
  }, [activeTabId, onMessageCompleted, speak, text]);

  const speakLongPress = useLongPress({
    delay: 500,
    onPress: handleSpeak,
    onLongPress: () => {
      if (text.trim() && !isSpeaking) {
        setShowToneSheet(true);
      }
    },
    enabled: enableToneControl && !isSpeaking,
  });

  const handleFixText = async () => {
    if (!text.trim() || isFixingText) return;
    if (!isOnline) {
      setError('Fix Text is unavailable offline.');
      return;
    }

    setIsFixingText(true);
    setError(null);

    try {
      const response = await fetch('/api/fix-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.text && data.text !== text) {
        updateActiveTabText(data.text);
        onChange?.(data.text);
      }
    } catch (error) {
      console.error('Error fixing text:', error);
      setError(error instanceof Error ? error.message : 'Failed to fix text');
    } finally {
      setIsFixingText(false);
      textareaRef.current?.focus();
    }
  };

  const toggleVisibility = () => {
    updateUIPreference('typingAreaVisible', !isVisible);
  };

  const toggleExpanded = () => {
    updateUIPreference('typingAreaExpanded', !isExpanded);
  };

  const textareaHeight = isExpanded ? '30rem' : '10rem';

  const runEnterAction = useCallback((action: EnterKeyBehavior) => {
    switch (action) {
    case 'speak':
      handleSpeak();
      break;
    case 'clear':
      handleClear('clear');
      break;
    case 'speakAndClear':
      if (text.trim()) {
        speak(text);
        onMessageCompleted?.({
          text,
          source: 'speakAndClear',
          tabId: activeTabId,
        });
        setTimeout(() => handleClear('skip'), 100);
      }
      break;
    case 'newline':
    default:
      updateActiveTabText(text + '\n');
      onChange?.(text + '\n');
      break;
    }
  }, [activeTabId, handleClear, handleSpeak, onChange, onMessageCompleted, speak, text, updateActiveTabText]);

  const { handleEnter, resetPending, isPending, remainingMs } = useDoubleEnter({
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

  return (
    <div className="flex flex-col">
      {isVisible && (
        <div className="flex flex-col bg-surface shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={switchTab}
            onTabClose={closeTab}
            onTabCreate={createTab}
            onTabRename={renameTab}
            onManage={() => setShowTabManagementDialog(true)}
          />
          <div
            className="flex-1 relative flex flex-col"
            style={{ minHeight: textareaHeight, maxHeight: textareaHeight }}
          >
            {(showUndoHint || showDoubleEnterHint) && (
              <div className="px-6 pb-3">
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
              className="w-full flex-1 min-h-0 bg-transparent text-foreground placeholder:text-text-tertiary focus:outline-none resize-none p-8 overflow-auto transition-all duration-300 rounded-3xl"
              value={text}
              onChange={(e) => {
                if (canUndo && e.target.value.trim().length > 0) {
                  resetUndo();
                }
                updateActiveTabText(e.target.value);
                onChange?.(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) {
                  return;
                }
                if (handleEnter()) {
                  e.preventDefault();
                }
              }}
              onBlur={resetPending}
              placeholder="Type your message here..."
              style={{
                fontSize: `${textSizePx}px`,
                lineHeight: '1.5',
              }}
            />
            {error && (
              <div className="absolute bottom-0 left-0 right-0 bg-status-error text-red-400 p-4 text-sm rounded-b-3xl  transition-all duration-200">
                {error}
              </div>
            )}
          </div>
          {text.trim() && (
            <div className="flex flex-wrap gap-2 p-4 bg-surface-hover transition-colors duration-200">
              <button
                {...(enableToneControl ? speakLongPress : { onClick: handleSpeak })}
                className={`flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'bg-surface hover:bg-surface-hover text-foreground hover:text-primary-500'
                }`}
                data-tooltip-id="speak-tooltip"
                data-tooltip-content={isSpeaking ? 'Stop speaking' : enableToneControl ? 'Speak text (hold for tone)' : 'Speak text'}
                disabled={!isAvailable || (!isSpeaking && !text.trim())}
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
              </button>
              {enableFixText && (
                !isOnline ? (
                  <button
                    type="button"
                    disabled={true}
                    className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md bg-surface text-text-tertiary opacity-60 cursor-not-allowed"
                    data-tooltip-id="fix-text-tooltip"
                    data-tooltip-content="Fix Text requires internet"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Fix Text</span>
                  </button>
                ) : (
                  <SubscriptionWrapper
                    fallback={
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 bg-surface hover:bg-status-warning text-foreground hover:text-amber-500"
                        data-tooltip-id="fix-text-tooltip"
                        data-tooltip-content="Fix Text (Pro feature)"
                      >
                        <SparklesIcon className="w-5 h-5" />
                        <span>Fix Text</span>
                      </button>
                    }
                  >
                    <button
                      onClick={handleFixText}
                      className={`flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 ${
                        isFixingText
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                          : 'bg-surface hover:bg-status-purple text-foreground hover:text-purple-500'
                      }`}
                      data-tooltip-id="fix-text-tooltip"
                      data-tooltip-content="Fix grammar and spelling"
                      disabled={!text.trim() || isFixingText}
                    >
                      {isFixingText ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          <span>Fixing...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          <span>Fix Text</span>
                        </>
                      )}
                    </button>
                  </SubscriptionWrapper>
                )
              )}
              <button
                onClick={() => handleClear('clear')}
                className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 bg-surface hover:bg-status-error text-foreground hover:text-red-500"
                data-tooltip-id="clear-tooltip"
                data-tooltip-content="Clear"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Clear</span>
              </button>
            </div>
          )}
          {enableLiveTyping && user && (
            <div className="p-4 pt-0 bg-surface-hover transition-colors duration-200">
              <button
                onClick={handleShare}
                className={`w-full h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 ${
                  !isOnline
                    ? 'bg-surface text-text-tertiary'
                    : isSharing
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-surface hover:bg-status-success text-foreground hover:text-green-500'
                }`}
                data-tooltip-id={isOnline ? 'live-typing-tooltip' : 'offline-live-typing-tooltip'}
                data-tooltip-content={
                  isOnline
                    ? (isSharing ? 'View live typing link' : 'Start live typing')
                    : 'Live Typing requires internet'
                }
                disabled={isCreating || !isOnline}
              >
                {isCreating ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-5 h-5" />
                    <span>{isSharing ? 'Live Typing Active' : 'Live Typing'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {isVisible && (
          <button
            onClick={toggleExpanded}
            className="h-10 flex-1 bg-surface hover:bg-surface-hover text-text-secondary hover:text-foreground transition-all duration-200 flex items-center justify-center rounded-full shadow-md hover:shadow-lg hover:scale-105"
            data-tooltip-id="expand-tooltip"
            data-tooltip-content={isExpanded ? 'Collapse typing area' : 'Expand typing area'}
            aria-label={isExpanded ? 'Collapse typing area' : 'Expand typing area'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={toggleVisibility}
          className={`h-10 bg-surface hover:bg-surface-hover text-text-secondary hover:text-foreground transition-all duration-200 flex items-center justify-center rounded-full shadow-md hover:shadow-lg hover:scale-105 ${isVisible ? 'flex-1' : 'w-full'}`}
          data-tooltip-id="toggle-tooltip"
          data-tooltip-content={isVisible ? 'Hide typing area' : 'Show typing area'}
          aria-label={isVisible ? 'Hide typing area' : 'Show typing area'}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <Tooltip id="speak-tooltip" />
      <Tooltip id="fix-text-tooltip" />
      <Tooltip id="clear-tooltip" />
      <Tooltip id="expand-tooltip" />
      <Tooltip id="toggle-tooltip" />
      <Tooltip id="live-typing-tooltip" />
      <Tooltip id="offline-live-typing-tooltip" />

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

      {showTabManagementDialog && (
        <TabManagementDialog
          isOpen={showTabManagementDialog}
          onClose={() => setShowTabManagementDialog(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onCloseAllTabs={() => {
            closeAllTabs();
            onChange?.('');
          }}
          onRenameTab={renameTab}
        />
      )}

      {/* Tone Control Sheet */}
      {enableToneControl && (
        <ToneSheet
          isOpen={showToneSheet}
          onClose={() => setShowToneSheet(false)}
          onSelectTone={handleSpeakWithTone}
          onSpeakWithoutTone={handleSpeak}
        />
      )}
    </div>
  );
}
