'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { XMarkIcon, FolderIcon, CheckIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Id } from '@/convex/_generated/dataModel';

interface ShareBoardModalProps {
  communicatorId: string;
  onClose: () => void;
}

export default function ShareBoardModal({ communicatorId, onClose }: ShareBoardModalProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<Id<'phraseBoards'> | null>(null);
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myBoards = useQuery(api.phraseBoards.getPhraseBoards);
  const alreadyShared = useQuery(api.sharedBoards.getSharedBoardsForClient, { communicatorId });
  const shareBoard = useMutation(api.sharedBoards.shareBoard);

  const alreadySharedIds = new Set(alreadyShared?.map((s) => s.boardId) ?? []);
  const availableBoards = myBoards?.filter((b) => !alreadySharedIds.has(b._id)) ?? [];

  const handleShare = async () => {
    if (!selectedBoardId) return;

    setIsSharing(true);
    setError(null);
    try {
      await shareBoard({
        boardId: selectedBoardId,
        communicatorId,
        accessLevel,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share board';
      setError(message);
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Share a Board</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {myBoards === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-hover rounded-xl animate-pulse" />
            ))}
          </div>
        ) : availableBoards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-2">No boards available to share</p>
            <p className="text-text-tertiary text-sm">
              {myBoards.length === 0
                ? 'Create a board first to share it'
                : 'All your boards are already shared with this client'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Select a board
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableBoards.map((board) => (
                  <button
                    key={board._id}
                    onClick={() => setSelectedBoardId(board._id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      selectedBoardId === board._id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-border hover:border-primary-500/50'
                    }`}
                  >
                    <FolderIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    <span className="flex-1 truncate text-foreground">{board.name}</span>
                    {selectedBoardId === board._id && (
                      <CheckIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Permission level
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAccessLevel('view')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    accessLevel === 'view'
                      ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/30'
                      : 'border-border hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <EyeIcon className={`w-5 h-5 ${accessLevel === 'view' ? 'text-primary-400' : 'text-text-secondary'}`} />
                    {accessLevel === 'view' && <CheckCircleIcon className="w-5 h-5 text-primary-500" />}
                  </div>
                  <span className={`text-sm font-medium ${accessLevel === 'view' ? 'text-primary-400' : 'text-text-secondary'}`}>
                    View only
                  </span>
                  <p className={`text-xs mt-1 ${accessLevel === 'view' ? 'text-primary-400/70' : 'text-text-tertiary'}`}>
                    Can see phrases
                  </p>
                </button>
                <button
                  onClick={() => setAccessLevel('edit')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    accessLevel === 'edit'
                      ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/30'
                      : 'border-border hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <PencilIcon className={`w-5 h-5 ${accessLevel === 'edit' ? 'text-primary-400' : 'text-text-secondary'}`} />
                    {accessLevel === 'edit' && <CheckCircleIcon className="w-5 h-5 text-primary-500" />}
                  </div>
                  <span className={`text-sm font-medium ${accessLevel === 'edit' ? 'text-primary-400' : 'text-text-secondary'}`}>
                    Can edit
                  </span>
                  <p className={`text-xs mt-1 ${accessLevel === 'edit' ? 'text-primary-400/70' : 'text-text-tertiary'}`}>
                    Add & modify phrases
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-surface-hover hover:bg-background text-foreground rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !selectedBoardId}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? 'Sharing...' : 'Share Board'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
