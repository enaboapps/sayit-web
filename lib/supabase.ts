import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Add a function to check the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  if (!session) {
    console.error('No active session found');
    return null;
  }
  console.log('Current session:', session);
  return session;
};

// Add a function to check if we're authenticated
export const isAuthenticated = async () => {
  const session = await getCurrentSession();
  return !!session;
};

// Add a function to get the current user
export const getCurrentUser = async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
};
