'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/contexts/AuthContext';

export default function OnlineStartupWatch({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady: () => void;
}) {
  const { user, loading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfile,
    user ? undefined : 'skip'
  );
  const isReady = !loading && (!user || profile !== undefined);

  useEffect(() => {
    if (isReady) {
      onReady();
    }
  }, [isReady, onReady]);

  return <>{children}</>;
}
