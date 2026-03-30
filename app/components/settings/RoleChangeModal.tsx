'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RoleChangeModalProps {
  currentRole: 'caregiver' | 'communicator';
  onClose: () => void;
  onSuccess: () => void;
}

const CONFIRMATION_PHRASE = 'CHANGE ROLE';

export default function RoleChangeModal({ currentRole, onClose, onSuccess }: RoleChangeModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changeRole = useMutation(api.profiles.changeRole);

  const newRole = currentRole === 'caregiver' ? 'communicator' : 'caregiver';
  const isConfirmed = confirmationInput === CONFIRMATION_PHRASE;

  const handleSubmit = async () => {
    if (!isConfirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await changeRole({ newRole });
      onSuccess();
    } catch (err) {
      console.error('Failed to change role:', err);
      setError('Failed to change role. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl shadow-2xl max-w-md w-full p-6 bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-error rounded-full">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Change Role</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-status-error border border-red-900 rounded-xl p-4 mb-6">
          <p className="text-red-400 font-medium mb-2">Warning: This action cannot be undone</p>
          <div className="text-text-secondary text-sm">
            {currentRole === 'caregiver' ? (
              <>
                <span>Switching to </span>
                <span className="font-semibold text-foreground">Communicator</span>
                <span> will:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove all your clients</li>
                  <li>Delete all boards you created for clients</li>
                </ul>
              </>
            ) : (
              <>
                <span>Switching to </span>
                <span className="font-semibold text-foreground">Caregiver</span>
                <span> will:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove your connection to your caregiver</li>
                  <li>You will lose access to boards shared with you</li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm text-text-secondary mb-2">
            Type <span className="font-mono font-bold text-foreground">{CONFIRMATION_PHRASE}</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value.toUpperCase())}
            placeholder={CONFIRMATION_PHRASE}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-border rounded-xl text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isConfirmed || isSubmitting}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Changing...' : 'Change Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
