'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShareIcon,
  BookmarkIcon,
  ClipboardIcon,
  LightBulbIcon,
  SpeakerWaveIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { AudioWaveform } from 'lucide-react';
import SubscriptionWrapper from '../SubscriptionWrapper';
import ToneSheet, { type TonePreset } from '../typing/ToneSheet';
import RadialFlyout, { type RadialFlyoutItem } from './RadialFlyout';

interface ComposerSidebarProps {
  currentText: string;
  onClear: () => void;
  onSpeak: () => void;
  onStop?: () => void;
  onToneSelected: (tone: TonePreset) => void;
  isSpeaking: boolean;
  isAvailable: boolean;
  enableFixText: boolean;
  isOnline: boolean;
  isFixingText: boolean;
  onFixText: () => void;
  enableLiveTyping: boolean;
  isLiveTypingButtonActive: boolean;
  onShare: () => void;
  hasUser: boolean;
  onAddAsPhrase?: (text: string) => void;
  enableToneControl: boolean;
  // Suggestions
  suggestionsCount: number;
  onSuggestionsOpen: () => void;
  suggestionsEnabled: boolean;
  // Copy / Paste
  onCopyPasteOpen: () => void;
}

// Shared base classes — round floating tiles used inside the radial wheel.
const WHEEL_TILE =
  'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed';

export default function ComposerSidebar({
  currentText,
  onClear,
  onSpeak,
  onStop,
  onToneSelected,
  isSpeaking,
  isAvailable,
  enableFixText,
  isOnline,
  isFixingText,
  onFixText,
  enableLiveTyping,
  isLiveTypingButtonActive,
  onShare,
  hasUser,
  onAddAsPhrase,
  enableToneControl,
  suggestionsCount,
  onSuggestionsOpen,
  suggestionsEnabled,
  onCopyPasteOpen,
}: ComposerSidebarProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);
  const [isWheelOpen, setWheelOpen] = useState(false);
  const speakDisabled = !isAvailable || !currentText.trim();
  const clearDisabled = !currentText.trim();

  // Close the wheel before firing an action so overlays (bottom sheets etc.)
  // open on top of a settled composer.
  const runAndClose = (action: () => void) => () => {
    setWheelOpen(false);
    action();
  };

  const wheelItems: RadialFlyoutItem[] = [];

  // Fix Text — purple tile (offline stub or subscription fallback variants)
  if (enableFixText) {
    wheelItems.push({
      key: 'fix',
      label: 'Fix Text',
      content: !isOnline ? (
        <button
          type="button"
          disabled
          className={`${WHEEL_TILE} bg-surface-hover text-text-tertiary opacity-40 cursor-not-allowed`}
          aria-label="Fix Text (offline)"
        >
          <SparklesIcon className="w-5 h-5" />
        </button>
      ) : (
        <SubscriptionWrapper
          fallback={
            <button
              onClick={runAndClose(() => (window.location.href = '/pricing'))}
              className={`${WHEEL_TILE} bg-status-warning text-amber-400 hover:bg-warning hover:text-white`}
              aria-label="Fix Text (upgrade)"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
          }
        >
          <button
            onClick={runAndClose(onFixText)}
            disabled={!currentText.trim() || isFixingText}
            className={`${WHEEL_TILE} ${
              isFixingText
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                : 'bg-status-purple text-purple-400 hover:bg-purple-600 hover:text-white'
            }`}
            aria-label="Fix Text"
          >
            {isFixingText ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
          </button>
        </SubscriptionWrapper>
      ),
    });
  }

  // Live Typing — green tile (with active gradient and offline disabled states)
  if (enableLiveTyping && hasUser) {
    wheelItems.push({
      key: 'live',
      label: 'Live Typing',
      content: (
        <button
          onClick={runAndClose(onShare)}
          disabled={!isOnline}
          className={`${WHEEL_TILE} ${
            !isOnline
              ? 'bg-surface-hover text-text-tertiary opacity-40'
              : isLiveTypingButtonActive
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : 'bg-status-success text-green-400 hover:bg-success hover:text-white'
          }`}
          aria-label={isLiveTypingButtonActive ? 'Live Typing Active' : 'Live Typing'}
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      ),
    });
  }

  // Save as Phrase — blue tile
  if (onAddAsPhrase) {
    wheelItems.push({
      key: 'save',
      label: 'Save as Phrase',
      content: (
        <button
          onClick={runAndClose(() => onAddAsPhrase(currentText))}
          disabled={!currentText.trim()}
          className={`${WHEEL_TILE} bg-status-info text-blue-400 hover:bg-blue-600 hover:text-white`}
          aria-label="Save as phrase"
        >
          <BookmarkIcon className="w-5 h-5" />
        </button>
      ),
    });
  }

  // Suggestions — amber tile (with count badge)
  if (suggestionsEnabled) {
    wheelItems.push({
      key: 'suggestions',
      label: 'Suggestions',
      content: (
        <button
          onClick={runAndClose(onSuggestionsOpen)}
          className={`${WHEEL_TILE} relative bg-status-warning text-amber-400 hover:bg-warning hover:text-white`}
          aria-label="Suggestions"
        >
          <LightBulbIcon className="w-5 h-5" />
          {suggestionsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold px-1">
              {suggestionsCount}
            </span>
          )}
        </button>
      ),
    });
  }

  // Copy / Paste — pink tile (a fifth accent so it's distinct from the others)
  wheelItems.push({
    key: 'copy-paste',
    label: 'Copy & Paste',
    content: (
      <button
        onClick={runAndClose(onCopyPasteOpen)}
        className={`${WHEEL_TILE} bg-pink-950/40 text-pink-400 hover:bg-pink-600 hover:text-white`}
        aria-label="Copy and paste"
      >
        <ClipboardIcon className="w-5 h-5" />
      </button>
    ),
  });

  return (
    <>
      {/* Top-right trigger + quarter-circle action wheel */}
      <RadialFlyout
        items={wheelItems}
        isOpen={isWheelOpen}
        onOpen={() => setWheelOpen(true)}
        onClose={() => setWheelOpen(false)}
        triggerBadge={suggestionsEnabled ? suggestionsCount : 0}
      />

      {/* Bottom-right pinned stack — Clear above Speak. Stop replaces both while speaking. */}
      <div className="absolute bottom-4 right-3 z-20 flex flex-col items-end gap-3">
        {isSpeaking ? (
          <button
            type="button"
            onClick={onStop}
            className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center bg-error hover:bg-error-hover text-white transition-colors"
            aria-label="Stop"
          >
            <StopIcon className="w-8 h-8" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClear}
              disabled={clearDisabled}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-status-error text-red-400 border border-border hover:bg-error hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Clear"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            {enableToneControl ? (
              // Split pill: small tone segment attached to a dominant Speak segment.
              <div className="flex rounded-full overflow-hidden shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowToneSheet(true)}
                  disabled={speakDisabled}
                  className="w-12 h-16 flex items-center justify-center bg-primary-700 hover:bg-primary-600 text-white border-r border-primary-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Choose tone"
                >
                  <AudioWaveform className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onSpeak}
                  disabled={speakDisabled}
                  className="w-16 h-16 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Speak"
                >
                  <SpeakerWaveIcon className="w-8 h-8" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSpeak}
                disabled={speakDisabled}
                className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Speak"
              >
                <SpeakerWaveIcon className="w-8 h-8" />
              </button>
            )}
          </>
        )}
      </div>

      <ToneSheet
        isOpen={showToneSheet}
        onClose={() => setShowToneSheet(false)}
        onSelectTone={onToneSelected}
        onSpeakWithoutTone={() => {
          onSpeak();
          setShowToneSheet(false);
        }}
      />
    </>
  );
}
