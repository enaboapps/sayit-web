'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FolderIcon, PencilIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Id } from '@/convex/_generated/dataModel';

interface ClientBoardCardProps {
  board: {
    _id: Id<'phraseBoards'>;
    name: string;
    clientAccessLevel?: 'view' | 'edit';
  };
}

export default function ClientBoardCard({ board }: ClientBoardCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const updateAccess = useMutation(api.phraseBoards.updateBoardClientAccess);
  const unassignBoard = useMutation(api.phraseBoards.unassignBoardFromClient);

  const accessLevel = board.clientAccessLevel || 'view';

  const handleToggleAccess = async () => {
    setIsUpdating(true);
    try {
      await updateAccess({
        boardId: board._id,
        accessLevel: accessLevel === 'view' ? 'edit' : 'view',
      });
    } catch (error) {
      console.error('Failed to update access:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await unassignBoard({ boardId: board._id });
    } catch (error) {
      console.error('Failed to remove board:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <FolderIcon className="w-5 h-5 text-text-secondary" />
        <span className="font-medium text-foreground">{board.name}</span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            accessLevel === 'edit'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}
        >
          {accessLevel === 'edit' ? (
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

      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleAccess}
          disabled={isUpdating}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
        >
          {accessLevel === 'view' ? 'Allow edit' : 'View only'}
        </button>
        {showRemoveConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRemoveConfirm(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRemoveConfirm(true)}
            className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
