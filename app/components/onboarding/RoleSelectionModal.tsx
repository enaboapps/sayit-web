'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, HeartIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface RoleSelectionModalProps {
  onComplete: () => void;
}

export default function RoleSelectionModal({ onComplete }: RoleSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'caregiver' | 'communicator' | null>(null);
  const setRole = useMutation(api.profiles.setRole);

  const handleSubmit = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await setRole({ role: selectedRole });
      onComplete();
    } catch (err) {
      console.error('Failed to set role:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to SayIt!</h2>
          <p className="text-text-secondary">
            How will you be using the app?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelectedRole('communicator')}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 relative ${
              selectedRole === 'communicator'
                ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/50'
                : 'border-border hover:border-primary-500/50 hover:bg-surface-hover'
            }`}
          >
            {selectedRole === 'communicator' && (
              <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-primary-500" />
            )}
            <div className={`p-3 rounded-full flex-shrink-0 ${
              selectedRole === 'communicator' ? 'bg-primary-500' : 'bg-surface-hover'
            }`}>
              <UserIcon className={`w-6 h-6 ${
                selectedRole === 'communicator' ? 'text-white' : 'text-text-secondary'
              }`} />
            </div>
            <div className="pr-8">
              <h3 className={`text-lg font-semibold mb-1 ${
                selectedRole === 'communicator' ? 'text-primary-400' : 'text-foreground'
              }`}>
                I need help communicating
              </h3>
              <p className="text-text-secondary text-sm">
                Use boards and phrases to express yourself. You can create your own or receive boards from a caregiver.
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('caregiver')}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 relative ${
              selectedRole === 'caregiver'
                ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/50'
                : 'border-border hover:border-primary-500/50 hover:bg-surface-hover'
            }`}
          >
            {selectedRole === 'caregiver' && (
              <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-primary-500" />
            )}
            <div className={`p-3 rounded-full flex-shrink-0 ${
              selectedRole === 'caregiver' ? 'bg-primary-500' : 'bg-surface-hover'
            }`}>
              <HeartIcon className={`w-6 h-6 ${
                selectedRole === 'caregiver' ? 'text-white' : 'text-text-secondary'
              }`} />
            </div>
            <div className="pr-8">
              <h3 className={`text-lg font-semibold mb-1 ${
                selectedRole === 'caregiver' ? 'text-primary-400' : 'text-foreground'
              }`}>
                I'm helping someone communicate
              </h3>
              <p className="text-text-secondary text-sm">
                Create and manage boards for your clients. Share boards with configurable permissions.
              </p>
            </div>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || isSubmitting}
          className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Setting up...' : 'Continue'}
        </button>

        <p className="text-text-tertiary text-xs text-center mt-4">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}
