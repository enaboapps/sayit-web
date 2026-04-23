'use client';

import { useEffect, useRef } from 'react';
import {
  BackspaceIcon,
  SpeakerWaveIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { usePhraseBar } from '@/app/contexts/PhraseBarContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useTTS } from '@/lib/hooks/useTTS';
import PhraseBarChip from './PhraseBarChip';

interface PhraseBarProps {
  className?: string;
}

/**
 * PhraseBar — an accumulator below the Phrases grid that collects phrase chips
 * as the user taps tiles. Controlled by `settings.usePhraseBar`; no-op when off.
 */
export default function PhraseBar({ className = '' }: PhraseBarProps) {
  const { settings } = useSettings();
  const { items, removeLast, clear, joinedText } = usePhraseBar();
  const tts = useTTS();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to newest chip whenever items change (mirrors augy's ScrollViewReader).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [items.length]);

  if (!settings.usePhraseBar) return null;

  const handleSpeakOrStop = () => {
    if (tts.isSpeaking) {
      tts.stop();
      return;
    }
    if (!joinedText.trim()) return;
    tts.speak(joinedText);
  };

  const hasItems = items.length > 0;
  const isSpeaking = tts.isSpeaking;

  return (
    <div
      className={`shrink-0 border-b border-border bg-surface-hover px-3 py-2 ${className}`}
      data-testid="phrase-bar"
      role="region"
      aria-label="Phrase Bar"
    >
      <div className="flex items-center gap-2">
        <div
          ref={scrollerRef}
          className="flex-1 min-w-0 overflow-x-auto flex items-stretch gap-2 py-1"
        >
          {hasItems ? (
            items.map((item) => (
              <PhraseBarChip
                key={item.id}
                item={item}
                textSizePx={Math.max(14, Math.min(settings.textSize, 24))}
              />
            ))
          ) : (
            <p className="flex-1 text-center text-text-secondary text-sm py-2">
              Tap a Phrase to add it to the Phrase Bar
            </p>
          )}
        </div>
        {hasItems && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleSpeakOrStop}
              aria-label={
                isSpeaking
                  ? 'Stop speaking'
                  : 'Speak all phrases in the bar'
              }
              aria-pressed={isSpeaking}
              className={`p-3 rounded-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors ${
                isSpeaking
                  ? 'bg-warning hover:bg-warning/90 animate-pulse'
                  : 'bg-primary-500 hover:bg-primary-600'
              }`}
            >
              {isSpeaking ? (
                <StopIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={removeLast}
              aria-label="Remove the last phrase from the bar"
              className="p-3 rounded-full bg-surface text-foreground border border-border hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              <BackspaceIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={clear}
              aria-label="Clear the phrase bar"
              className="p-3 rounded-full bg-surface text-red-500 border border-border hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              <TrashIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
