'use client';

import React, { createContext, useContext } from 'react';
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

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
