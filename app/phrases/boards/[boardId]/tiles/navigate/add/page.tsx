'use client';

import { Suspense, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { ChevronDownIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline';

function AddNavigateTileForm() {
  const router = useRouter();
  const params = useParams<{ boardId: string }>();
  const sourceBoardId = params?.boardId ?? null;
  const [targetBoardId, setTargetBoardId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boards = useQuery(api.phraseBoards.getPhraseBoards);
  const addNavigateTile = useMutation(api.boardTiles.addNavigateTile);

  // Eligible targets: any board the user can read, except the source board.
  const eligibleTargets = useMemo(() => {
    if (!boards) return [];
    return boards.filter((b) => b._id !== sourceBoardId);
  }, [boards, sourceBoardId]);

  const selectedTarget = eligibleTargets.find((b) => b._id === targetBoardId) ?? null;

  const handleSelectTarget = (id: string) => {
    setTargetBoardId(id);
    setIsPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceBoardId || !targetBoardId) return;

    setLoading(true);
    setError(null);
    try {
      await addNavigateTile({
        boardId: sourceBoardId as Id<'phraseBoards'>,
        targetBoardId: targetBoardId as Id<'phraseBoards'>,
      });
      router.back();
    } catch (err) {
      console.error('Error adding navigate tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to add navigate tile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <BackButton />
        <h1 className="text-3xl font-bold text-foreground mt-4">Add Navigate Tile</h1>
        <p className="text-text-secondary mt-2">
          A navigate tile takes the user to another board when tapped. The tile&apos;s label
          stays in sync with the target board&apos;s name.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8 mt-6"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Target Board
            </label>
            {boards === undefined ? (
              <div className="text-text-tertiary">Loading boards...</div>
            ) : eligibleTargets.length === 0 ? (
              <div className="text-amber-600 bg-status-warning px-4 py-3 rounded-2xl">
                You need at least one other board before you can add a navigate tile.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full flex items-center justify-between bg-surface-hover text-foreground rounded-2xl px-4 py-4 border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              >
                <div className="flex flex-col items-start">
                  <span className={selectedTarget ? 'font-medium' : 'text-text-tertiary'}>
                    {selectedTarget?.name || 'Select a target board'}
                  </span>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-text-tertiary" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !targetBoardId}
            >
              {loading ? 'Adding...' : 'Add Navigate Tile'}
            </Button>
          </div>
        </form>
      </div>

      <BottomSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Select Target Board"
        snapPoints={[50, 80]}
      >
        <div className="p-4 space-y-2">
          {eligibleTargets.map((board) => {
            const isSelected = board._id === targetBoardId;
            return (
              <button
                key={board._id}
                onClick={() => handleSelectTarget(board._id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-surface-hover border-2 border-primary-500'
                    : 'bg-surface-hover hover:bg-surface border-2 border-transparent'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-foreground">{board.name}</span>
                  {board.isShared && board.sharedBy && (
                    <div className="flex items-center gap-1 mt-1">
                      <UserGroupIcon className="w-3 h-3 text-primary-400" />
                      <span className="text-xs text-primary-400">Shared by {board.sharedBy}</span>
                    </div>
                  )}
                  {board.isOwner && board.forClientName && (
                    <div className="flex items-center gap-1 mt-1">
                      <UserGroupIcon className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">For {board.forClientName}</span>
                    </div>
                  )}
                </div>
                {isSelected && <CheckIcon className="w-5 h-5 text-primary-500" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export default function AddNavigateTilePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <AddNavigateTileForm />
    </Suspense>
  );
}
