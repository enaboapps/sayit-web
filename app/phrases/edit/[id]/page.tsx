'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import { Phrase } from '@/lib/models/Phrase';
import { use } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';
import { Symbol } from '@/lib/models/Symbol';
import SymbolSelector from '@/app/components/symbols/SymbolSelector';

export default function EditPhrasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [text, setText] = useState('');
  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [saving, setSaving] = useState(false);
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
  }, [resolvedParams.id, user, router, getPhrase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !boardId || !phrase) return;

    setError(null);
    setSaving(true);

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
    } finally {
      setSaving(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!phrase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-600">Phrase not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-foreground mt-4">Edit Phrase</h1>

        <form onSubmit={handleSubmit} className="bg-surface shadow-md rounded-lg p-6 mt-6">
          <Input
            id="text"
            type="text"
            label="Phrase Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your phrase"
            required
          />

          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Symbol
            </label>
            <SymbolSelector
              symbol={symbol}
              onSymbolSelect={setSymbol}
            />
            <p className="mt-1 text-sm text-text-tertiary">Optional - Select a symbol to represent this phrase</p>
          </div>

          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
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
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
