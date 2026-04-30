'use client';

import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';

export interface TonePreset {
  id: string;
  label: string;
  tag: string;
  /** Where to place the tag relative to the text (default 'before') */
  position?: 'before' | 'after';
  description: string;
  /** Requires eleven_v3 model to work properly */
  v3Only?: boolean;
}

export interface ToneCategory {
  label: string;
  presets: TonePreset[];
}

/** Apply a tone preset tag to text, respecting the tag position. */
export function applyToneTag(tone: TonePreset, text: string): string {
  if (tone.position === 'after') {
    return `${text} ${tone.tag}`;
  }
  return `${tone.tag} ${text}`;
}

export const TONE_CATEGORIES: ToneCategory[] = [
  {
    label: 'Delivery',
    presets: [
      { id: 'calm', label: 'Calm', tag: '[calmly]', description: 'Relaxed and gentle' },
      { id: 'excited', label: 'Excited', tag: '[excited]', description: 'Energetic and enthusiastic' },
      { id: 'cheerful', label: 'Cheerful', tag: '[cheerfully]', description: 'Bright and happy' },
      { id: 'whisper', label: 'Whisper', tag: '[whispers]', description: 'Soft and quiet' },
      { id: 'shout', label: 'Shout', tag: '[shouts]', description: 'Loud and forceful' },
    ],
  },
  {
    label: 'Emotions',
    presets: [
      { id: 'sad', label: 'Sad', tag: '[sadly]', description: 'Somber and low' },
      { id: 'angry', label: 'Angry', tag: '[angrily]', description: 'Forceful and intense' },
      { id: 'scared', label: 'Scared', tag: '[scared]', description: 'Anxious and fearful' },
      { id: 'frustrated', label: 'Frustrated', tag: '[frustrated]', description: 'Tense and strained' },
      { id: 'surprised', label: 'Surprised', tag: '[surprised]', description: 'Startled and wide-eyed' },
      { id: 'sarcastic', label: 'Sarcastic', tag: '[sarcastic]', description: 'Dry and ironic' },
    ],
  },
  {
    label: 'Sounds',
    presets: [
      { id: 'sigh', label: 'Sigh', tag: '[sighs]', description: 'Sigh before speaking', v3Only: true },
      { id: 'laugh', label: 'Laugh', tag: '[laughs]', description: 'Laugh before speaking', v3Only: true },
      { id: 'giggle', label: 'Giggle', tag: '[giggles]', description: 'Giggle before speaking', v3Only: true },
      { id: 'yawn', label: 'Yawn', tag: '[yawns]', description: 'Yawn before speaking', v3Only: true },
      { id: 'cry', label: 'Cry', tag: '[cries]', description: 'Cry before speaking', v3Only: true },
      { id: 'clear-throat', label: 'Clear throat', tag: '[clears throat]', description: 'Clear throat before speaking', v3Only: true },
      { id: 'cough', label: 'Cough', tag: '[coughs]', description: 'Cough before speaking', v3Only: true },
    ],
  },
];

/** Flat list of all presets, for backwards compatibility */
export const TONE_PRESETS: TonePreset[] = TONE_CATEGORIES.flatMap(c => c.presets);

interface ToneSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTone: (tone: TonePreset) => void;
  onSpeakWithoutTone: () => void;
}

function ToneOptions({ onSelectTone, onSpeakWithoutTone, onClose }: Omit<ToneSheetProps, 'isOpen'>) {
  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => {
          onSpeakWithoutTone();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
      >
        <SpeakerWaveIcon className="w-5 h-5 shrink-0" />
        <div className="text-left">
          <span className="block text-sm font-medium">Speak normally</span>
          <span className="block text-xs opacity-80">No tone applied</span>
        </div>
      </button>

      {TONE_CATEGORIES.map((category) => (
        <div key={category.label}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {category.label}
            </h3>
            {category.presets.some(p => p.v3Only) && (
              <span className="text-xs text-primary-400 font-medium">v3</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {category.presets.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => {
                  onSelectTone(tone);
                  onClose();
                }}
                className="flex flex-col items-start px-4 py-3 rounded-2xl bg-surface-hover hover:bg-surface text-left transition-colors border border-border hover:border-primary-500"
              >
                <span className="text-sm font-medium text-foreground">{tone.label}</span>
                <span className="text-xs text-text-secondary">{tone.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ToneSheet({ isOpen, onClose, onSelectTone, onSpeakWithoutTone }: ToneSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="How should this sound?"
      snapPoints={[100]}
      showHandle={true}
      showCloseButton={true}
    >
      <ToneOptions
        onSelectTone={onSelectTone}
        onSpeakWithoutTone={onSpeakWithoutTone}
        onClose={onClose}
      />
    </BottomSheet>
  );
}
