'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { GeneratedPhrases } from '@/app/components/phrases/GeneratedPhrases';
import { Collapsible } from '@/components/ui/Collapsible';

export default function AddBoardPage() {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPhrases, setGeneratedPhrases] = useState<{name: string, phrases: string[]}[]>([]);
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
      setGeneratedPhrases(data.text);
    } catch (error) {
      console.error('Error generating phrases:', error);
      setError('Failed to generate phrases');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePhrase = (categoryIndex: number, phraseIndex: number) => {
    setGeneratedPhrases(prev => {
      // Create a deep copy of the phrases array
      const newPhrases = prev.map(category => ({
        name: category.name,
        phrases: [...category.phrases]
      }));
      
      // Remove the specific phrase
      newPhrases[categoryIndex].phrases.splice(phraseIndex, 1);
      
      // Remove category if it's empty
      if (newPhrases[categoryIndex].phrases.length === 0) {
        newPhrases.splice(categoryIndex, 1);
      }
      
      return newPhrases;
    });
  };

  const handleDeleteAll = () => {
    setGeneratedPhrases([]);
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
          generatedPhrases.flatMap(category => 
            category.phrases.map(phrase => 
              phraseStore.getState().addPhrase({
                text: phrase,
                userId: user.id,
              }, newBoard.id as string),
            ),
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Board</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Use AI to generate suggested phrases for your board. This is completely optional - you can always add phrases manually later.
              </p>

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
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
          </Collapsible>

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
