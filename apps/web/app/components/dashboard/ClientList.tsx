'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ClientCard from './ClientCard';
import PendingRequestCard from './PendingRequestCard';
import AddClientButton from './AddClientButton';

export default function ClientList() {
  const clients = useQuery(api.caregiverClients.getClients);
  const pendingRequests = useQuery(api.connectionRequests.getSentRequestsForCaregiver);

  if (clients === undefined || pendingRequests === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const hasNoClientsOrRequests = clients.length === 0 && pendingRequests.length === 0;

  return (
    <div className="space-y-4">
      <AddClientButton />

      {hasNoClientsOrRequests ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary mb-2">No clients yet</p>
          <p className="text-text-tertiary text-sm">
            Send a request to add your first client
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                Pending Requests
              </h3>
              {pendingRequests.map((request) => (
                <PendingRequestCard key={request._id} request={request} />
              ))}
            </>
          )}

          {clients.length > 0 && (
            <>
              {pendingRequests.length > 0 && (
                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide mt-6">
                  Connected Clients
                </h3>
              )}
              {clients.map((client) => (
                <ClientCard key={client._id} client={client} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
