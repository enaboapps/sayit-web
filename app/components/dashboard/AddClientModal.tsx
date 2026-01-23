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
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const createRequest = useMutation(api.connectionRequests.createConnectionRequest);

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

    setIsSending(true);
    try {
      await createRequest({ communicatorId: foundProfile.userId });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send request';
      setError(message);
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay  flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ backgroundColor: '#242424' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-surface-hover">
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
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <p className="mt-2 text-text-tertiary text-sm">
              They must accept your request before you can create boards for them
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-status-error border border-red-900 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-status-success border border-green-900 text-green-400 text-sm">
              Request sent! Waiting for {foundProfile?.fullName || foundProfile?.email} to accept.
            </div>
          )}

          {foundProfile && !error && !success && (
            <div className="mb-4 p-3 rounded-xl bg-status-success border border-green-900 text-green-400 text-sm">
              Found: {foundProfile.fullName || foundProfile.email}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-hover hover:bg-background text-foreground rounded-xl transition-colors"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={isSending || !email.trim()}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Send Request'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
