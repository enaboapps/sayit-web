'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import HomeFeatures from '@/app/components/home/HomeFeatures';
import GuestCommunication from '@/app/components/home/GuestCommunication';
import PhrasesInterface from '@/app/components/home/PhrasesInterface';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

const STARTUP_FALLBACK_DELAY_MS = 4000;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const { isOnline } = useOnlineStatus();
  const [showStartupFallback, setShowStartupFallback] = useState(false);
  const isProfileLoading = !!user && profile === undefined;
  const isStartupPending = authLoading || isProfileLoading;

  useEffect(() => {
    if (!isStartupPending) {
      setShowStartupFallback(false);
      return;
    }

    if (!isOnline) {
      setShowStartupFallback(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowStartupFallback(true);
    }, STARTUP_FALLBACK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [isOnline, isStartupPending]);

  if (isStartupPending && !showStartupFallback) {
    return <AnimatedLoading />;
  }

  if (isStartupPending && showStartupFallback) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="border-b border-amber-900 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <div className="mx-auto max-w-5xl">
            {isOnline
              ? 'Loading your account is taking longer than expected. Text communication is available below while SayIt! keeps trying to reconnect.'
              : 'You appear to be offline. Text communication is available below.'}
          </div>
        </div>
        <GuestCommunication />
        <HomeFeatures />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!user ? (
        <>
          <GuestCommunication />
          <HomeFeatures />
        </>
      ) : (
        <PhrasesInterface />
      )}
    </div>
  );
}
