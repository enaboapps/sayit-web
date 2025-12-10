'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ClientCard from './ClientCard';
import AddClientButton from './AddClientButton';

export default function ClientList() {
  const clients = useQuery(api.caregiverClients.getClients);

  if (clients === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddClientButton />

      {clients.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary mb-2">No clients yet</p>
          <p className="text-text-tertiary text-sm">
            Add your first client to start creating boards for them
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client._id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
