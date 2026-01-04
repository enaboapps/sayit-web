'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  const profile = useQuery(api.profiles.getProfile);
  const migrateNullRole = useMutation(api.profiles.migrateNullRole);

  // Transform Clerk user to our simplified format
  const user = clerkUser
    ? {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || null,
    }
    : null;

  // Migrate existing users with null roles to 'communicator'
  useEffect(() => {
    if (profile && !profile.role) {
      migrateNullRole({}).catch((error) => {
        console.error('Failed to migrate null role:', error);
      });
    }
  }, [profile, migrateNullRole]);

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
