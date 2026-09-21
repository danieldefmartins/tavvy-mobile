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
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { blockConversation } from '../lib/tavvyChat';
import { useTavvyChat } from '../hooks/useTavvyChat';
import { useTranslation } from 'react-i18next';

// Design System Colors
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1E0A3C',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  unread: '#8A05BE',
  ownBubble: '#667EEA',
  otherBubble: '#1F2937',
};

export default function ProsMessagesScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId: initialId, leadId, customerName } = route.params || {};

  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialId || null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { 
    messages, 
    conversations, 
    loading, 
    fetchConversations, 
    fetchMessages, 
    sendMessage,
    error, sending, authLoading, currentUserId 
  } = useTavvyChat(activeConversationId || undefined);

  useEffect(() => { setActiveConversationId(initialId || null); setMessageText(''); }, [currentUserId, initialId]);
  useEffect(() => {
    if (!leadId || initialId || activeConversationId || loading) return;
    const matches = conversations.filter(c => c.project_request_id === leadId);
    if (matches.length === 1) setActiveConversationId(matches[0].id);
  }, [leadId, initialId, activeConversationId, conversations, loading]);
  const handleBlock = () => Alert.alert('Block participant', 'Block messaging with this participant?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Block', style: 'destructive', onPress: async () => {
      if (!activeConversationId || !currentUserId) return;
      try { await blockConversation(activeConversationId, currentUserId); Alert.alert('Blocked', 'Messaging with this participant is blocked.'); }
      catch { Alert.alert('Unable to block', 'Please try again.'); }
    } }
  ]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversationId || sending) return;
    
    const text = messageText.trim();
    try {
      await sendMessage(activeConversationId, text);
      setMessageText(current => current.trim() === text ? '' : current);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

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
    const otherParty = item.pro_id === currentUserId ? (item.customer_name || 'Customer conversation') : (item.provider_name || 'Professional conversation');
    const lastMessage = item.last_message || 'Start a conversation...';
    const isUnread = item.unread_count > 0;
    const initial = otherParty.charAt(0).toUpperCase();
    
    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem, 
          { 
            backgroundColor: surfaceColor,
            shadowColor: isDark ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 4,
            elevation: isDark ? 0 : 2,
          }
        ]}
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
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: isDark ? glassyColor : '#FFFFFF',
              borderWidth: isDark ? 0 : 1,
              borderColor: '#E5E7EB',
            }
          ]}>
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
          {authLoading || loading ? <Text style={{ color: textColor }}>Loading…</Text> : null}
          {!authLoading && !currentUserId ? <TouchableOpacity onPress={() => (navigation as any).navigate('Login')}><Text style={{ color: COLORS.accent }}>Sign in to view messages</Text></TouchableOpacity> : null}
          {error ? <TouchableOpacity onPress={fetchConversations}><Text accessibilityRole="alert" style={{ color: '#EF4444' }}>{error} Tap to retry.</Text></TouchableOpacity> : null}
          <FlatList
            data={conversations.filter(c => `${c.pro_id === currentUserId ? 'Customer' : 'Professional'} conversation ${c.id}`.toLowerCase().includes(searchQuery.toLowerCase()))}
            refreshing={loading}
            onRefresh={fetchConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={!loading && !error && !!currentUserId ?
              <View style={styles.emptyState}>
                <View style={[
                  styles.emptyIcon, 
                  { 
                    backgroundColor: isDark ? glassyColor : '#F3F4F6',
                  }
                ]}>
                  <Ionicons name="chatbubbles-outline" size={48} color={secondaryTextColor} />
                </View>
                <Text style={[styles.emptyText, { color: textColor }]}>No conversations yet</Text>
                <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
                  Leads you respond to will appear here.
                </Text>
              </View> : null
            }
          />
        </View>

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
          <TouchableOpacity onPress={handleBlock}><Text style={{ color: '#EF4444' }}>Block</Text></TouchableOpacity>
        </View>
        {loading ? <Text style={{ color: textColor, padding: 12 }}>Loading…</Text> : null}
        {error ? <TouchableOpacity onPress={() => fetchMessages(activeConversationId)}><Text accessibilityRole="alert" style={{ color: '#EF4444', padding: 12 }}>{error} Tap to refresh.</Text></TouchableOpacity> : null}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          refreshing={loading}
          onRefresh={() => fetchMessages(activeConversationId)}
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
            maxLength={5000}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: messageText.trim() ? COLORS.accent : glassyColor }
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending || !currentUserId}
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
