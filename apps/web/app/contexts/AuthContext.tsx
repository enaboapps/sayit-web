'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
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

export function StaticAuthProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: AuthContextType;
}) {
  return (
    <AuthContext.Provider
      value={value ?? {
        user: null,
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const profile = useQuery(api.profiles.getProfile);
  const migrateNullRole = useMutation(api.profiles.migrateNullRole);
  const migrationAttemptedRef = useRef(false);

  // Transform Clerk user to our simplified format
  const user = clerkUser
    ? {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || null,
    }
    : null;

  // Migrate existing users with null roles to 'communicator' (only once)
  useEffect(() => {
    if (profile && !profile.role && !migrationAttemptedRef.current) {
      migrationAttemptedRef.current = true;
      migrateNullRole({}).catch((error) => {
        console.error('Failed to migrate null role:', error);
        migrationAttemptedRef.current = false; // Allow retry on error
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
