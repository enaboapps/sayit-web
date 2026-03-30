'use client';

import { useState } from 'react';
import { SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/outline';
import { AudioWaveform } from 'lucide-react';
import { motion } from 'framer-motion';
import ToneSheet from './ToneSheet';
import type { TonePreset } from './ToneSheet';

interface SpeakButtonProps {
  onSpeak: () => void;
  onStop?: () => void;
  onSelectTone: (tone: TonePreset) => void;
  isSpeaking: boolean;
  disabled: boolean;
  enableToneControl: boolean;
  /** 'dock' for mobile TypingDock styling, 'area' for desktop TypingArea styling */
  variant: 'dock' | 'area';
}

export default function SpeakButton({
  onSpeak,
  onStop,
  onSelectTone,
  isSpeaking,
  disabled,
  enableToneControl,
  variant,
}: SpeakButtonProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);

  // Speaking state — full Stop button, no split
  if (isSpeaking) {
    if (variant === 'dock') {
      return (
        <motion.button
          onClick={onStop}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white"
          whileTap={{ scale: 0.95 }}
          aria-label="Stop"
        >
          <StopIcon className="w-5 h-5" />
          <span>Stop</span>
        </motion.button>
      );
    }

    return (
      <button
        onClick={onStop}
        className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md bg-gradient-to-r from-red-500 to-red-600 text-white"
        aria-label="Stop"
      >
        <StopIcon className="w-5 h-5" />
        <span>Stop</span>
      </button>
    );
  }

  // Not speaking, tone control enabled — split button
  if (enableToneControl) {
    if (variant === 'dock') {
      return (
        <>
          <div className={`flex items-center rounded-full shadow-lg overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <motion.button
              onClick={onSpeak}
              disabled={disabled}
              className="flex items-center gap-2 pl-6 pr-4 py-3 font-semibold transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white disabled:cursor-not-allowed"
              whileTap={disabled ? undefined : { scale: 0.97 }}
              aria-label="Speak"
            >
              <SpeakerWaveIcon className="w-5 h-5" />
              <span>Speak</span>
            </motion.button>
            <div className="w-px h-6 bg-white/20 shrink-0" />
            <motion.button
              onClick={() => setShowToneSheet(true)}
              disabled={disabled}
              className="flex items-center px-3 py-3 transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white disabled:cursor-not-allowed"
              whileTap={disabled ? undefined : { scale: 0.97 }}
              aria-label="Choose tone"
            >
              <AudioWaveform className="w-4 h-4" />
            </motion.button>
          </div>
          <ToneSheet
            isOpen={showToneSheet}
            onClose={() => setShowToneSheet(false)}
            onSelectTone={onSelectTone}
            onSpeakWithoutTone={() => {
              onSpeak();
              setShowToneSheet(false);
            }}
          />
        </>
      );
    }

    // Area variant — desktop split button
    return (
      <>
        <div className={`flex items-center rounded-full shadow-md overflow-hidden flex-1 min-w-[140px] h-12 ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'} transition-all duration-200`}>
          <button
            onClick={onSpeak}
            disabled={disabled}
            className="flex-1 h-full flex items-center justify-center gap-2 font-medium bg-surface hover:bg-surface-hover text-foreground hover:text-primary-500 transition-colors duration-200 disabled:cursor-not-allowed"
            aria-label="Speak"
          >
            <SpeakerWaveIcon className="w-5 h-5" />
            <span>Speak</span>
          </button>
          <div className="w-px h-6 bg-border shrink-0" />
          <button
            onClick={() => setShowToneSheet(true)}
            disabled={disabled}
            className="h-full flex items-center px-3 bg-surface hover:bg-surface-hover text-foreground hover:text-primary-500 transition-colors duration-200 disabled:cursor-not-allowed"
            aria-label="Choose tone"
          >
            <AudioWaveform className="w-4 h-4" />
          </button>
        </div>
        <ToneSheet
          isOpen={showToneSheet}
          onClose={() => setShowToneSheet(false)}
          onSelectTone={onSelectTone}
          onSpeakWithoutTone={() => {
            onSpeak();
            setShowToneSheet(false);
          }}
        />
      </>
    );
  }

  // No tone control — plain button
  if (variant === 'dock') {
    return (
      <motion.button
        onClick={onSpeak}
        disabled={disabled}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg bg-primary-500 hover:bg-primary-600 text-white"
        whileTap={{ scale: 0.95 }}
        aria-label="Speak"
      >
        <SpeakerWaveIcon className="w-5 h-5" />
        <span>Speak</span>
      </motion.button>
    );
  }

  return (
    <button
      onClick={onSpeak}
      disabled={disabled}
      className="flex-1 min-w-[140px] h-12 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 bg-surface hover:bg-surface-hover text-foreground hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Speak"
    >
      <SpeakerWaveIcon className="w-5 h-5" />
      <span>Speak</span>
    </button>
  );
}
