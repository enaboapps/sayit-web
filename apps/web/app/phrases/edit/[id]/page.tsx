'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TrashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
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
  // Pull the board's tiles so we can detect whether this phrase is wired up
  // as a locked AAC core tile. Locked-core tiles back the motor-planning
  // contract: their deletion would leave the board with a "ghost" cell users
  // expect to find. We disable the delete affordance entirely rather than
  // pipe `confirmLockedCoreDelete` through the mutation chain.
  const boardTiles = useQuery(
    api.boardTiles.listByBoard,
    shouldLoadPhrase && boardId ? { boardId: boardId as Id<'phraseBoards'> } : 'skip'
  );
  const isLockedCoreTile = useMemo(() => {
    if (!boardTiles) return false;
    // listByBoard hydrates phrase-kind tiles by inlining the phrase row, so
    // we compare against `t.phrase?._id` rather than the raw `phraseId` field
    // (which is stripped from the hydrated shape).
    const tile = boardTiles.find(
      (t) => t.kind === 'phrase' && t.phrase?._id === phraseId
    );
    return Boolean(tile?.isLocked && tile.tileRole === 'core');
  }, [boardTiles, phraseId]);
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
    // Defense in depth — the button is disabled for locked-core tiles, but if
    // a stale render slips through we'd rather surface a friendly message
    // than fail-and-toast at the server boundary.
    if (isLockedCoreTile) {
      setError('This phrase is part of the locked AAC core vocabulary. To remove it, delete the entire board.');
      return;
    }

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
            {isLockedCoreTile ? (
              <Button
                type="button"
                variant="ghost"
                disabled
                className="text-text-tertiary cursor-not-allowed"
                title="This phrase is part of the locked AAC core vocabulary. To remove it, delete the entire board."
                aria-label="Delete disabled — locked core vocabulary"
              >
                <LockClosedIcon className="h-5 w-5 mr-2" />
                Locked Core Phrase
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete Phrase
              </Button>
            )}
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
