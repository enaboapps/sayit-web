'use client';

import { useState, type ReactNode } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShareIcon,
  BookmarkIcon,
  LightBulbIcon,
  SpeakerWaveIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { AudioWaveform } from 'lucide-react';
import SubscriptionWrapper from '../SubscriptionWrapper';
import ToneSheet, { type TonePreset } from '../typing/ToneSheet';

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
}

// Shared base classes — every icon tile fills its grid cell as a square.
const TILE_BASE =
  'w-full aspect-square flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed';

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
}: ComposerSidebarProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);
  const speakDisabled = !isAvailable || !currentText.trim();
  const clearDisabled = !currentText.trim();
  const iconButtons: ReactNode[] = [];

  // Fix Text — purple tile (offline stub or subscription fallback variants)
  if (enableFixText) {
    if (!isOnline) {
      iconButtons.push(
        <button
          key="fix"
          type="button"
          disabled
          className={`${TILE_BASE} bg-surface-hover text-text-tertiary opacity-40 cursor-not-allowed`}
          aria-label="Fix Text (offline)"
        >
          <SparklesIcon className="w-5 h-5" />
        </button>
      );
    } else {
      iconButtons.push(
        <SubscriptionWrapper
          key="fix"
          fallback={
            <button
              onClick={() => (window.location.href = '/pricing')}
              className={`${TILE_BASE} bg-status-warning text-amber-400 hover:bg-warning hover:text-white`}
              aria-label="Fix Text (upgrade)"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
          }
        >
          <button
            onClick={onFixText}
            disabled={!currentText.trim() || isFixingText}
            className={`${TILE_BASE} ${
              isFixingText
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                : 'bg-status-purple text-purple-400 hover:bg-purple-600 hover:text-white'
            }`}
            aria-label="Fix Text"
          >
            {isFixingText ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
          </button>
        </SubscriptionWrapper>
      );
    }
  }

  // Live Typing — green tile (with active gradient and offline disabled states)
  if (enableLiveTyping && hasUser) {
    iconButtons.push(
      <button
        key="live"
        onClick={onShare}
        disabled={!isOnline}
        className={`${TILE_BASE} ${
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
    );
  }

  // Save as Phrase — blue tile
  if (onAddAsPhrase) {
    iconButtons.push(
      <button
        key="save"
        onClick={() => onAddAsPhrase(currentText)}
        disabled={!currentText.trim()}
        className={`${TILE_BASE} bg-status-info text-blue-400 hover:bg-blue-600 hover:text-white`}
        aria-label="Save as phrase"
      >
        <BookmarkIcon className="w-5 h-5" />
      </button>
    );
  }

  // Suggestions — amber tile (with count badge)
  if (suggestionsEnabled) {
    iconButtons.push(
      <button
        key="suggestions"
        onClick={onSuggestionsOpen}
        className={`${TILE_BASE} relative bg-status-warning text-amber-400 hover:bg-warning hover:text-white`}
        aria-label="Suggestions"
      >
        <LightBulbIcon className="w-5 h-5" />
        {suggestionsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold px-1">
            {suggestionsCount}
          </span>
        )}
      </button>
    );
  }

  // Balance the 2-column grid when an odd number of buttons rendered.
  if (iconButtons.length % 2 === 1) {
    iconButtons.push(<div key="placeholder" aria-hidden className="w-full aspect-square" />);
  }

  return (
    <div className="flex flex-col border-l border-border shrink-0 h-full w-24">
      {/* Icon tile grid */}
      <div className="grid grid-cols-2 auto-rows-min">{iconButtons}</div>

      {/* Spacer — pushes Speak to the bottom */}
      <div className="flex-1" />

      {/* Bottom stack — Clear on top, then Tone + Speak (or just Speak). Stop replaces all while speaking. */}
      <div className="flex flex-col shrink-0">
        {isSpeaking ? (
          <button
            type="button"
            onClick={onStop}
            className="w-full aspect-square flex items-center justify-center bg-error hover:bg-error-hover text-white transition-colors"
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
              className="w-full aspect-square flex items-center justify-center bg-status-error text-red-400 hover:bg-error hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Clear"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            {enableToneControl ? (
              <div className="grid grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowToneSheet(true)}
                  disabled={speakDisabled}
                  className="w-full aspect-square flex items-center justify-center bg-primary-400 hover:bg-primary-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Choose tone"
                >
                  <AudioWaveform className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={onSpeak}
                  disabled={speakDisabled}
                  className="w-full aspect-square flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Speak"
                >
                  <SpeakerWaveIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSpeak}
                disabled={speakDisabled}
                className="w-full aspect-square flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
    </div>
  );
}
