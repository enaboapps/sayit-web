'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface AuthContextType {
  user: {
    id: string;
    email: string | null;
  } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();

  // Transform Clerk user to our simplified format
  const user = clerkUser
    ? {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || null,
    }
    : null;

  // Clear role cache when user logs out
  useEffect(() => {
    if (isLoaded && !clerkUser && typeof window !== 'undefined') {
      localStorage.removeItem('sayit_user_has_role');
    }
  }, [clerkUser, isLoaded]);

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
