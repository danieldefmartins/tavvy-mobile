/**
 * ProsMessagesScreen - Real-Time Chat Interface
 * Install path: screens/ProsMessagesScreen.tsx
 * 
 * Messaging interface for communication between users and pros.
 * Powered by Supabase Realtime.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProsColors } from '../constants/ProsConfig';
import { useTavvyChat } from '../hooks/useTavvyChat';
import { supabase } from '../lib/supabaseClient';

export default function ProsMessagesScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId: initialId, proId, proName } = route.params || {};

  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialId || null);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { 
    messages, 
    conversations, 
    loading, 
    fetchConversations, 
    fetchMessages, 
    sendMessage,
    startConversation 
  } = useTavvyChat(activeConversationId || undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (proId && !activeConversationId) {
      handleStartNewChat();
    }
  }, [proId]);

  const handleStartNewChat = async () => {
    try {
      const id = await startConversation(proId);
      setActiveConversationId(id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversationId) return;
    
    const text = messageText.trim();
    setMessageText('');
    
    try {
      // Determine if sender is pro or user (simplified for this view)
      const senderType = 'user'; 
      await sendMessage(activeConversationId, text, senderType);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const otherParty = item.pro?.business_name || 'Customer';
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => setActiveConversationId(item.id)}
      >
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#9CA3AF" />
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{otherParty}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            Tap to view messages
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageWrapper, isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper]}>
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!activeConversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No conversations yet.</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConversationId(null)}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{proName || 'Chat'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !messageText.trim() && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  listContent: { padding: 16 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  lastMessage: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 16 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  messagesContent: { padding: 16, paddingBottom: 32 },
  messageWrapper: { marginBottom: 16, flexDirection: 'row' },
  ownMessageWrapper: { justifyContent: 'flex-end' },
  otherMessageWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  ownBubble: { backgroundColor: ProsColors.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  ownMessageText: { color: '#FFF' },
  otherMessageText: { color: '#111827' },
  messageTime: { fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ProsColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendDisabled: { opacity: 0.5 },
});
