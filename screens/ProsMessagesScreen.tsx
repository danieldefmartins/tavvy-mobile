/**
 * ProsMessagesScreen - Updated for Project Requests
 * Install path: screens/ProsMessagesScreen.tsx
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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProsColors } from '../constants/ProsConfig';
import { useTavvyChat } from '../hooks/useTavvyChat';
import { supabase } from '../lib/supabaseClient';

export default function ProsMessagesScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId: initialId, leadId, customerName } = route.params || {};

  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialId || null);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'customer' | 'pro'>('customer');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
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
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // In a real app, you'd check a 'profiles' table for the role
        // For now, we'll assume if they are on the Pros tab, they might be a pro
        // This is simplified logic
        setUserType('pro'); 
      }
    };
    setup();
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  // If we came from a lead and don't have a conversation yet, start one
  useEffect(() => {
    if (leadId && !activeConversationId && currentUserId) {
      handleStartNewChat();
    }
  }, [leadId, currentUserId]);

  const handleStartNewChat = async () => {
    try {
      // For a pro starting a chat from a lead:
      // We need the customer's user ID. 
      // Note: This requires the customer to have signed up.
      // If they haven't signed up yet, the pro can't message them yet.
      
      // Fetch the project request to get the customer's email
      const { data: request } = await supabase
        .from('project_requests')
        .select('customer_email')
        .eq('id', leadId)
        .single();
      
      if (request?.customer_email) {
        // Find the user ID for this email
        const { data: userData } = await supabase
          .from('profiles') // Assuming a profiles table exists
          .select('id')
          .eq('email', request.customer_email)
          .maybeSingle();
        
        if (userData?.id) {
          const id = await startConversation(currentUserId!, userData.id, leadId);
          setActiveConversationId(id);
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversationId) return;
    
    const text = messageText.trim();
    setMessageText('');
    
    try {
      await sendMessage(activeConversationId, text, userType);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setIsBlocking(true);
            try {
              // Get the other user's ID from the conversation
              const conversation = conversations.find(c => c.id === activeConversationId);
              const otherUserId = conversation?.customer_id === currentUserId 
                ? conversation?.pro_id 
                : conversation?.customer_id;

              if (otherUserId && currentUserId) {
                // Insert into blocked_users table
                await supabase.from('blocked_users').insert({
                  blocker_id: currentUserId,
                  blocked_id: otherUserId,
                  conversation_id: activeConversationId,
                });

                // Update conversation status
                await supabase
                  .from('conversations')
                  .update({ status: 'blocked' })
                  .eq('id', activeConversationId);

                Alert.alert('User Blocked', 'You will no longer receive messages from this user.');
                setShowOptionsModal(false);
                setActiveConversationId(null);
                fetchConversations();
              }
            } catch (error) {
              console.error('Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            } finally {
              setIsBlocking(false);
            }
          },
        },
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const otherParty = item.project_request?.customer_name || 'Customer';
    const projectTitle = item.project_request?.description || 'Project';
    
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
          <Text style={styles.projectTitle} numberOfLines={1}>{projectTitle}</Text>
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
              <Text style={styles.emptySubText}>Leads you respond to will appear here.</Text>
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
          <Text style={styles.chatTitle}>{customerName || 'Chat'}</Text>
          <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Options Modal */}
        <Modal
          visible={showOptionsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptionsModal(false)}
          >
            <View style={styles.optionsModal}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleBlockUser}
                disabled={isBlocking}
              >
                <Ionicons name="ban-outline" size={22} color="#EF4444" />
                <Text style={styles.optionTextDanger}>
                  {isBlocking ? 'Blocking...' : 'Block User'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => setShowOptionsModal(false)}
              >
                <Ionicons name="close-outline" size={22} color="#6B7280" />
                <Text style={styles.optionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
  projectTitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 18, fontWeight: '600' },
  emptySubText: { marginTop: 8, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
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
  // Options Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    width: '80%',
    maxWidth: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextDanger: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
});
