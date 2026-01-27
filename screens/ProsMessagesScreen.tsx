/**
 * ProsMessagesScreen.tsx
 * Messages / Conversations screen
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Search conversations
 * - Clean conversation list with avatars
 * - Unread indicators
 * - Floating new message button
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
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTavvyChat } from '../hooks/useTavvyChat';
import { supabase } from '../lib/supabaseClient';

// Design System Colors
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1A1A1A',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  unread: '#3B82F6',
  ownBubble: '#667EEA',
  otherBubble: '#1F2937',
};

export default function ProsMessagesScreen() {
  const { theme, isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId: initialId, leadId, customerName } = route.params || {};

  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialId || null);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'customer' | 'pro'>('customer');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (leadId && !activeConversationId && currentUserId) {
      handleStartNewChat();
    }
  }, [leadId, currentUserId]);

  const handleStartNewChat = async () => {
    try {
      const { data: request } = await supabase
        .from('project_requests')
        .select('customer_email')
        .eq('id', leadId)
        .single();
      
      if (request?.customer_email) {
        const { data: userData } = await supabase
          .from('profiles')
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
              const conversation = conversations.find(c => c.id === activeConversationId);
              const otherUserId = conversation?.customer_id === currentUserId 
                ? conversation?.pro_id 
                : conversation?.customer_id;

              if (otherUserId && currentUserId) {
                await supabase.from('blocked_users').insert({
                  blocker_id: currentUserId,
                  blocked_id: otherUserId,
                  conversation_id: activeConversationId,
                });

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

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#1F2937';
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textMuted;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    }
    return date.toLocaleDateString();
  };

  // Conversation List View
  const renderConversationItem = ({ item }: { item: any }) => {
    const otherParty = item.project_request?.customer_name || 'Customer';
    const lastMessage = item.last_message || 'Start a conversation...';
    const isUnread = item.unread_count > 0;
    const initial = otherParty.charAt(0).toUpperCase();
    
    return (
      <TouchableOpacity 
        style={[styles.conversationItem, { backgroundColor: surfaceColor }]}
        onPress={() => setActiveConversationId(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, { color: textColor }]} numberOfLines={1}>
              {otherParty}
            </Text>
            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
              {item.updated_at ? formatTime(item.updated_at) : ''}
            </Text>
          </View>
          <View style={styles.messagePreviewRow}>
            <Text 
              style={[
                styles.messagePreview, 
                { color: isUnread ? textColor : secondaryTextColor },
                isUnread && styles.messagePreviewUnread
              ]} 
              numberOfLines={1}
            >
              {lastMessage}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Message Bubble View
  const renderMessageItem = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageWrapper, isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper]}>
        <View style={[
          styles.messageBubble, 
          isOwn 
            ? { backgroundColor: COLORS.ownBubble } 
            : { backgroundColor: isDark ? COLORS.otherBubble : '#E5E7EB' }
        ]}>
          <Text style={[
            styles.messageText, 
            { color: isOwn ? '#FFFFFF' : textColor }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isOwn ? 'rgba(255,255,255,0.7)' : secondaryTextColor }
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Conversations List Screen
  if (!activeConversationId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Messages</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Stay connected.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: glassyColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search conversations..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Conversations List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent</Text>
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: glassyColor }]}>
                  <Ionicons name="chatbubbles-outline" size={48} color={secondaryTextColor} />
                </View>
                <Text style={[styles.emptyText, { color: textColor }]}>No conversations yet</Text>
                <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
                  Leads you respond to will appear here.
                </Text>
              </View>
            }
          />
        </View>

        {/* Floating New Message Button */}
        <TouchableOpacity 
          style={styles.fab}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Chat View
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Chat Header */}
        <View style={[styles.chatHeader, { backgroundColor: surfaceColor }]}>
          <TouchableOpacity 
            onPress={() => setActiveConversationId(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatTitle, { color: textColor }]}>{customerName || 'Chat'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowOptionsModal(true)}
            style={styles.optionsButton}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={textColor} />
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
            <View style={[styles.optionsModal, { backgroundColor: surfaceColor }]}>
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
                <Ionicons name="close-outline" size={22} color={secondaryTextColor} />
                <Text style={[styles.optionText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: surfaceColor }]}>
          <TextInput
            style={[styles.input, { backgroundColor: glassyColor, color: textColor }]}
            placeholder="Type a message..."
            placeholderTextColor={secondaryTextColor}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: messageText.trim() ? COLORS.accent : glassyColor }
            ]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={messageText.trim() ? '#FFFFFF' : secondaryTextColor} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // List Section
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 100,
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
  },
  messagePreviewUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.unread,
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  optionsButton: {
    padding: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: 280,
    borderRadius: 16,
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
  optionTextDanger: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Messages
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
