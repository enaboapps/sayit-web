'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Symbol } from '@/lib/models/Symbol';
import SymbolModal from '@/app/components/symbols/SymbolModal';
import { phraseStore } from '@/lib/stores/phraseStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { PhraseData } from '@/lib/models/Phrase';
import Image from 'next/image';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

function AddPhraseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const [text, setText] = useState('');
  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
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
      router.push(`/phrases?boardId=${boardId}`);
    } catch (error) {
      console.error('Error adding phrase:', error);
      setError('Failed to add phrase');
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
            onClick={() => router.push('/phrases')}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Phrases
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Phrase</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
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
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Symbol
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSymbolModalOpen(true)}
              className="w-full justify-start"
            >
              {symbol ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg overflow-hidden relative">
                      <Image
                        src={symbol.url ?? ''}
                        alt={`Symbol ${symbol.id}`}
                        fill
                        className="object-contain p-1"
                        unoptimized={symbol.url?.startsWith('blob:')}
                      />
                    </div>
                    <span>Selected symbol</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSymbol(null);
                    }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                'Select a symbol'
              )}
            </Button>
            <p className="mt-1 text-sm text-gray-500">Optional - Select a symbol to represent this phrase</p>
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

        <SymbolModal
          isOpen={isSymbolModalOpen}
          onClose={() => setIsSymbolModalOpen(false)}
          onSymbolSelect={setSymbol}
        />
      </div>
    </div>
  );
}

export default function AddPhrasePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddPhraseForm />
    </Suspense>
  );
}
