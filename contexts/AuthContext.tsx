import { deleteCurrentAccount } from '../lib/accountDeletion';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'expired';
  subscription_plan: 'free' | 'pro' | 'premium';
  subscription_expires_at?: string;
  max_cards: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isPro: boolean;
  maxCards: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed values — isPro is set during fetchProfile (includes pro_providers check)
  const isPro = profile?.subscription_status === 'active' && profile?.subscription_plan !== 'free';
  const maxCards = profile?.max_cards || 1;

  // Fetch user profile from database
  // Mirrors web logic: checks pro_providers first, then profiles.is_pro
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_pro, subscription_status, subscription_plan, subscription_expires_at, max_cards')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Profile might not exist yet, create default
        if (error.code === 'PGRST116') {
          const defaultProfile: UserProfile = {
            id: userId,
            subscription_status: 'free',
            subscription_plan: 'free',
            max_cards: 1,
          };
          setProfile(defaultProfile);
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }

      let subStatus = data.subscription_status || 'free';
      let subPlan = data.subscription_plan || 'free';

      // If profile doesn't already show pro, check pro_providers table
      // (Pro providers get automatic pro access — matches web roleService logic)
      if (subStatus !== 'active' || subPlan === 'free') {
        if (data.is_pro) {
          // profiles.is_pro flag set by web — verify with pro_providers
          const { data: providerCheck } = await supabase
            .from('pro_providers')
            .select('id, subscription_status, subscription_plan, subscription_expires_at, is_active')
            .eq('user_id', userId)
            .maybeSingle();

          if (providerCheck && providerCheck.is_active) {
            // Free plan: always active (no expiry)
            if (providerCheck.subscription_plan === 'free') {
              subStatus = 'active';
              subPlan = 'free';
            } else if (providerCheck.subscription_status === 'active') {
              // Paid plan: check if expired
              const isExpired = providerCheck.subscription_expires_at &&
                new Date(providerCheck.subscription_expires_at) < new Date();
              if (isExpired) {
                subStatus = 'expired';
                subPlan = data.subscription_plan || 'pro';
                // Deactivate in background
                supabase.from('pro_providers').update({
                  subscription_status: 'expired', is_active: false, updated_at: new Date().toISOString(),
                }).eq('id', providerCheck.id).then(() => {});
                supabase.from('profiles').update({
                  is_pro: false, subscription_status: 'expired', updated_at: new Date().toISOString(),
                }).eq('user_id', userId).then(() => {});
              } else {
                subStatus = 'active';
                subPlan = providerCheck.subscription_plan || 'pro';
              }
            } else {
              subStatus = providerCheck.subscription_status || 'expired';
              subPlan = providerCheck.subscription_plan || 'pro';
            }
          } else if (providerCheck && !providerCheck.is_active) {
            subStatus = 'expired';
            subPlan = data.subscription_plan || 'free';
          }
        } else {
          // Check if user is a registered Pro provider
          const { data: provider } = await supabase
            .from('pro_providers')
            .select('id, subscription_status, subscription_plan, subscription_expires_at, is_active')
            .eq('user_id', userId)
            .maybeSingle();

          if (provider && provider.is_active) {
            // Free plan: always active
            if (provider.subscription_plan === 'free') {
              subStatus = 'active';
              subPlan = 'free';
            } else if (provider.subscription_status === 'active') {
              // Paid plan: check expiry
              const isExpired = provider.subscription_expires_at &&
                new Date(provider.subscription_expires_at) < new Date();
              subStatus = isExpired ? 'expired' : 'active';
              subPlan = provider.subscription_plan || 'pro';
            } else {
              subStatus = provider.subscription_status || 'expired';
              subPlan = provider.subscription_plan || 'pro';
            }
            // Sync profiles table
            if (subStatus === 'active') {
              supabase.from('profiles')
                .update({ is_pro: true, subscription_status: 'active', subscription_plan: subPlan })
                .eq('user_id', userId)
                .then(() => {});
            }
          }
        }
      }

      setProfile({
        id: data.user_id,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        subscription_status: subStatus,
        subscription_plan: subPlan,
        subscription_expires_at: data.subscription_expires_at,
        max_cards: data.max_cards || 1,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session — clear stale tokens if refresh fails
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[AuthContext] Session recovery failed, signing out:', error.message);
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    const redirectTo = 'tavvy://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Sign-in is temporarily unavailable.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return false;
    const callback = new URL(result.url);
    if (callback.protocol !== 'tavvy:' || callback.hostname !== 'auth' || callback.pathname !== '/callback') {
      throw new Error('Invalid sign-in callback.');
    }
    const params = new URLSearchParams(callback.hash.slice(1));
    const providerError = params.get('error_description') || callback.searchParams.get('error_description');
    if (providerError) throw new Error(providerError);
    const code = callback.searchParams.get('code');
    if (code) {
      const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      if (provider === 'apple') void storeAppleRefreshToken(exchanged?.session?.provider_refresh_token ?? null);
      return true;
    }
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error('Sign-in did not return a session. Please try again.');
    const { data: established, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
    if (provider === 'apple') {
      // Implicit-flow callbacks carry the provider token in the fragment.
      void storeAppleRefreshToken(params.get('provider_refresh_token') ?? established?.session?.provider_refresh_token ?? null);
    }
    return true;
  };

  /**
   * Apple Guideline 5.1.1(v): an account created with Sign in with Apple must
   * have its Apple token revoked when the account is deleted. Supabase only
   * exposes the provider refresh token at sign-in time, so it is handed to a
   * service-role-only store immediately (see supabase/functions/store-apple-credential).
   * Best effort: a failure never blocks sign-in.
   */
  const storeAppleRefreshToken = async (providerRefreshToken: string | null) => {
    if (!providerRefreshToken) return;
    try {
      await supabase.functions.invoke('store-apple-credential', {
        method: 'POST',
        body: { providerRefreshToken },
      });
    } catch (error) {
      console.warn('[auth] Could not store the Apple credential for later revocation:', error);
    }
  };

  const signInWithGoogle = () => signInWithProvider('google');
  const signInWithApple = () => signInWithProvider('apple');

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://tavvy.com/app/reset-password',
    });
    if (error) throw error;
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');
    // The current backend is unavailable. This rejects without clearing any session.
    return deleteCurrentAccount();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      loading, 
      isPro,
      maxCards,
      signIn, 
      signUp, 
      signInWithGoogle,
      signInWithApple,
      signOut, 
      deleteAccount,
      resetPassword,
      refreshProfile,
    }}>
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
