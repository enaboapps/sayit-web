'use client';

import { SparklesIcon, XMarkIcon, ArrowPathIcon, ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import SubscriptionWrapper from '../SubscriptionWrapper';
import SpeakButton from '../typing/SpeakButton';
import type { TonePreset } from '../typing/ToneSheet';

interface ComposerToolbarProps {
  currentText: string;
  onClear: () => void;
  onSpeak: () => void;
  onStop?: () => void;
  onToneSelected: (tone: TonePreset) => void;
  isSpeaking: boolean;
  isAvailable: boolean;
  // Fix text
  enableFixText: boolean;
  isOnline: boolean;
  isFixingText: boolean;
  onFixText: () => void;
  // Live typing
  enableLiveTyping: boolean;
  isLiveTypingButtonActive: boolean;
  onShare: () => void;
  hasUser: boolean;
  // Save as phrase
  onAddAsPhrase?: (text: string) => void;
  // Tone
  enableToneControl: boolean;
  // Portal mode affects padding
  isPortaled: boolean;
}

export default function ComposerToolbar({
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
  isPortaled,
}: ComposerToolbarProps) {
  return (
    <div className={`flex items-center gap-3 px-4 pt-2 ${isPortaled ? 'pb-2' : 'pb-4'}`}>
      {/* Secondary tools */}
      <div className="flex items-center gap-1">
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
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Speak — the big action */}
      <SpeakButton
        onSpeak={onSpeak}
        onStop={onStop}
        onSelectTone={onToneSelected}
        isSpeaking={isSpeaking}
        disabled={!isAvailable || !currentText.trim()}
        enableToneControl={enableToneControl}
      />
    </div>
  );
}
