'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpeakerWaveIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTypingShare } from '@/lib/hooks/useTypingShare';
import { useTypingTabs } from './typing-tabs/useTypingTabs';
import SubscriptionWrapper from './SubscriptionWrapper';
import FleshOutBottomSheet from './flesh-out/FleshOutBottomSheet';
import ShareBottomSheet from './typing-share/ShareBottomSheet';
import MobileTabIndicator from './typing-tabs/MobileTabIndicator';
import MobileTabList from './typing-tabs/MobileTabList';

interface TypingDockProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
  // Feature flags
  enableTabs?: boolean;
  enableShare?: boolean;
  enableFleshOut?: boolean;
  enableFixText?: boolean;
}

export default function TypingDock({
  text,
  onChange,
  onSpeak,
  isSpeaking = false,
  isAvailable = true,
  className = '',
  enableTabs = false,
  enableShare = false,
  enableFleshOut = false,
  enableFixText = false,
}: TypingDockProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isFixingText, setIsFixingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFleshOutSheet, setShowFleshOutSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showTabList, setShowTabList] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const { user } = useAuth();

  // Get current mode from settings
  const dockMode = uiPreferences.typingDockMode;
  const isExpanded = dockMode === 'expanded' || dockMode === 'fullscreen';
  const isFullscreen = dockMode === 'fullscreen';

  // Typing share hook
  const typingShare = useTypingShare();
  const shareableLink = typingShare.getShareableLink();

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

  // Sync tabs text with external text prop when tabs are enabled
  useEffect(() => {
    if (enableTabs && text !== activeTab.text) {
      updateActiveTabText(text);
    }
  }, [enableTabs, text, activeTab.text, updateActiveTabText]);

  // Text size classes
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl',
    xlarge: 'text-2xl',
  };
  const currentTextSizeClass = textSizeClasses[settings.textSize];

  // Auto-expand when text gets long (but don't change fullscreen)
  useEffect(() => {
    if (text.length > 50 && dockMode === 'compact') {
      updateUIPreference('typingDockMode', 'expanded');
    }
  }, [text, dockMode, updateUIPreference]);

  // Update shared session content when text changes
  useEffect(() => {
    if (enableShare && typingShare.isSharing) {
      typingShare.updateContent(text);
    }
  }, [text, enableShare, typingShare.isSharing, typingShare.updateContent]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        switch (settings.enterKeyBehavior) {
          case 'speak':
            if (text.trim()) onSpeak();
            break;
          case 'clear':
            onChange('');
            break;
          case 'speakAndClear':
            if (text.trim()) {
              onSpeak();
              setTimeout(() => onChange(''), 100);
            }
            break;
          case 'newline':
          default:
            if (isExpanded) {
              onChange(text + '\n');
            } else {
              // In compact mode, enter speaks
              if (text.trim()) onSpeak();
            }
            break;
        }
      }
    },
    [settings.enterKeyBehavior, text, onSpeak, onChange, isExpanded]
  );

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Collapse if text is short (but don't change fullscreen)
    if (text.length <= 50 && dockMode === 'expanded') {
      updateUIPreference('typingDockMode', 'compact');
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    if (isExpanded) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  const toggleExpanded = () => {
    // Cycle: compact -> expanded -> compact
    const newMode = dockMode === 'compact' ? 'expanded' : 'compact';
    updateUIPreference('typingDockMode', newMode);
    // Focus the appropriate input after toggle
    setTimeout(() => {
      if (newMode === 'expanded') {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 100);
  };

  const toggleFullscreen = () => {
    const newMode = isFullscreen ? 'expanded' : 'fullscreen';
    updateUIPreference('typingDockMode', newMode);
    // Focus textarea in both expanded and fullscreen modes
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Fix Text handler
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
        onChange(data.text);
      }
    } catch (err) {
      console.error('Error fixing text:', err);
      setError(err instanceof Error ? err.message : 'Failed to fix text');
    } finally {
      setIsFixingText(false);
    }
  };

  // Flesh out handler
  const handleFleshOut = () => {
    if (!text.trim()) return;
    setShowFleshOutSheet(true);
  };

  const handleApplyFleshedOutText = (newText: string) => {
    onChange(newText);
    setShowFleshOutSheet(false);
  };

  // Share handler
  const handleShare = async () => {
    if (!enableShare || !user) return;

    if (typingShare.isSharing) {
      setShowShareSheet(true);
      return;
    }

    await typingShare.createSession();

    if (typingShare.isSharing) {
      typingShare.updateContent(text);
      setShowShareSheet(true);
    }
  };

  return (
    <>
      <div
        className={`border-t border-border ${className} ${isFullscreen ? 'fixed inset-0 z-50 flex flex-col' : ''}`}
        style={{ backgroundColor: '#242424' }}
      >
        <div className={`px-3 py-2 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: isFullscreen ? '100%' : 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`space-y-2 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}
              >
                {/* Tab indicator row (expanded mode) */}
                {enableTabs && (
                  <div className="flex items-center justify-between">
                    <MobileTabIndicator
                      tabs={tabs}
                      activeTab={activeTab}
                      onClick={() => setShowTabList(true)}
                    />
                    <div className="flex items-center gap-1">
                      {/* Fullscreen toggle */}
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
                      {/* Collapse button */}
                      <button
                        onClick={toggleExpanded}
                        className="p-1.5 rounded-full hover:bg-surface transition-colors"
                        aria-label="Collapse"
                      >
                        <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded textarea */}
                <div className={`relative ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Type your message..."
                    className={`w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-2xl px-4 py-3 ${enableTabs ? '' : 'pr-16'} ${currentTextSizeClass} resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${isFullscreen ? 'flex-1' : ''}`}
                    rows={isFullscreen ? undefined : 3}
                    style={isFullscreen ? { minHeight: '100%' } : undefined}
                  />
                  {/* Control buttons (when tabs are not enabled) */}
                  {!enableTabs && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {/* Fullscreen toggle */}
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
                      {/* Collapse button */}
                      <button
                        onClick={toggleExpanded}
                        className="p-1.5 rounded-full hover:bg-surface transition-colors"
                        aria-label="Collapse"
                      >
                        <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <div className="px-1">
                    <span className="text-xs text-red-500">{error}</span>
                  </div>
                )}

                {/* Row 1: AI Features (when text exists) */}
                {text.trim() && (enableFleshOut || enableFixText || (enableShare && user)) && (
                  <div className="flex items-center gap-2">
                    {/* Flesh Out button */}
                    {enableFleshOut && (
                      <button
                        onClick={handleFleshOut}
                        disabled={!text.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-purple text-text-secondary hover:text-purple-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Flesh Out"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Flesh Out</span>
                      </button>
                    )}

                    {/* Fix Text button (Pro) */}
                    {enableFixText && (
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
                          disabled={!text.trim() || isFixingText}
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
                    )}

                    {/* Share button */}
                    {enableShare && user && (
                      <button
                        onClick={() => setShowShareSheet(true)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 ${
                          typingShare.isSharing
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-surface-hover hover:bg-status-success text-text-secondary hover:text-green-500'
                        }`}
                        aria-label="Share"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {typingShare.isSharing ? 'Sharing' : 'Share'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Row 2: Primary Actions */}
                <div className="flex items-center gap-2">
                  {/* Clear button */}
                  <button
                    onClick={handleClear}
                    disabled={!text.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-error text-text-secondary hover:text-red-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Clear"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Clear</span>
                  </button>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Speak button - primary CTA */}
                  <motion.button
                    onClick={onSpeak}
                    disabled={!isAvailable || !text.trim()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                      isSpeaking
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isSpeaking ? 'Speaking...' : 'Speak'}
                  >
                    <SpeakerWaveIcon className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                {/* Tab indicator (compact mode) */}
                {enableTabs && (
                  <div className="flex justify-center">
                    <MobileTabIndicator
                      tabs={tabs}
                      activeTab={activeTab}
                      onClick={() => setShowTabList(true)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Compact input */}
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={(e) => onChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder="Type to speak..."
                      className={`w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-full px-4 py-3 pr-10 ${currentTextSizeClass} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    />
                    {/* Expand button */}
                    <button
                      onClick={toggleExpanded}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-surface transition-colors"
                      aria-label="Expand"
                    >
                      <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>

                  {/* Speak button - primary CTA */}
                  <motion.button
                    onClick={onSpeak}
                    disabled={!isAvailable || !text.trim()}
                    className={`flex-shrink-0 p-4 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                      isSpeaking
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                        : text.trim()
                        ? 'bg-primary-500 hover:bg-primary-600 text-white'
                        : 'bg-surface-hover text-text-tertiary'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isSpeaking ? 'Speaking...' : 'Speak'}
                  >
                    <SpeakerWaveIcon className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Flesh Out Bottom Sheet */}
      {enableFleshOut && (
        <FleshOutBottomSheet
          isOpen={showFleshOutSheet}
          initialText={text}
          onClose={() => setShowFleshOutSheet(false)}
          onApply={handleApplyFleshedOutText}
        />
      )}

      {/* Share Bottom Sheet */}
      {enableShare && user && (
        <ShareBottomSheet
          isOpen={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          isSharing={typingShare.isSharing}
          isCreating={typingShare.isCreating}
          shareableLink={shareableLink}
          onStartSharing={async () => {
            await typingShare.createSession();
            if (typingShare.isSharing) {
              typingShare.updateContent(text);
            }
          }}
          onEndSession={async () => {
            await typingShare.endSession();
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
