'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { XMarkIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CreateBoardModalProps {
  communicatorId: string;
  onClose: () => void;
}

// Caregiver-side "create board for client" modal. Always creates a blank
// board now — the AAC-preset starter mode (issue #649) was retired in
// favor of OBF/OBZ import for AAC vocabularies. Caregivers who want a
// shared AAC vocabulary should import an .obz then assign / share the
// resulting boards.
export default function CreateBoardModal({ communicatorId, onClose }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addBoard = useMutation(api.phraseBoards.addPhraseBoard);
  const existingBoards = useQuery(api.phraseBoards.getPhraseBoards);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a board name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Get position for new board (after existing boards)
      const position = existingBoards?.length ?? 0;

      await addBoard({
        name: name.trim(),
        position,
        forClientId: communicatorId,
        clientAccessLevel: accessLevel,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create board';
      setError(message);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay  flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 bg-surface">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Create Board for Client</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="board-name" className="block text-sm font-medium text-foreground mb-2">
            Board name
          </label>
          <input
            type="text"
            id="board-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Daily Phrases"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
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
          <div className="mb-4 p-3 rounded-xl bg-status-error border border-red-900 text-red-400 text-sm">
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
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
