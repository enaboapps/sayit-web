'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import HomeFeatures from '@/app/components/home/HomeFeatures';
import PhrasesInterface from '@/app/components/home/PhrasesInterface';
import ConnectionRequestsBanner from '@/app/components/connection/ConnectionRequestsBanner';
import RoleSelectionModal from '@/app/components/onboarding/RoleSelectionModal';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const [roleJustSelected, setRoleJustSelected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Add delay before showing role selection to prevent flash
  useEffect(() => {
    if (!authLoading && (!user || profile !== undefined)) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, profile]);

  if (authLoading) {
    return <AnimatedLoading />;
  }

  // Show loading while profile is being fetched for logged-in users
  if (user && profile === undefined) {
    return <AnimatedLoading />;
  }

  // Show loading during delay period to prevent flash
  if (!isReady) {
    return <AnimatedLoading />;
  }

  // Show role selection if user is logged in but has no role
  const needsRoleSelection = user && !roleJustSelected && (profile === null || !profile?.role);

  if (needsRoleSelection) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <RoleSelectionModal onComplete={() => setRoleJustSelected(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!user ? (
        <HomeFeatures />
      ) : (
        <>
          <ConnectionRequestsBanner />
          <PhrasesInterface />
        </>
      )}
    </div>
  );
}
