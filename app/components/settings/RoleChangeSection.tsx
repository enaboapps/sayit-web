'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, HeartIcon } from '@heroicons/react/24/solid';
import RoleChangeModal from './RoleChangeModal';

export default function RoleChangeSection() {
  const [showModal, setShowModal] = useState(false);
  const profile = useQuery(api.profiles.getProfile);

  if (!profile?.role) {
    return null;
  }

  const handleSuccess = () => {
    setShowModal(false);
    // Force page reload to refresh all role-dependent UI
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${
            profile.role === 'caregiver' ? 'bg-primary-500/20' : 'bg-blue-500/20'
          }`}>
            {profile.role === 'caregiver' ? (
              <HeartIcon className="w-6 h-6 text-primary-500" />
            ) : (
              <UserIcon className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div>
            <p className="text-foreground font-medium">
              {profile.role === 'caregiver' ? 'Caregiver' : 'Communicator'}
            </p>
            <p className="text-text-secondary text-sm">
              {profile.role === 'caregiver'
                ? 'You create and manage boards for others'
                : 'You use boards to communicate'
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm text-text-secondary hover:text-foreground border border-border hover:border-text-secondary rounded-lg transition-colors"
        >
          Change Role
        </button>
      </div>

      {showModal && (
        <RoleChangeModal
          currentRole={profile.role}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
