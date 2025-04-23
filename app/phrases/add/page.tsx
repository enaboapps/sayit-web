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
      await phraseStore.getState().addPhrase(phraseData, boardId, symbol?.url || null);
      router.push(`/phrases?boardId=${boardId}`);
    } catch (error) {
      console.error('Error adding phrase:', error);
      setError('Failed to add phrase');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSelect = (selectedSymbol: Symbol) => {
    setSymbol(selectedSymbol);
    setIsSymbolModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Phrase</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="text" className="block text-gray-700 text-sm font-bold mb-2">
              Phrase Text
            </label>
            <input
              type="text"
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
              placeholder="Enter your phrase"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Symbol
            </label>
            <button
              type="button"
              onClick={() => setIsSymbolModalOpen(true)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
            >
              {symbol ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg overflow-hidden relative">
                      <Image
                        src={symbol.url || ''}
                        alt={`Symbol ${symbol.id}`}
                        fill
                        className="object-contain p-1"
                        unoptimized={symbol.url?.startsWith('blob:')}
                      />
                    </div>
                    <span>Selected symbol</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSymbol(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                'Select a symbol'
              )}
            </button>
            <p className="mt-1 text-sm text-gray-500">Optional - Select a symbol to represent this phrase</p>
          </div>

          <button
            type="submit"
            disabled={loading || !boardId}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Phrase'}
          </button>

          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}
        </form>

        <SymbolModal
          isOpen={isSymbolModalOpen}
          onClose={() => setIsSymbolModalOpen(false)}
          onSymbolSelect={handleSymbolSelect}
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
