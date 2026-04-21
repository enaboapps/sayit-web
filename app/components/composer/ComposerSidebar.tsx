'use client';

import { SparklesIcon, XMarkIcon, ArrowPathIcon, ShareIcon, BookmarkIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import SubscriptionWrapper from '../SubscriptionWrapper';
import SpeakButton from '../typing/SpeakButton';
import type { TonePreset } from '../typing/ToneSheet';

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
  return (
    <div className="grid grid-cols-2 justify-items-center content-start py-3 px-2 gap-2 border-l border-border shrink-0 h-full">
      {/* Tool buttons */}
      <button
        onClick={onClear}
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
              onClick={onFixText}
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

      {enableLiveTyping && hasUser && (
        <button
          onClick={onShare}
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

      {/* Suggestions trigger with badge */}
      {suggestionsEnabled && (
        <button
          onClick={onSuggestionsOpen}
          className="relative p-2.5 rounded-xl bg-surface-hover text-text-secondary hover:text-primary-500 hover:bg-surface-hover transition-all"
          aria-label="Suggestions"
        >
          <LightBulbIcon className="w-5 h-5" />
          {suggestionsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold px-1">
              {suggestionsCount}
            </span>
          )}
        </button>
      )}

      {/* Spacer — pushes Speak to bottom */}
      <div className="col-span-2 flex-1" />

      {/* Speak — primary action at bottom, spans both columns */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        <SpeakButton
          onSpeak={onSpeak}
          onStop={onStop}
          onSelectTone={onToneSelected}
          isSpeaking={isSpeaking}
          disabled={!isAvailable || !currentText.trim()}
          enableToneControl={enableToneControl}
          variant="icon"
        />
      </div>
    </div>
  );
}
