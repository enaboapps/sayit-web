'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { Phrase } from '@/lib/models/Phrase';
import { Symbol } from '@/lib/models/Symbol';
import { phraseStore } from '@/lib/stores/phraseStore';
import SymbolModal from '@/app/components/symbols/SymbolModal';
import { use } from 'react';
import Image from 'next/image';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function EditPhrasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [text, setText] = useState('');
  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const boardId = searchParams.get('boardId');
  const { getPhrase, updatePhrase, deletePhrase } = phraseStore();

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (!boardId) {
      router.back();
      return;
    }

    const fetchPhrase = async () => {
      try {
        const userId = user.id || '';
        const fetchedPhrase = await getPhrase(userId, boardId, resolvedParams.id);
        setPhrase(fetchedPhrase || null);
        setText(fetchedPhrase?.text || '');
        if (fetchedPhrase?.symbol_id) {
          const symbol = Symbol.fromId(fetchedPhrase.symbol_id);
          if (symbol) {
            await symbol.getImageURL();
            setSymbol(symbol);
          }
        }
      } catch (error) {
        console.error('Error fetching phrase:', error);
        setError('Failed to load phrase');
      } finally {
        setLoading(false);
      }
    };

    fetchPhrase();
  }, [resolvedParams.id, user, boardId, router, getPhrase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !boardId || !phrase) return;

    setError(null);

    try {
      if (!phrase.id) throw new Error('Phrase ID is missing');
      
      const updatedPhrase = new Phrase({
        ...phrase,
        text,
        symbol_id: symbol?.id || null,
      });
      await updatePhrase(phrase.id, updatedPhrase);
      router.back();
    } catch (error) {
      console.error('Error updating phrase:', error);
      setError('Failed to update phrase');
    }
  };

  const handleDelete = async () => {
    if (!phrase || !boardId || !phrase.id) return;

    try {
      await deletePhrase(phrase.id, boardId);
      router.back();
    } catch (error) {
      console.error('Error deleting phrase:', error);
      setError('Failed to delete phrase');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!phrase) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">Phrase not found</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Phrase</h1>
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
                    onClick={(e: React.MouseEvent) => {
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

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Phrase
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Phrase'}
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
