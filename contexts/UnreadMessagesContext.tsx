/**
 * UnreadMessagesContext - Global state for unread message counts
 * Provides unread count to all components that need it (tab bar, app tiles, etc.)
 * 
 * Install path: contexts/UnreadMessagesContext.tsx
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UnreadMessagesContextType {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (conversationId: string, userRole: 'pro' | 'customer') => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadCount: 0,
  loading: false,
  error: null,
  fetchUnreadCount: async () => {},
  markAsRead: async () => {},
});

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unread message count for the current user
  const fetchUnreadCount = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      // Fetch conversations where user is the pro and has unread messages
      const { data: proConversations, error: proError } = await supabase
        .from('conversations')
        .select('id, pro_unread_count')
        .eq('pro_id', user.id)
        .gt('pro_unread_count', 0);

      if (proError) throw proError;

      // Fetch conversations where user is the customer and has unread messages
      const { data: customerConversations, error: customerError } = await supabase
        .from('conversations')
        .select('id, user_unread_count')
        .eq('user_id', user.id)
        .gt('user_unread_count', 0);

      if (customerError) throw customerError;

      // Calculate total unread count
      let total = 0;

      // Add pro unread counts
      (proConversations || []).forEach((conv) => {
        total += conv.pro_unread_count || 0;
      });

      // Add customer unread counts
      (customerConversations || []).forEach((conv) => {
        total += conv.user_unread_count || 0;
      });

      setUnreadCount(total);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch unread count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates for conversations
  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to conversation updates for this user
      channel = supabase
        .channel('global-unread-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
        }, (payload) => {
          // Check if this conversation belongs to the current user
          const conv = payload.new as any;
          if (conv && (conv.pro_id === user.id || conv.user_id === user.id)) {
            fetchUnreadCount();
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();
    };

    setupSubscription();
    fetchUnreadCount();

    // Also refresh on auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUnreadCount();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUnreadCount]);

  // Mark messages as read for a conversation
  const markAsRead = useCallback(async (conversationId: string, userRole: 'pro' | 'customer') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateField = userRole === 'pro' ? 'pro_unread_count' : 'user_unread_count';
      
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);

      // Refresh counts
      fetchUnreadCount();
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  }, [fetchUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, loading, error, fetchUnreadCount, markAsRead }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessagesContext() {
  return useContext(UnreadMessagesContext);
}

export default UnreadMessagesContext;
