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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage synchronously to prevent flash
  const [hasRoleCached, setHasRoleCached] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ROLE_CACHE_KEY) === 'true';
  });

  // Update cache when profile loads
  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      const hasRole = profile.role ? 'true' : 'false';
      localStorage.setItem(ROLE_CACHE_KEY, hasRole);
      setHasRoleCached(profile.role !== null && profile.role !== undefined);
    }
  }, [profile]);

  // Initialize state only after auth is loaded
  useEffect(() => {
    if (!authLoading) {
      // 2 second delay to ensure everything is fully loaded before showing modal
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Show loading while auth is loading
  if (authLoading || !isInitialized) {
    return <AnimatedLoading />;
  }

  // Show loading while profile is being fetched for logged-in users
  if (user && profile === undefined) {
    return <AnimatedLoading />;
  }

  // Determine if role selection is needed - only show after all data is loaded
  const needsRoleSelection = Boolean(
    isInitialized &&
    user &&
    !roleJustSelected &&
    profile !== undefined &&
    (profile === null || !profile?.role)
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Only render modal when we're certain about the state */}
      {isInitialized && profile !== undefined && (
        <RoleSelectionModal
          visible={needsRoleSelection}
          onComplete={() => {
            setRoleJustSelected(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem(ROLE_CACHE_KEY, 'true');
            }
          }}
        />
      )}

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
