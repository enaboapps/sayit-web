'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Textarea } from '@/app/components/ui/Textarea';
import { GeneratedPhrases } from '@/app/components/phrases/GeneratedPhrases';
import { Collapsible } from '@/app/components/ui/Collapsible';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';
import BackButton from '@/app/components/ui/BackButton';

export default function AddBoardPage() {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPhrases, setGeneratedPhrases] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  // Convex mutations
  const boards = useQuery(api.phraseBoards.getPhraseBoards);
  const addPhraseBoard = useMutation(api.phraseBoards.addPhraseBoard);
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);

  const handleGeneratePhrases = async () => {
    if (!prompt) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate phrases');
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setGeneratedPhrases(data);
    } catch (error) {
      console.error('Error generating phrases:', error);
      setError('Failed to generate phrases');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePhrase = (index: number) => {
    setGeneratedPhrases(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAll = () => {
    setGeneratedPhrases([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Get the current number of boards to set position
      const position = boards?.length || 0;

      // Create the board
      const boardId = await addPhraseBoard({
        name,
        position,
      });

      // Add generated phrases to the board
      if (generatedPhrases.length > 0) {
        for (let i = 0; i < generatedPhrases.length; i++) {
          const phraseId = await addPhrase({
            text: generatedPhrases[i],
            frequency: 0,
            position: i,
          });

          await addPhraseToBoard({
            phraseId: phraseId as Id<'phrases'>,
            boardId: boardId as Id<'phraseBoards'>,
          });
        }
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
      <div className="max-w-2xl mx-auto p-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-foreground mb-6">Create New Board</h1>

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

          <Collapsible
            title="AI-Assisted Phrase Generation (Optional)"
            defaultOpen={false}
          >
            <SubscriptionWrapper
              fallback={
                <div className="bg-surface p-6 rounded-lg text-center my-4">
                  <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pro Feature</h3>
                  <p className="text-text-secondary mb-6">
                    AI-Assisted Phrase Generation is a premium feature that helps you create relevant phrases quickly using AI.
                  </p>
                  <Button
                    onClick={() => router.push('/pricing')}
                    className="w-full"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Use AI to generate suggested phrases for your board. This is completely optional - you can always add phrases manually later.
                </p>

                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-1">
                    Generation Prompt
                  </label>
                  <div className="space-y-4">
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what kind of phrases you want to generate"
                      rows={4}
                    />
                    <Button
                      type="button"
                      onClick={handleGeneratePhrases}
                      disabled={!prompt || generating}
                    >
                      {generating ? 'Generating...' : 'Generate Phrases'}
                    </Button>
                  </div>
                </div>

                <GeneratedPhrases
                  phrases={generatedPhrases}
                  onDeletePhrase={handleDeletePhrase}
                  onDeleteAll={handleDeleteAll}
                />
              </div>
            </SubscriptionWrapper>
          </Collapsible>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-lg text-red-700 mt-4">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
