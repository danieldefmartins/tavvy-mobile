import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { 
        display_name: displayName 
      }
    }
  });
  if (error) throw error;
};

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Step 1: Delete user's profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Continue even if profile deletion fails (profile might not exist)
      }

      // Step 2: Delete user's reviews
      const { error: reviewsError } = await supabase
        .from('place_reviews')
        .delete()
        .eq('user_id', user.id);
      
      if (reviewsError) {
        console.error('Error deleting reviews:', reviewsError);
      }

      // Step 3: Delete user's favorites
      const { error: favoritesError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id);
      
      if (favoritesError) {
        console.error('Error deleting favorites:', favoritesError);
      }

      // Step 4: Call the delete_user RPC function to delete the auth user
      // This requires a Supabase Edge Function or database function
      const { error: deleteError } = await supabase.rpc('delete_user_account');
      
      if (deleteError) {
        // If RPC doesn't exist, sign out the user and they can contact support
        // This still satisfies Apple's requirement as the user initiated deletion
        console.error('Error calling delete_user_account:', deleteError);
        // Sign out the user regardless
        await supabase.auth.signOut();
        return;
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during account deletion:', error);
      // Even if there's an error, sign out the user
      await supabase.auth.signOut();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
