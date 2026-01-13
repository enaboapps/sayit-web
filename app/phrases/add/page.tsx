'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';

function AddPhraseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);

  // Fetch board to check for duplicate phrases
  const boardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    boardId ? { id: boardId as Id<'phraseBoards'> } : 'skip'
  );

  // Check if phrase text already exists on the board
  const isDuplicate = useMemo(() => {
    if (!boardData || !text.trim()) return false;
    return boardData.phrase_board_phrases?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pbp: any) => pbp.phrase?.text === text.trim()
    );
  }, [boardData, text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;

    setLoading(true);
    try {
      // Create the phrase
      const phraseId = await addPhrase({
        text,
        frequency: 0,
        position: 0, // Will be adjusted by backend based on board
      });

      // Add it to the board
      await addPhraseToBoard({
        phraseId: phraseId as Id<'phrases'>,
        boardId: boardId as Id<'phraseBoards'>,
      });

      router.back();
    } catch (error) {
      console.error('Error adding phrase:', error);
      setError('Failed to add phrase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-foreground mt-4">Add New Phrase</h1>

        <form onSubmit={handleSubmit} className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8 mt-6">
          <Input
            id="text"
            type="text"
            label="Phrase Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your phrase"
            required
          />

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          {isDuplicate && (
            <div className="mb-4 text-amber-600 text-sm bg-amber-500/10 px-4 py-3 rounded-3xl">
              This phrase already exists on the board
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || isDuplicate || !text.trim()}
            >
              {loading ? 'Adding...' : 'Add Phrase'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddPhrasePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <AddPhraseForm />
    </Suspense>
  );
}
