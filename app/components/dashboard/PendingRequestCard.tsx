'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Id } from '@/convex/_generated/dataModel';

interface PendingRequestCardProps {
  request: {
    _id: Id<'connectionRequests'>;
    communicatorId: string;
    createdAt: number;
    communicator: {
      fullName?: string;
      email: string;
    } | null;
  };
}

export default function PendingRequestCard({ request }: PendingRequestCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const cancelRequest = useMutation(api.connectionRequests.cancelConnectionRequest);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelRequest({ requestId: request._id });
    } catch (err) {
      console.error('Failed to cancel request:', err);
      setIsCancelling(false);
      setShowConfirm(false);
    }
  };

  const displayName = request.communicator?.fullName || request.communicator?.email || 'Unknown';

  return (
    <div className="bg-surface rounded-xl border border-yellow-500/30 p-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-yellow-500/10">
          <UserIcon className="w-6 h-6 text-yellow-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
          {request.communicator?.fullName && request.communicator?.email && (
            <p className="text-text-tertiary text-sm truncate">{request.communicator.email}</p>
          )}
          <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm">
            <ClockIcon className="w-4 h-4" />
            <span>Pending acceptance</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 text-sm rounded-lg bg-surface-hover text-text-secondary hover:bg-background transition-colors"
                disabled={isCancelling}
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Cancel request"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
