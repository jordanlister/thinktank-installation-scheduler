// Think Tank Technologies Installation Scheduler - Supabase Configuration

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create mock client for cases where environment variables are missing
const mockClient = {
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    onAuthStateChange: () => ({ data: { subscription: null }, error: null })
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    delete: () => Promise.resolve({ error: new Error('Supabase not configured') })
  })
};

// Export either real or mock client
export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? mockClient as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

// Log if using mock client
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Using mock Supabase client - environment variables missing:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    nodeEnv: import.meta.env.NODE_ENV || 'development'
  });
}

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email: string, password: string, userData: { 
    firstName: string; 
    lastName: string; 
    role?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'scheduler', // Default role
          is_active: true
        }
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  }
};

// Database helpers with proper error handling
export const db = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const { data, error } = await supabase
        .from(table)
        .select(columns);
      
      if (error) {
        console.error(`Error selecting from ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    insert: async (records: any[]) => {
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select();
      
      if (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
      
      return true;
    }
  })
};

export default supabase;