'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Symbol } from '@/lib/models/Symbol';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import SymbolSelector from '@/app/components/symbols/SymbolSelector';
import BackButton from '@/app/components/ui/BackButton';

function AddPhraseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const [text, setText] = useState('');
  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;

    setLoading(true);
    try {
      // Create the phrase
      const phraseId = await addPhrase({
        text,
        symbolId: symbol?.id,
        frequency: 0,
        position: 0, // Will be adjusted by backend based on board
      });

      // Add it to the board
      await addPhraseToBoard({
        phraseId: phraseId as any,
        boardId: boardId as any,
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
    <div className="min-h-screen bg-gray-100 bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 text-foreground mt-4">Add New Phrase</h1>

        <form onSubmit={handleSubmit} className="bg-white bg-surface shadow-md rounded-lg p-6 mt-6">
          <Input
            id="text"
            type="text"
            label="Phrase Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your phrase"
            required
          />

          <div className="mb-6">
            <label className="block text-gray-700 text-text-secondary text-sm font-bold mb-2">
              Symbol
            </label>
            <SymbolSelector
              symbol={symbol}
              onSymbolSelect={setSymbol}
            />
            <p className="mt-1 text-sm text-gray-500 text-text-secondary">Optional - Select a symbol to represent this phrase</p>
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
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
    <Suspense fallback={<div className="text-gray-900 text-foreground">Loading...</div>}>
      <AddPhraseForm />
    </Suspense>
  );
}
