'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import BottomSheet from '@/app/components/ui/BottomSheet';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { ChevronDownIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline';

function EditNavigateTileForm() {
  const router = useRouter();
  const params = useParams<{ boardId: string; tileId: string }>();
  const sourceBoardId = params?.boardId ?? null;
  const tileId = params?.tileId ?? null;

  const [targetBoardId, setTargetBoardId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the existing tile via the source board's tile list. Cheaper than
  // adding a "getTile" query and keeps the data path consistent with the grid.
  const sourceBoardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    sourceBoardId ? { id: sourceBoardId as Id<'phraseBoards'> } : 'skip'
  );

  const existingTile = useMemo(() => {
    if (!sourceBoardData || !tileId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tiles = (sourceBoardData.tiles ?? []) as any[];
    return tiles.find((t) => String(t._id) === tileId && t.kind === 'navigate') ?? null;
  }, [sourceBoardData, tileId]);

  // Initialize state from the existing tile once it loads.
  useEffect(() => {
    if (existingTile && targetBoardId === null) {
      setTargetBoardId(String(existingTile.targetBoardId));
    }
  }, [existingTile, targetBoardId]);

  const boards = useQuery(api.phraseBoards.getPhraseBoards);
  const updateNavigateTile = useMutation(api.boardTiles.updateNavigateTile);
  const deleteTile = useMutation(api.boardTiles.deleteTile);

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
    if (!tileId || !targetBoardId) return;

    setLoading(true);
    setError(null);
    try {
      await updateNavigateTile({
        tileId: tileId as Id<'boardTiles'>,
        targetBoardId: targetBoardId as Id<'phraseBoards'>,
      });
      router.back();
    } catch (err) {
      console.error('Error updating navigate tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update navigate tile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tileId) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTile({ tileId: tileId as Id<'boardTiles'> });
      router.back();
    } catch (err) {
      console.error('Error deleting tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tile');
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Edit Navigate Tile" backHref="/" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <form
          onSubmit={handleSubmit}
          className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Target Board
            </label>
            {boards === undefined || sourceBoardData === undefined ? (
              <div className="text-text-tertiary">Loading...</div>
            ) : !existingTile ? (
              <div className="text-amber-600 bg-status-warning px-4 py-3 rounded-2xl">
                Tile not found. It may have been deleted.
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

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleting || !existingTile}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              type="submit"
              disabled={loading || !targetBoardId || !existingTile}
            >
              {loading ? 'Saving...' : 'Save'}
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
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Navigate Tile"
        description={`Delete "${existingTile?.label ?? 'this navigate tile'}"? This removes the navigation link from this board.`}
        confirmLabel="Delete Tile"
        isBusy={deleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function EditNavigateTilePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <EditNavigateTileForm />
    </Suspense>
  );
}
