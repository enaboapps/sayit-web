'use client';

import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export interface TonePreset {
  id: string;
  label: string;
  tag: string;
  /** Where to place the tag relative to the text (default 'before') */
  position?: 'before' | 'after';
  description: string;
}

/** Apply a tone preset tag to text, respecting the tag position. */
export function applyToneTag(tone: TonePreset, text: string): string {
  if (tone.position === 'after') {
    return `${text} ${tone.tag}`;
  }
  return `${tone.tag} ${text}`;
}

export const TONE_PRESETS: TonePreset[] = [
  { id: 'calm', label: 'Calm', tag: '[calmly]', description: 'Relaxed and gentle' },
  { id: 'excited', label: 'Excited', tag: '[excited]', description: 'Energetic and enthusiastic' },
  { id: 'whisper', label: 'Whisper', tag: '[whispers]', description: 'Soft and quiet' },
  { id: 'sad', label: 'Sad', tag: '[sadly]', description: 'Somber and low' },
  { id: 'angry', label: 'Angry', tag: '[angrily]', description: 'Forceful and intense' },
  { id: 'cheerful', label: 'Cheerful', tag: '[cheerfully]', description: 'Bright and happy' },
  { id: 'sigh-before', label: 'Sigh (before)', tag: '[sighs]', position: 'before', description: 'Sigh, then speak' },
  { id: 'sigh-after', label: 'Sigh (after)', tag: '[sighs]', position: 'after', description: 'Speak, then sigh' },
];

interface ToneSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTone: (tone: TonePreset) => void;
  onSpeakWithoutTone: () => void;
}

function ToneOptions({ onSelectTone, onSpeakWithoutTone, onClose }: Omit<ToneSheetProps, 'isOpen'>) {
  return (
    <div className="p-4 space-y-3">
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

      <div className="grid grid-cols-2 gap-2">
        {TONE_PRESETS.map((tone) => (
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
  );
}

export default function ToneSheet({ isOpen, onClose, onSelectTone, onSpeakWithoutTone }: ToneSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="How should this sound?"
        snapPoints={[55]}
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

  // Desktop: centered dialog
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm rounded-3xl bg-surface shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-foreground px-4 pt-4 pb-2">
                  How should this sound?
                </Dialog.Title>
                <ToneOptions
                  onSelectTone={onSelectTone}
                  onSpeakWithoutTone={onSpeakWithoutTone}
                  onClose={onClose}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
