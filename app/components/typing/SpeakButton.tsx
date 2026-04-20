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
  variant?: 'pill' | 'icon';
}

export default function SpeakButton({
  onSpeak,
  onStop,
  onSelectTone,
  isSpeaking,
  disabled,
  enableToneControl,
  variant = 'pill',
}: SpeakButtonProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);

  const isIcon = variant === 'icon';

  // Speaking — Stop button
  if (isSpeaking) {
    return (
      <motion.button
        onClick={onStop}
        className={isIcon
          ? 'flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all duration-200 shadow-lg bg-error hover:bg-error-hover text-white'
          : 'flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 shadow-lg bg-error hover:bg-error-hover text-white text-base'
        }
        whileTap={{ scale: 0.95 }}
        aria-label="Stop"
      >
        <StopIcon className={isIcon ? 'w-6 h-6' : 'w-5 h-5'} />
        {!isIcon && <span>Stop</span>}
      </motion.button>
    );
  }

  // Tone control enabled — split button (pill) or stacked buttons (icon)
  if (enableToneControl) {
    if (isIcon) {
      return (
        <>
          <motion.button
            onClick={() => setShowToneSheet(true)}
            disabled={disabled}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 bg-primary-400 hover:bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={disabled ? undefined : { scale: 0.95 }}
            aria-label="Choose tone"
          >
            <AudioWaveform className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onSpeak}
            disabled={disabled}
            className="flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg bg-primary-500 hover:bg-primary-600 text-white"
            whileTap={disabled ? undefined : { scale: 0.95 }}
            aria-label="Speak"
          >
            <SpeakerWaveIcon className="w-6 h-6" />
          </motion.button>
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

    return (
      <>
        <div className={`flex rounded-2xl shadow-lg overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <motion.button
            onClick={onSpeak}
            disabled={disabled}
            className="flex items-center gap-2 pl-6 pr-4 py-3 font-bold transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white text-base disabled:cursor-not-allowed"
            whileTap={disabled ? undefined : { scale: 0.97 }}
            aria-label="Speak"
          >
            <SpeakerWaveIcon className="w-5 h-5" />
            <span>Speak</span>
          </motion.button>
          <div className="w-px self-stretch bg-white/20 shrink-0" />
          <motion.button
            onClick={() => setShowToneSheet(true)}
            disabled={disabled}
            className="flex items-center px-3.5 py-3 transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white disabled:cursor-not-allowed"
            whileTap={disabled ? undefined : { scale: 0.97 }}
            aria-label="Choose tone"
            title="Choose tone"
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

  // Plain speak button
  return (
    <motion.button
      onClick={onSpeak}
      disabled={disabled}
      className={isIcon
        ? 'flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg bg-primary-500 hover:bg-primary-600 text-white'
        : 'flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg bg-primary-500 hover:bg-primary-600 text-white text-base'
      }
      whileTap={{ scale: 0.95 }}
      aria-label="Speak"
    >
      <SpeakerWaveIcon className={isIcon ? 'w-6 h-6' : 'w-5 h-5'} />
      {!isIcon && <span>Speak</span>}
    </motion.button>
  );
}
