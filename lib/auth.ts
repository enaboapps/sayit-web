import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export const authService = {
  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred during sign up');
    }
  },
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred during sign in');
    }
  },
  sendPasswordResetEmail: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred while sending password reset email');
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
  },
  isPasswordStrongEnough: (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  },
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
  getCurrentUser: () => {
    return supabase.auth.getUser().then(({ data: { user } }) => user);
  },
  getAuth: () => {
    return supabase.auth;
  },
};

