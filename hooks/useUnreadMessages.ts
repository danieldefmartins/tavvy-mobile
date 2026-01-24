/**
 * useUnreadMessages - Hook to track unread message counts
 * Provides real-time unread message count for notification badges
 * 
 * Install path: hooks/useUnreadMessages.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UnreadCounts {
  total: number;
  conversations: { [conversationId: string]: number };
}

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ total: 0, conversations: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unread message count for the current user
  const fetchUnreadCount = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        setUnreadCounts({ total: 0, conversations: {} });
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
      const conversationCounts: { [id: string]: number } = {};

      // Add pro unread counts
      (proConversations || []).forEach((conv) => {
        const count = conv.pro_unread_count || 0;
        total += count;
        conversationCounts[conv.id] = count;
      });

      // Add customer unread counts
      (customerConversations || []).forEach((conv) => {
        const count = conv.user_unread_count || 0;
        total += count;
        conversationCounts[conv.id] = (conversationCounts[conv.id] || 0) + count;
      });

      setUnreadCount(total);
      setUnreadCounts({ total, conversations: conversationCounts });
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch unread count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates for conversations (unread count changes)
  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to conversation updates for this user
      channel = supabase
        .channel('unread-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
        }, (payload) => {
          // Check if this conversation belongs to the current user
          const conv = payload.new as any;
          if (conv && (conv.pro_id === user.id || conv.user_id === user.id)) {
            // Refresh unread count when conversation is updated
            fetchUnreadCount();
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, () => {
          // Refresh when new messages arrive
          fetchUnreadCount();
        })
        .subscribe();
    };

    setupSubscription();
    fetchUnreadCount();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
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

  return {
    unreadCount,
    unreadCounts,
    loading,
    error,
    fetchUnreadCount,
    markAsRead,
  };
}

export default useUnreadMessages;
