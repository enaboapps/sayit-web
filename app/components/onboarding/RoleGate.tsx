'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { usePathname } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/contexts/AuthContext';
import RoleSelectionModal from './RoleSelectionModal';

interface RoleGateProps {
  children: React.ReactNode;
}

// Pages that should not show the role selection modal
const EXCLUDED_PATHS = [
  '/sign-in',
  '/sign-up',
  '/privacy',
  '/support',
  '/pricing',
  '/reset-password',
];

export default function RoleGate({ children }: RoleGateProps) {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '';
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false);

  // Check if current path is excluded
  const isExcludedPath = EXCLUDED_PATHS.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Don't show modal on excluded paths
    if (isExcludedPath) {
      setShowRoleModal(false);
      return;
    }

    // Don't show if role was just selected
    if (roleSelected) {
      setShowRoleModal(false);
      return;
    }

    // Don't show if auth is still loading
    if (authLoading) {
      return;
    }

    // Don't show if user is not logged in
    if (!user) {
      setShowRoleModal(false);
      return;
    }

    // Profile is still loading (undefined in Convex means loading)
    if (profile === undefined) {
      return;
    }

    // Profile doesn't exist yet (null) or exists but no role set - show modal
    // setRole mutation will create the profile if needed
    if (profile === null || !profile.role) {
      setShowRoleModal(true);
    } else {
      setShowRoleModal(false);
    }
  }, [authLoading, user, profile, roleSelected, isExcludedPath, pathname]);

  const handleRoleComplete = () => {
    setRoleSelected(true);
    setShowRoleModal(false);
  };

  // Determine if modal should be visible
  const shouldShowModal = showRoleModal && !authLoading && profile !== undefined;

  return (
    <>
      {children}
      <RoleSelectionModal visible={shouldShowModal} onComplete={handleRoleComplete} />
    </>
  );
}
