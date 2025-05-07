'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import { use } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';

export default function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [board, setBoard] = useState<PhraseBoard | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    const fetchBoard = async () => {
      try {
        const fetchedBoard = await phraseStore.getState().getPhraseBoard(user.id, resolvedParams.id);
        setBoard(fetchedBoard);
        setName(fetchedBoard?.name || '');
      } catch (error) {
        console.error('Error fetching board:', error);
        setError('Failed to load board');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [resolvedParams.id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !board) return;

    setSaving(true);
    setError(null);

    try {
      const updatedBoard = new PhraseBoard({
        ...board,
        name,
      });
      await phraseStore.getState().updatePhraseBoard(user.id, resolvedParams.id, updatedBoard);
      router.back();
    } catch (error) {
      console.error('Error updating board:', error);
      setError('Failed to update board');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !board) return;

    if (!confirm('Are you sure you want to delete this board? All phrases in this board will be deleted.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await phraseStore.getState().deletePhraseBoard(user.id, resolvedParams.id);
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">Board not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Edit Board</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-6">
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
            <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
