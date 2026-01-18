/**
 * useTavvyChat - Updated Real-Time Messaging Hook
 * Handles messaging between users and pros, linked to project requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTavvyChat(conversationId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch conversations where user is either customer or pro
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          project_request:project_requests(id, description, customer_name),
          pro:auth.users!pro_id(id, email),
          customer:auth.users!customer_id(id, email)
        `)
        .or(`customer_id.eq.${user.id},pro_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = async (id: string, content: string, senderType: 'customer' | 'pro') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          sender_type: senderType,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Start a new conversation linked to a project request
  const startConversation = async (proId: string, customerId: string, leadId?: string, bidId?: string) => {
    try {
      // Check if conversation already exists for this lead and pro
      let query = supabase
        .from('conversations')
        .select('id')
        .eq('pro_id', proId)
        .eq('customer_id', customerId);
      
      if (leadId) {
        query = query.eq('project_request_id', leadId);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          pro_id: proId,
          customer_id: customerId,
          project_request_id: leadId,
          project_bid_id: bidId
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Subscribe to real-time updates for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages,
    conversations,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversation
  };
}
