import { createBrowserClient } from '@supabase/ssr';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Hook to get Supabase client with Clerk token (for client components)
export function useSupabaseClient() {
  const { getToken } = useClerkAuth();

  // For now, return the basic client
  // TODO: Integrate Clerk token when needed for RLS
  return supabase;
}

// Get current user from Clerk (client-side)
export const getCurrentUser = () => {
  // This should be called from components using useAuth() hook
  // Kept for backward compatibility
  return null;
};

// Check if authenticated (client-side)
export const isAuthenticated = () => {
  // This should be checked using Clerk's useAuth() hook
  // Kept for backward compatibility
  return false;
};

// Deprecated: Use Clerk's auth() in server components/API routes
export const getCurrentSession = async () => {
  console.warn('getCurrentSession is deprecated. Use Clerk auth() in server components');
  return null;
};
