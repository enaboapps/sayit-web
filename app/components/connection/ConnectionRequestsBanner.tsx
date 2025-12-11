'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ConnectionRequestCard from './ConnectionRequestCard';

export default function ConnectionRequestsBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pendingRequests = useQuery(api.connectionRequests.getPendingRequestsForCommunicator);

  // Don't render anything while loading or if no requests
  if (pendingRequests === undefined || pendingRequests.length === 0) {
    return null;
  }

  const requestCount = pendingRequests.length;

  return (
    <div className="mb-4">
      {/* Collapsed Banner */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 flex items-center gap-3 hover:bg-primary-500/20 transition-colors text-left"
        >
          <div className="p-2 rounded-full bg-primary-500/20">
            <BellAlertIcon className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {requestCount} connection {requestCount === 1 ? 'request' : 'requests'}
            </p>
            <p className="text-text-secondary text-sm">
              Tap to view and respond
            </p>
          </div>
          <span className="text-primary-500 font-medium text-sm">View</span>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BellAlertIcon className="w-5 h-5 text-primary-500" />
              Connection Requests
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <p className="text-text-secondary text-sm">
            Accept to let caregivers create boards for you. You can remove them later from settings.
          </p>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <ConnectionRequestCard key={request._id} request={request} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
