/**
 * Pros API Hooks
 * Install path: hooks/usePros.ts
 */

import { useState, useCallback } from 'react';
import { PROS_API_URL } from '../constants/ProsConfig';
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
} from '../lib/ProsTypes';

// Helper for tRPC-style API calls
async function trpcCall<T>(
  endpoint: string,
  input?: Record<string, unknown>,
  method: 'GET' | 'POST' = 'GET'
): Promise<T> {
  const url = new URL(`${PROS_API_URL}/api/trpc/${endpoint}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (method === 'GET' && input) {
    url.searchParams.set('input', JSON.stringify(input));
  } else if (method === 'POST' && input) {
    options.body = JSON.stringify(input);
  }

  const response = await fetch(url.toString(), options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.result?.data as T;
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
      const data = await trpcCall<ProCategory[]>('categories.list');
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
      const data = await trpcCall<SearchProsResponse>('providers.search', params);
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
      const data = await trpcCall<Pro[]>('providers.featured', { limit });
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
      const data = await trpcCall<ProProfileResponse>('providers.getBySlug', { slug });
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
      const data = await trpcCall<ProLead[]>('leads.getProviderLeads', { status });
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
      const data = await trpcCall<ProLead>('leads.create', form, 'POST');
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
      await trpcCall('leads.updateStatus', { leadId, status }, 'POST');
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
      const data = await trpcCall<ProConversationWithDetails[]>('messages.getConversations');
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
      const data = await trpcCall<{ messages: ProMessage[] }>('messages.getMessages', { conversationId });
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      const newMessage = await trpcCall<ProMessage>('messages.send', { conversationId, content }, 'POST');
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
      const data = await trpcCall<{ conversationId: number }>('messages.startConversation', {
        providerId,
        message,
        leadRequestId,
      }, 'POST');
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
      const data = await trpcCall<ProSubscription | null>('subscriptions.getMySubscription');
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEarlyAdopterCount = useCallback(async () => {
    try {
      const data = await trpcCall<{ count: number }>('subscriptions.getEarlyAdopterCount');
      setEarlyAdopterCount(data.count);
    } catch (err) {
      console.error('Failed to fetch early adopter count:', err);
    }
  }, []);

  const subscribe = useCallback(async (tier: 'early_adopter' | 'standard') => {
    setLoading(true);
    setError(null);
    try {
      const data = await trpcCall<ProSubscription>('subscriptions.subscribe', { tier }, 'POST');
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
      const data = await trpcCall<Pro>('providerDashboard.getProfile');
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
      const data = await trpcCall<Pro>('providerDashboard.register', form, 'POST');
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
      const data = await trpcCall<Pro>('providerDashboard.updateProfile', form, 'POST');
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
    id: number;
    name: string | null;
    email: string | null;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpcCall<typeof user>('auth.me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await trpcCall('auth.logout', {}, 'POST');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  return { user, loading, checkAuth, logout };
}
