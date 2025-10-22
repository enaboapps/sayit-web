'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TrashIcon } from '@heroicons/react/24/outline';
import { use } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';

export default function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Convex query and mutations
  const board = useQuery(api.phraseBoards.getPhraseBoard, { id: resolvedParams.id as any });
  const updatePhraseBoard = useMutation(api.phraseBoards.updatePhraseBoard);
  const deletePhraseBoard = useMutation(api.phraseBoards.deletePhraseBoard);

  const loading = board === undefined;

  useEffect(() => {
    if (board) {
      setName(board.name);
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;

    setSaving(true);
    setError(null);

    try {
      await updatePhraseBoard({
        id: resolvedParams.id as any,
        name,
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

    if (!confirm('Are you sure you want to delete this board? All phrases in this board will be deleted.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deletePhraseBoard({
        id: resolvedParams.id as any,
      });
      router.back();
    } catch (error) {
      console.error('Error deleting board:', error);
      setError('Failed to delete board');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 bg-surface flex items-center justify-center">
        <div className="text-gray-600 text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100 bg-surface flex items-center justify-center">
        <div className="text-red-600">Board not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 text-foreground mt-4">Edit Board</h1>

        <form onSubmit={handleSubmit} className="bg-white bg-surface shadow-md rounded-lg p-6 mt-6">
          <Input
            id="name"
            type="text"
            label="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
            required
          />

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
    </div>
  );
}
