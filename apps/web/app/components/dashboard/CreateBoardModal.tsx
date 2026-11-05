'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { XMarkIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CreateBoardModalProps {
  communicatorId: string;
  onClose: () => void;
}

export default function CreateBoardModal({ communicatorId, onClose }: CreateBoardModalProps) {
  const [mode, setMode] = useState<'create' | 'share'>('create');
  const [boardId, setBoardId] = useState('');
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addBoard = useMutation(api.phraseBoards.addPhraseBoard);
  const assignBoard = useMutation(api.phraseBoards.assignBoardToClient);
  const existingBoards = useQuery(api.phraseBoards.getPhraseBoards);
  const savedBoards = existingBoards?.filter((board) => board.isOwner && !board.forClientId && !board.pendingDelete);
  const selectedBoard = savedBoards?.find((board) => board._id === boardId);

  const handleCreate = async () => {
    if (isCreating) return;
    if (mode === 'share' ? !selectedBoard : !name.trim()) {
      setError(mode === 'share' ? 'Please select a saved board' : 'Please enter a board name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Get position for new board (after existing boards)
      const position = existingBoards?.length ?? 0;

      if (mode === 'share') {
        await assignBoard({
          boardId: boardId as Id<'phraseBoards'>,
          clientId: communicatorId,
          accessLevel,
        });
      } else {
        await addBoard({
          name: name.trim(),
          position,
          forClientId: communicatorId,
          clientAccessLevel: accessLevel,
        });
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add board';
      setError(message);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay  flex items-center justify-center p-4 z-50">
      <div role="dialog" aria-modal="true" aria-labelledby="add-board-title" aria-busy={isCreating} className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 bg-surface">
        <div className="flex items-center justify-between mb-6">
          <h2 id="add-board-title" className="text-xl font-bold text-foreground">Add Board for Client</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={isCreating}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <fieldset disabled={isCreating} className="mb-4 flex gap-3">
          <legend className="mb-2 text-sm font-medium text-foreground">Choose an option</legend>
          {(['create', 'share'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => { setMode(option); setError(null); }}
              className={`flex-1 p-3 rounded-xl border-2 ${mode === option ? 'border-primary-500 bg-primary-950' : 'border-border'}`}
            >
              {option === 'create' ? 'Create a new board' : 'Share a saved board'}
            </button>
          ))}
        </fieldset>

        {mode === 'share' ? (
          <div className="mb-4">
            <label htmlFor="saved-board" className="block text-sm font-medium text-foreground mb-2">Saved board</label>
            <select
              id="saved-board"
              value={selectedBoard ? boardId : ''}
              onChange={(event) => setBoardId(event.target.value)}
              disabled={isCreating || !savedBoards?.length}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a board</option>
              {savedBoards?.map((board) => <option key={board._id} value={board._id}>{board.name}</option>)}
            </select>
            <p className="mt-2 text-sm text-text-secondary" role="status">
              {savedBoards === undefined ? 'Loading saved boards...' : savedBoards.length === 0
                ? 'No saved boards available. Only boards you own that are not assigned to a client can be shared.'
                : 'Share this board with the client and keep managing it here. Linked boards must be shared separately.'}
            </p>
          </div>
        ) : <div className="mb-4">
          <label htmlFor="board-name" className="block text-sm font-medium text-foreground mb-2">
            Board name
          </label>
          <input
            type="text"
            id="board-name"
            value={name}
            disabled={isCreating}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Daily Phrases"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>}

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Permission level
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setAccessLevel('view')}
              disabled={isCreating}
              aria-pressed={accessLevel === 'view'}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                accessLevel === 'view'
                  ? 'border-primary-500 bg-primary-950 ring-2 ring-primary-900'
                  : 'border-border hover:border-primary-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <EyeIcon className={`w-5 h-5 ${accessLevel === 'view' ? 'text-primary-400' : 'text-text-secondary'}`} />
                {accessLevel === 'view' && <CheckCircleIcon className="w-5 h-5 text-primary-500" />}
              </div>
              <span className={`text-sm font-medium ${accessLevel === 'view' ? 'text-primary-400' : 'text-text-secondary'}`}>
                View only
              </span>
              <p className={`text-xs mt-1 ${accessLevel === 'view' ? 'text-primary-400' : 'text-text-tertiary'}`}>
                Can see phrases
              </p>
            </button>
            <button
              onClick={() => setAccessLevel('edit')}
              disabled={isCreating}
              aria-pressed={accessLevel === 'edit'}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                accessLevel === 'edit'
                  ? 'border-primary-500 bg-primary-950 ring-2 ring-primary-900'
                  : 'border-border hover:border-primary-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <PencilIcon className={`w-5 h-5 ${accessLevel === 'edit' ? 'text-primary-400' : 'text-text-secondary'}`} />
                {accessLevel === 'edit' && <CheckCircleIcon className="w-5 h-5 text-primary-500" />}
              </div>
              <span className={`text-sm font-medium ${accessLevel === 'edit' ? 'text-primary-400' : 'text-text-secondary'}`}>
                Can edit
              </span>
              <p className={`text-xs mt-1 ${accessLevel === 'edit' ? 'text-primary-400' : 'text-text-tertiary'}`}>
                Add & modify phrases
              </p>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-status-error border border-red-900 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 px-4 py-3 bg-surface-hover hover:bg-background text-foreground rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || (mode === 'share' ? !selectedBoard : !name.trim())}
            className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'share' ? (isCreating ? 'Sharing...' : 'Share Board') : (isCreating ? 'Creating...' : 'Create Board')}
          </button>
        </div>
      </div>
    </div>
  );
}
