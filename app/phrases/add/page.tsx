'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Symbol } from '@/lib/models/Symbol';
import { phraseStore } from '@/lib/stores/phraseStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { PhraseData } from '@/lib/models/Phrase';
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
  const user = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user?.id || !boardId) return;

    setLoading(true);
    try {
      const phraseData: PhraseData = {
        text,
        userId: user.user.id,
        symbol_id: symbol?.id || undefined,
      };
      await phraseStore.getState().addPhrase(phraseData, boardId);
      router.back();
    } catch (error) {
      console.error('Error adding phrase:', error);
      setError('Failed to add phrase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Add New Phrase</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-6">
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
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Symbol
            </label>
            <SymbolSelector
              symbol={symbol}
              onSymbolSelect={setSymbol}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Optional - Select a symbol to represent this phrase</p>
          </div>

          {error && (
            <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
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
    <Suspense fallback={<div className="text-gray-900 dark:text-gray-100">Loading...</div>}>
      <AddPhraseForm />
    </Suspense>
  );
}
