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
        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all duration-200 shadow-md bg-gradient-to-r from-red-500 to-red-600 text-white text-sm"
        whileTap={{ scale: 0.95 }}
        aria-label="Stop"
      >
        <StopIcon className="w-4 h-4" />
        <span>Stop</span>
      </motion.button>
    );
  }

  // Tone control enabled — split button
  if (enableToneControl) {
    return (
      <>
        <div className={`flex items-center rounded-full shadow-md overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <motion.button
            onClick={onSpeak}
            disabled={disabled}
            className="flex items-center gap-1.5 pl-4 pr-3 py-2 font-semibold transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white text-sm disabled:cursor-not-allowed"
            whileTap={disabled ? undefined : { scale: 0.97 }}
            aria-label="Speak"
          >
            <SpeakerWaveIcon className="w-4 h-4" />
            <span>Speak</span>
          </motion.button>
          <div className="w-px h-5 bg-white/20 shrink-0" />
          <motion.button
            onClick={() => setShowToneSheet(true)}
            disabled={disabled}
            className="flex items-center px-2.5 py-2 transition-colors duration-200 bg-primary-500 hover:bg-primary-600 text-white disabled:cursor-not-allowed"
            whileTap={disabled ? undefined : { scale: 0.97 }}
            aria-label="Choose tone"
          >
            <AudioWaveform className="w-3.5 h-3.5" />
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
      className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md bg-primary-500 hover:bg-primary-600 text-white text-sm"
      whileTap={{ scale: 0.95 }}
      aria-label="Speak"
    >
      <SpeakerWaveIcon className="w-4 h-4" />
      <span>Speak</span>
    </motion.button>
  );
}
