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
}

export default function SpeakButton({
  onSpeak,
  onStop,
  onSelectTone,
  isSpeaking,
  disabled,
  enableToneControl,
}: SpeakButtonProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);

  // Speaking — Stop button
  if (isSpeaking) {
    return (
      <motion.button
        onClick={onStop}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-base"
        whileTap={{ scale: 0.95 }}
        aria-label="Stop"
      >
        <StopIcon className="w-5 h-5" />
        <span>Stop</span>
      </motion.button>
    );
  }

  // Tone control enabled — split button
  if (enableToneControl) {
    return (
      <>
        <div className={`flex items-center rounded-2xl shadow-lg overflow-hidden ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
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
          <div className="w-px h-6 bg-white/20 shrink-0" />
          <motion.button
            onClick={() => setShowToneSheet(true)}
            disabled={disabled}
            className="flex items-center px-3.5 py-3 transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white disabled:cursor-not-allowed"
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

  // Plain speak button
  return (
    <motion.button
      onClick={onSpeak}
      disabled={disabled}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg bg-primary-500 hover:bg-primary-600 text-white text-base"
      whileTap={{ scale: 0.95 }}
      aria-label="Speak"
    >
      <SpeakerWaveIcon className="w-5 h-5" />
      <span>Speak</span>
    </motion.button>
  );
}
