'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import { AAC_PRESETS, type AacLayoutPreset } from '@/lib/aacLayout';
import { useSettings } from '@/app/contexts/SettingsContext';

type BoardCreationMode = 'blank' | 'aac' | 'existing';

export default function AddBoardPage() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<BoardCreationMode>('blank');
  const { settings } = useSettings();
  const [preset, setPreset] = useState<AacLayoutPreset>(settings.aacGridPresetPreference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Convex mutations
  const boards = useQuery(api.phraseBoards.getPhraseBoards);
  const addPhraseBoard = useMutation(api.phraseBoards.addPhraseBoard);
  const createAACStarterBoard = useMutation(api.phraseBoards.createAACStarterBoard);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Get the current number of boards to set position
      const position = boards?.length || 0;

      if (mode === 'aac') {
        await createAACStarterBoard({
          name,
          preset,
          position,
        });
      } else {
        await addPhraseBoard({
          name,
          position,
        });
      }

      router.back();
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Create New Board" backHref="/" />
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Board Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter board name"
              required
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-text-secondary">Board type</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: 'blank', title: 'Blank phrase board', body: 'Flexible board for custom phrases.' },
                { id: 'aac', title: 'AAC core board', body: 'Stable fixed grid with core vocabulary.' },
                { id: 'existing', title: 'From existing board', body: 'Copy a board layout later.', disabled: true },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => setMode(option.id as BoardCreationMode)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    mode === option.id
                      ? 'border-primary-500 bg-primary-950 text-primary-100'
                      : 'border-border bg-surface hover:bg-surface-hover'
                  } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="block text-sm font-semibold text-foreground">{option.title}</span>
                  <span className="mt-1 block text-xs text-text-secondary">{option.body}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {mode === 'aac' && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-text-secondary">AAC grid preset</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(AAC_PRESETS) as AacLayoutPreset[]).map((presetKey) => {
                  const option = AAC_PRESETS[presetKey];
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setPreset(presetKey)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        preset === presetKey
                          ? 'border-primary-500 bg-primary-950 text-primary-100'
                          : 'border-border bg-surface hover:bg-surface-hover'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                      <span className="mt-1 block text-xs text-text-secondary">{option.rows} x {option.columns}</span>
                      <span className="mt-2 block text-xs text-text-tertiary">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-status-error rounded-3xl text-red-500 mt-4">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
