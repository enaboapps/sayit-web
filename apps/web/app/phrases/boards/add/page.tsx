'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';

// New boards always start blank — the named-preset "AAC core board" mode
// (issue #649) was removed in favor of OBF/OBZ import. See plan
// `i-think-we-ll-need-quizzical-moore.md` for the migration story.
export default function AddBoardPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const boards = useQuery(api.phraseBoards.getPhraseBoards);
  const addPhraseBoard = useMutation(api.phraseBoards.addPhraseBoard);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const position = boards?.length || 0;
      await addPhraseBoard({ name, position });
      router.back();
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Create New Board" backHref="/" />
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Board Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter board name"
              required
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-status-error rounded-3xl text-red-500 mt-4">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
