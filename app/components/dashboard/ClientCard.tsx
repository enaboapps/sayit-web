'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, FolderIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';

interface ClientCardProps {
  client: {
    _id: Id<'caregiverClients'>;
    communicatorId: string;
    createdAt: number;
    profile: {
      email: string;
      fullName?: string;
    } | null;
  };
}

export default function ClientCard({ client }: ClientCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const removeClient = useMutation(api.caregiverClients.removeClient);
  const clientBoards = useQuery(api.phraseBoards.getBoardsForClient, {
    clientId: client.communicatorId,
  });

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeClient({ communicatorId: client.communicatorId });
    } catch (err) {
      console.error('Failed to remove client:', err);
      setIsRemoving(false);
      setShowConfirm(false);
    }
  };

  const displayName = client.profile?.fullName || client.profile?.email || 'Unknown';
  const boardCount = clientBoards?.length ?? 0;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 hover:border-primary-500/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-surface-hover">
          <UserIcon className="w-6 h-6 text-text-secondary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
          {client.profile?.fullName && client.profile?.email && (
            <p className="text-text-tertiary text-sm truncate">{client.profile.email}</p>
          )}
          <div className="flex items-center gap-1 mt-1 text-text-secondary text-sm">
            <FolderIcon className="w-4 h-4" />
            <span>{boardCount} shared board{boardCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/client/${client.communicatorId}`}
            className="p-2 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors"
            title="View boards"
          >
            <EyeIcon className="w-5 h-5" />
          </Link>

          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 text-sm rounded-lg bg-surface-hover text-text-secondary hover:bg-background transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Remove client"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
