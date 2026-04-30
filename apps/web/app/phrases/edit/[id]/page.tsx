'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TrashIcon } from '@heroicons/react/24/outline';
import { use } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import { SymbolSelector } from '@/app/components/symbols';
import { useAuth } from '@/app/contexts/AuthContext';
import type { Id } from '@/convex/_generated/dataModel';

export default function EditPhrasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [text, setText] = useState('');
  const [symbolStorageId, setSymbolStorageId] = useState<Id<'_storage'> | null>(null);
  const [symbolPreviewUrl, setSymbolPreviewUrl] = useState<string | null>(null);
  const [symbolChanged, setSymbolChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const { user, loading: authLoading } = useAuth();
  const shouldLoadPhrase = !authLoading && !!user;
  const phraseId = resolvedParams.id as unknown as Id<'phrases'>;

  // Convex query and mutations
  const phrase = useQuery(
    api.phrases.getPhrase,
    shouldLoadPhrase ? { id: phraseId } : 'skip'
  );
  const updatePhrase = useMutation(api.phrases.updatePhrase);
  const deletePhrase = useMutation(api.phrases.deletePhrase);
  const removePhraseFromBoard = useMutation(api.phraseBoards.removePhraseFromBoard);

  const loading = authLoading || (shouldLoadPhrase && phrase === undefined);

  useEffect(() => {
    if (!boardId) {
      router.back();
      return;
    }
  }, [boardId, router]);

  useEffect(() => {
    if (phrase) {
      setText(phrase.text);
      setSymbolPreviewUrl(phrase.symbolUrl ?? null);
      setSymbolStorageId(phrase.symbolStorageId ?? null);
    }
  }, [phrase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId || !phrase) return;

    setError(null);
    setSaving(true);

    try {
      await updatePhrase({
        id: phraseId,
        text,
        ...(symbolChanged && symbolStorageId ? { symbolStorageId } : {}),
        ...(symbolChanged && !symbolStorageId ? { removeSymbol: true } : {}),
      });
      router.back();
    } catch (error) {
      console.error('Error updating phrase:', error);
      setError('Failed to update phrase');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!phrase || !boardId) return;

    try {
      // Remove from board first
      await removePhraseFromBoard({
        phraseId,
        boardId: boardId as Id<'phraseBoards'>,
      });

      // Then delete the phrase
      await deletePhrase({
        id: phraseId,
      });

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
      <PageHeader title="Edit Phrase" backHref="/" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8">
          <Input
            id="text"
            type="text"
            label="Phrase Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your phrase"
            required
          />

          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">
              Symbol
            </label>
            <SymbolSelector
              symbolUrl={symbolPreviewUrl}
              symbolStorageId={symbolStorageId}
              onSymbolChange={(symbol) => {
                setSymbolChanged(true);
                if (symbol) {
                  setSymbolStorageId(symbol.storageId);
                  setSymbolPreviewUrl(symbol.url);
                } else {
                  setSymbolStorageId(null);
                  setSymbolPreviewUrl(null);
                }
              }}
              phraseText={text}
            />
          </div>

          {error && (
            <div className="mt-4 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
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
