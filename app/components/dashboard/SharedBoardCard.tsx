'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FolderIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Id } from '@/convex/_generated/dataModel';

interface SharedBoardCardProps {
  share: {
    _id: Id<'sharedBoards'>;
    boardId: Id<'phraseBoards'>;
    board: {
      _id: Id<'phraseBoards'>;
      name: string;
      position: number;
    };
    accessLevel: 'view' | 'edit';
    sharedAt: number;
  };
}

export default function SharedBoardCard({ share }: SharedBoardCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const unshareBoard = useMutation(api.sharedBoards.unshareBoard);
  const updateAccess = useMutation(api.sharedBoards.updateBoardAccess);

  const handleUnshare = async () => {
    setIsRemoving(true);
    try {
      await unshareBoard({ shareId: share._id });
    } catch (err) {
      console.error('Failed to unshare board:', err);
      setIsRemoving(false);
      setShowConfirm(false);
    }
  };

  const handleToggleAccess = async () => {
    setIsUpdating(true);
    try {
      await updateAccess({
        shareId: share._id,
        accessLevel: share.accessLevel === 'view' ? 'edit' : 'view',
      });
    } catch (err) {
      console.error('Failed to update access:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-4 hover:border-primary-500/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-surface-hover">
          <FolderIcon className="w-6 h-6 text-text-secondary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{share.board.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                share.accessLevel === 'edit'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}
            >
              {share.accessLevel === 'edit' ? (
                <>
                  <PencilIcon className="w-3 h-3" />
                  Can edit
                </>
              ) : (
                <>
                  <EyeIcon className="w-3 h-3" />
                  View only
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAccess}
            disabled={isUpdating}
            className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : share.accessLevel === 'view' ? 'Allow edit' : 'View only'}
          </button>

          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover text-text-secondary hover:bg-background transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={handleUnshare}
                disabled={isRemoving}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Unshare'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Unshare board"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
