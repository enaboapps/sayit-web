'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';
import BottomSheet from '@/app/components/ui/BottomSheet';

interface FleshOutBottomSheetProps {
  isOpen: boolean;
  initialText: string;
  onClose: () => void;
  onApply: (text: string) => void;
}

type GenerationMode = 'want' | 'need' | 'feel' | 'think' | 'ask' | 'like' | 'dislike' | 'remember' | 'wonder' | 'hope';

const MODES: { mode: GenerationMode; label: string }[] = [
  { mode: 'want', label: 'I want...' },
  { mode: 'need', label: 'I need...' },
  { mode: 'feel', label: 'I feel...' },
  { mode: 'think', label: 'I think...' },
  { mode: 'ask', label: 'I want to ask...' },
  { mode: 'like', label: 'I like...' },
  { mode: 'dislike', label: 'I don\'t like...' },
  { mode: 'remember', label: 'I remember...' },
  { mode: 'wonder', label: 'I wonder...' },
  { mode: 'hope', label: 'I hope...' },
];

export default function FleshOutBottomSheet({ isOpen, initialText, onClose, onApply }: FleshOutBottomSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<GenerationMode | null>(null);

  const handleModeSelect = async (mode: GenerationMode) => {
    setActiveMode(mode);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/flesh-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: initialText,
          mode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.text) {
        throw new Error('No text returned from server');
      }

      onApply(data.text);
      onClose();
    } catch (err) {
      console.error('Error generating text:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate text');
    } finally {
      setIsGenerating(false);
      setActiveMode(null);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Flesh Out"
      snapPoints={[60]}
      initialSnap={0}
    >
      <div className="p-4 space-y-4">
        {/* Preview of current text */}
        <div className="bg-surface-hover p-3 rounded-xl text-foreground text-sm line-clamp-2">
          {initialText}
        </div>

        {/* Subscription gate for the mode buttons */}
        <SubscriptionWrapper
          fallback={
            <div className="bg-surface-hover p-6 rounded-xl text-center">
              <svg className="w-10 h-10 mx-auto text-text-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground mb-2">Pro Feature</h3>
              <p className="text-text-secondary text-sm mb-4">
                Enhance your messages with AI assistance.
              </p>
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
              >
                Upgrade to Pro
              </Button>
            </div>
          }
        >
          <div>
            <p className="text-sm text-text-secondary mb-3">
              Select how you want to continue:
            </p>

            {/* 2-column grid of mode buttons */}
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => handleModeSelect(mode)}
                  disabled={isGenerating}
                  className={`min-h-[48px] px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isGenerating && activeMode === mode
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                      : 'bg-surface hover:bg-surface-hover text-foreground border border-border hover:border-purple-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGenerating && activeMode === mode ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    label
                  )}
                </button>
              ))}
            </div>
          </div>
        </SubscriptionWrapper>

        {error && (
          <div className="text-red-500 text-sm text-center p-2 bg-status-error rounded-lg">
            {error}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
