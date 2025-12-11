'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Id } from '@/convex/_generated/dataModel';

interface ConnectionRequestCardProps {
  request: {
    _id: Id<'connectionRequests'>;
    caregiverId: string;
    createdAt: number;
    caregiver: {
      fullName?: string;
      email: string;
    } | null;
  };
}

export default function ConnectionRequestCard({ request }: ConnectionRequestCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const acceptRequest = useMutation(api.connectionRequests.acceptConnectionRequest);
  const rejectRequest = useMutation(api.connectionRequests.rejectConnectionRequest);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptRequest({ requestId: request._id });
    } catch (err) {
      console.error('Failed to accept request:', err);
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectRequest({ requestId: request._id });
    } catch (err) {
      console.error('Failed to reject request:', err);
      setIsRejecting(false);
    }
  };

  const displayName = request.caregiver?.fullName || request.caregiver?.email || 'Unknown';
  const isProcessing = isAccepting || isRejecting;

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary-500/10">
          <UserIcon className="w-6 h-6 text-primary-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
          {request.caregiver?.fullName && request.caregiver?.email && (
            <p className="text-text-tertiary text-sm truncate">{request.caregiver.email}</p>
          )}
          <p className="text-text-secondary text-sm mt-1">wants to connect with you</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="p-2 rounded-lg bg-surface-hover hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
            title="Decline"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isAccepting ? (
              'Accepting...'
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Accept
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
