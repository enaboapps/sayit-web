'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, SparklesIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ShareIcon, StopIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionWrapper from './SubscriptionWrapper';
import { useTypingShare } from '@/lib/hooks/useTypingShare';
import { useDoubleEnter } from '@/lib/hooks/useDoubleEnter';
import ShareLinkModal from './typing-share/ShareLinkModal';
import { useTypingTabs } from './typing-tabs/useTypingTabs';
import TabBar from './typing-tabs/TabBar';
import TabManagementDialog from './typing-tabs/TabManagementDialog';
import DoubleEnterHint from './typing/DoubleEnterHint';

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
}

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

export default function TypingArea({ initialText = '', text: externalText, tts, onChange }: TypingAreaProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFixingText, setIsFixingText] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTabManagementDialog, setShowTabManagementDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const { user } = useAuth();
  const { speak, stop, isSpeaking, isAvailable } = tts;
  const {
    isSharing,
    isCreating,
    updateContent,
    createSession,
    endSession,
    getShareableLink,
  } = useTypingShare();
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
  } = useTypingTabs(initialText);

  const text = activeTab.text;

  // Sync external text prop with active tab
  useEffect(() => {
    if (externalText !== undefined && externalText !== activeTab.text) {
      updateActiveTabText(externalText);
    }
  }, [externalText, activeTab.text, updateActiveTabText]);

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
    if (isSharing) {
      setShowShareModal(true);
      return;
    }

    await createSession();

    if (isSharing) {
      updateContent(text);
      setShowShareModal(true);
    }
  };

  const handleClear = useCallback(() => {
    updateActiveTabText('');
    setError(null);
    onChange?.('');
    textareaRef.current?.focus();
  }, [onChange, updateActiveTabText]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else if (text.trim()) {
      speak(text);
      textareaRef.current?.focus();
    }
  }, [isSpeaking, speak, stop, text]);

  const handleFixText = async () => {
    if (!text.trim() || isFixingText) return;

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
      handleClear();
      break;
    case 'speakAndClear':
      if (text.trim()) {
        speak(text);
        setTimeout(() => handleClear(), 100);
      }
      break;
    case 'newline':
    default:
      updateActiveTabText(text + '\n');
      onChange?.(text + '\n');
      break;
    }
  }, [handleClear, handleSpeak, onChange, speak, text, updateActiveTabText]);

  const { handleEnter, resetPending, isPending, remainingMs } = useDoubleEnter({
    enabled: settings.doubleEnterEnabled,
    timeoutMs: settings.doubleEnterTimeoutMs,
    onSingleEnter: () => runEnterAction(settings.enterKeyBehavior),
    onDoubleEnter: () => runEnterAction(settings.doubleEnterAction),
  });

  const showDoubleEnterHint = settings.doubleEnterEnabled && isPending;

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
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset resize-none p-8 overflow-auto transition-all duration-300 rounded-3xl"
              value={text}
              onChange={(e) => {
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
                minHeight: textareaHeight,
                maxHeight: textareaHeight,
                lineHeight: '1.5',
              }}
            />
            {showDoubleEnterHint && (
              <DoubleEnterHint
                action={settings.doubleEnterAction}
                remainingMs={remainingMs}
                className="px-8 pb-2 text-xs text-text-tertiary"
              />
            )}
            {error && (
              <div className="absolute bottom-0 left-0 right-0 bg-status-error text-red-400 p-4 text-sm rounded-b-3xl  transition-all duration-200">
                {error}
              </div>
            )}
          </div>
          {text.trim() && (
            <div className="flex flex-wrap gap-2 p-4 bg-surface-hover transition-colors duration-200">
              <button
                onClick={handleSpeak}
                className={`flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'bg-surface hover:bg-surface-hover text-foreground hover:text-primary-500'
                }`}
                data-tooltip-id="speak-tooltip"
                data-tooltip-content={isSpeaking ? 'Stop speaking' : 'Speak text'}
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
              <button
                onClick={handleClear}
                className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 bg-surface hover:bg-status-error text-foreground hover:text-red-500"
                data-tooltip-id="clear-tooltip"
                data-tooltip-content="Clear"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Clear</span>
              </button>
            </div>
          )}
          {user && (
            <div className="p-4 pt-0 bg-surface-hover transition-colors duration-200">
              <button
                onClick={handleShare}
                className={`w-full h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 ${
                  isSharing
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-surface hover:bg-status-success text-foreground hover:text-green-500'
                }`}
                data-tooltip-id="share-tooltip"
                data-tooltip-content={isSharing ? 'View share link' : 'Share your typing'}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-5 h-5" />
                    <span>{isSharing ? 'Sharing Active' : 'Share'}</span>
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
      <Tooltip id="share-tooltip" />

      {showShareModal && shareableLink && (
        <ShareLinkModal
          shareableLink={shareableLink}
          onClose={() => setShowShareModal(false)}
          onEndSession={async () => {
            await endSession();
            setShowShareModal(false);
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
    </div>
  );
}
