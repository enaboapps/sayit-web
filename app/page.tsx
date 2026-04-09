'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import HomeFeatures from '@/app/components/home/HomeFeatures';
import GuestCommunication from '@/app/components/home/GuestCommunication';
import PhrasesInterface from '@/app/components/home/PhrasesInterface';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const isProfileLoading = !!user && profile === undefined;
  const isStartupPending = authLoading || isProfileLoading;

  if (isStartupPending) {
    return <AnimatedLoading />;
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
