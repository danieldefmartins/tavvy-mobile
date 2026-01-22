/**
 * Pros API Hooks
 * Connects to Supabase Edge Functions for the Tavvy Pros feature.
 * Install path: hooks/usePros.ts
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ProCategory,
  Pro,
  SearchProsResponse,
  ProProfileResponse,
  ProLead,
  ProLeadRequestForm,
  ProConversationWithDetails,
  ProMessage,
  ProSubscription,
  ProRegistrationForm,
  ProProfileUpdateForm,
} from '../types/pros';

// Helper for calling Supabase Edge Functions
async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown> | object
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: body || {},
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}

// ============================================
// CATEGORIES HOOKS
// ============================================

export function useProsCategories() {
  const [categories, setCategories] = useState<ProCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProCategory[]>('pros-categories-list');
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
}

// ============================================
// PROS HOOKS
// ============================================

export function useSearchPros() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPros = useCallback(async (params: {
    categorySlug?: string;
    query?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<SearchProsResponse>('pros-providers-search', params);
      setPros(data.providers);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search pros');
    } finally {
      setLoading(false);
    }
  }, []);

  return { pros, total, loading, error, searchPros };
}

export function useFeaturedPros() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = useCallback(async (limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<Pro[]>('pros-providers-featured', { limit });
      setPros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured pros');
    } finally {
      setLoading(false);
    }
  }, []);

  return { pros, loading, error, fetchFeatured };
}

export function useProProfile() {
  const [pro, setPro] = useState<ProProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPro = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProProfileResponse>('pros-providers-get-by-slug', { slug });
      setPro(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pro');
    } finally {
      setLoading(false);
    }
  }, []);

  return { pro, loading, error, fetchPro };
}

// ============================================
// LEADS HOOKS
// ============================================

export function useProsLeads() {
  const [leads, setLeads] = useState<ProLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProLead[]>('pros-leads-get-provider-leads', { status });
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (form: ProLeadRequestForm) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProLead>('pros-create-project', form);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLeadStatus = useCallback(async (leadId: number, status: string) => {
    try {
      await invokeFunction('pros-leads-update-status', { leadId, status });
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, status: status as ProLead['status'] } : lead
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead status');
      throw err;
    }
  }, []);

  return { leads, loading, error, fetchLeads, createLead, updateLeadStatus };
}

// ============================================
// MESSAGES HOOKS
// ============================================

export function useProsConversations() {
  const [conversations, setConversations] = useState<ProConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProConversationWithDetails[]>('pros-messages-get-conversations');
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  return { conversations, loading, error, fetchConversations };
}

export function useProsMessages(conversationId: number) {
  const [messages, setMessages] = useState<ProMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<{ messages: ProMessage[] }>('pros-messages-get-messages', { conversationId });
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      const newMessage = await invokeFunction<ProMessage>('pros-send-message', { conversationId, content });
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [conversationId]);

  return { messages, loading, error, fetchMessages, sendMessage };
}

export function useProsStartConversation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = useCallback(async (providerId: number, message: string, leadRequestId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<{ conversationId: number }>('pros-start-thread', {
        providerId,
        message,
        leadRequestId,
      });
      return data.conversationId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, startConversation };
}

// ============================================
// SUBSCRIPTION HOOKS
// ============================================

export function useProsSubscription() {
  const [subscription, setSubscription] = useState<ProSubscription | null>(null);
  const [earlyAdopterCount, setEarlyAdopterCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProSubscription | null>('pros-subscriptions-get-my-subscription');
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEarlyAdopterCount = useCallback(async () => {
    try {
      const data = await invokeFunction<{ count: number }>('pros-subscriptions-get-early-adopter-count');
      setEarlyAdopterCount(data.count);
    } catch (err) {
      console.error('Failed to fetch early adopter count:', err);
    }
  }, []);

  const subscribe = useCallback(async (tier: 'early_adopter' | 'standard') => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<ProSubscription>('pros-subscriptions-subscribe', { tier });
      setSubscription(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscription, earlyAdopterCount, loading, error, fetchSubscription, fetchEarlyAdopterCount, subscribe };
}

// ============================================
// PRO DASHBOARD HOOKS
// ============================================

export function useProDashboard() {
  const [profile, setProfile] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<Pro>('pros-dashboard-get-profile');
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (form: ProRegistrationForm) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<Pro>('pros-dashboard-register', form);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (form: ProProfileUpdateForm) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<Pro>('pros-dashboard-update-profile', form);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile, register, updateProfile };
}

// ============================================
// AUTH HOOK (for Pros context)
// ============================================

export function useProsAuth() {
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeFunction<typeof user>('pros-auth-me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  return { user, loading, checkAuth, logout };
}

// ============================================
// BIDS HOOKS
// ============================================

export function useProsBids() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitBid = useCallback(async (projectId: string, bidData: {
    amount_min: number;
    amount_max: number;
    message: string;
    estimated_timeline?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction('pros-submit-bid', { projectId, ...bidData });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, submitBid };
}

// ============================================
// CLAIM BUSINESS HOOKS
// ============================================

export function useProsClaimBusiness() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (businessId: string, phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction('pros-claim-send-otp', { businessId, phone });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (businessId: string, phone: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction('pros-claim-verify-otp', { businessId, phone, otp });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, sendOtp, verifyOtp };
}
