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

const ROLE_CACHE_KEY = 'sayit_user_has_role';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const [roleJustSelected, setRoleJustSelected] = useState(false);

  // Initialize from localStorage synchronously to prevent flash
  const [isReady, setIsReady] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ROLE_CACHE_KEY) === 'true';
  });

  // Update cache when profile loads
  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      const hasRole = profile.role ? 'true' : 'false';
      localStorage.setItem(ROLE_CACHE_KEY, hasRole);
    }
  }, [profile]);

  // Set ready when auth and profile are loaded
  useEffect(() => {
    if (!authLoading && (!user || profile !== undefined)) {
      setIsReady(true);
    }
  }, [authLoading, user, profile]);

  if (authLoading) {
    return <AnimatedLoading />;
  }

  // Show loading while profile is being fetched for logged-in users
  if (user && profile === undefined) {
    return <AnimatedLoading />;
  }

  // Show loading until ready
  if (!isReady) {
    return <AnimatedLoading />;
  }

  // Show role selection if user is logged in but has no role
  const needsRoleSelection = Boolean(user && !roleJustSelected && (profile === null || !profile?.role));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Always render modal, control visibility with CSS */}
      <RoleSelectionModal
        visible={needsRoleSelection}
        onComplete={() => setRoleJustSelected(true)}
      />

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
