'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface AddClientModalProps {
  onClose: () => void;
}

export default function AddClientModal({ onClose }: AddClientModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const addClient = useMutation(api.caregiverClients.addClient);

  // Query to find user by email
  const foundProfile = useQuery(
    api.profiles.getProfileByEmail,
    email.trim() ? { email: email.trim().toLowerCase() } : 'skip'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!foundProfile) {
      setError('No user found with this email. They need to create an account first.');
      return;
    }

    if (foundProfile.role !== 'communicator') {
      setError('This user must be registered as a communicator to be added as a client.');
      return;
    }

    setIsAdding(true);
    try {
      await addClient({ communicatorId: foundProfile.userId });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add client';
      setError(message);
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary-500/10">
              <UserPlusIcon className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Add Client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Client's Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="client@example.com"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              autoFocus
            />
            <p className="mt-2 text-text-tertiary text-sm">
              The client must have an existing SayIt! account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {foundProfile && !error && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              Found: {foundProfile.fullName || foundProfile.email}
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
              type="submit"
              disabled={isAdding || !email.trim()}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
