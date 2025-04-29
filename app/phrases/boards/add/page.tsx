'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Collapsible } from '@/components/ui/Collapsible';

export default function AddBoardPage() {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPhrases, setGeneratedPhrases] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

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
      setGeneratedPhrases(data.board);
    } catch (error) {
      console.error('Error generating phrases:', error);
      setError('Failed to generate phrases');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Create the board
      await phraseStore.getState().createPhraseBoard(user.id, name);
      
      // Fetch the boards to get the newly created board
      await phraseStore.getState().fetchBoards(user.id);
      const boards = phraseStore.getState().boards;
      const newBoard = boards.find(board => board.name === name);
      
      if (!newBoard) {
        throw new Error('Failed to find newly created board');
      }

      // Add generated phrases to the board
      if (generatedPhrases.length > 0) {
        await Promise.all(
          generatedPhrases.map(phrase => 
            phraseStore.getState().addPhrase({
              text: phrase,
              userId: user.id,
            }, newBoard.id as string),
          ),
        );
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Phrases
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Board</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <Input
            id="name"
            type="text"
            label="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
            required
          />

          <div className="mt-6">
            <Collapsible 
              title="AI-Assisted Phrase Generation (Optional)"
              defaultOpen={false}
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Use AI to generate suggested phrases for your board. This is completely optional - you can always add phrases manually later.
                </p>

                <Textarea
                  id="prompt"
                  label="Generation Prompt"
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                  placeholder="Describe the types of phrases you'd like to generate"
                  rows={3}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePhrases}
                  disabled={!prompt || generating}
                  className="w-full"
                >
                  {generating ? 'Generating...' : 'Generate Suggested Phrases'}
                </Button>

                {generatedPhrases.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Generated Phrases</h3>
                    <ul className="space-y-2">
                      {generatedPhrases.map((phrase, index) => (
                        <li key={index} className="p-2 bg-gray-50 rounded text-black">
                          {phrase}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
