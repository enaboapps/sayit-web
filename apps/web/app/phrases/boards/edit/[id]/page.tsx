'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TrashIcon } from '@heroicons/react/24/outline';
import { use } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useAuth } from '@/app/contexts/AuthContext';
import type { Id } from '@/convex/_generated/dataModel';

export default function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [name, setName] = useState('');
  const [hiddenFromPicker, setHiddenFromPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shouldLoadBoard = !authLoading && !!user;
  const boardId = resolvedParams.id as unknown as Id<'phraseBoards'>;

  // Convex query and mutations
  const board = useQuery(
    api.phraseBoards.getPhraseBoard,
    shouldLoadBoard ? { id: boardId } : 'skip'
  );
  const updatePhraseBoard = useMutation(api.phraseBoards.updatePhraseBoard);
  const deletePhraseBoard = useMutation(api.phraseBoards.deletePhraseBoard);

  const loading = authLoading || (shouldLoadBoard && board === undefined);

  useEffect(() => {
    if (board) {
      setName(board.name);
      setHiddenFromPicker(Boolean(board.hiddenFromPicker));
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;

    setSaving(true);
    setError(null);

    try {
      await updatePhraseBoard({
        id: boardId,
        name,
        hiddenFromPicker,
      });
      router.back();
    } catch (error) {
      console.error('Error updating board:', error);
      setError('Failed to update board');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!board) return;

    setDeleting(true);
    setError(null);

    try {
      await deletePhraseBoard({
        id: boardId,
      });
      router.back();
    } catch (error) {
      console.error('Error deleting board:', error);
      setError('Failed to delete board');
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-600">Board not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Edit Board" backHref="/" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8">
          <Input
            id="name"
            type="text"
            label="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
            required
          />

          <label className="mb-4 mt-2 flex items-start gap-3 rounded-2xl border border-border bg-surface-hover/40 p-4">
            <input
              id="hiddenFromPicker"
              type="checkbox"
              checked={hiddenFromPicker}
              onChange={(e) => setHiddenFromPicker(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Hide from board picker
              </span>
              <span className="text-xs text-text-secondary">
                Use this for drill-down boards reached only through navigation tiles. The
                board stays usable through links and stays in exports.
              </span>
            </span>
          </label>

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
              disabled={deleting}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Board
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
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Board"
        description={`Delete "${board.name}"? This removes the board and all phrases in it.`}
        confirmLabel="Delete Board"
        isBusy={deleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
