/**
 * Pros Messages Screen
 * Install path: screens/ProsMessagesScreen.tsx
 * 
 * Messaging interface for communication between users and pros.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';
import { useProsConversations, useProsMessages, useProsStartConversation } from '../hooks/usePros';
import { ProConversationWithDetails, ProMessage } from '../lib/ProsTypes';

type RouteParams = {
  ProsMessagesScreen: {
    conversationId?: number;
    proId?: number;
    proName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Conversation List View
function ConversationList({
  conversations,
  loading,
  onSelectConversation,
  onRefresh,
}: {
  conversations: ProConversationWithDetails[];
  loading: boolean;
  onSelectConversation: (conv: ProConversationWithDetails) => void;
  onRefresh: () => void;
}) {
  const renderConversation = ({ item }: { item: ProConversationWithDetails }) => {
    const otherParty = item.provider || item.user;
    const unreadCount = item.conversation.userUnread + item.conversation.providerUnread;
    const lastMessageTime = new Date(item.conversation.lastMessageAt);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onSelectConversation(item)}
      >
        {otherParty?.logoUrl || otherParty?.avatarUrl ? (
          <Image
            source={{ uri: otherParty.logoUrl || otherParty.avatarUrl }}
            style={styles.conversationAvatar}
          />
        ) : (
          <View style={styles.conversationAvatarPlaceholder}>
            <Ionicons name="person" size={24} color={ProsColors.textMuted} />
          </View>
        )}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {otherParty?.businessName || otherParty?.name || 'Unknown'}
            </Text>
            <Text style={styles.conversationTime}>
              {lastMessageTime.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ProsColors.primary} />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={ProsColors.textMuted} />
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyText}>
          Start a conversation by contacting a pro or receiving a lead request.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.conversation.id.toString()}
      renderItem={renderConversation}
      contentContainerStyle={styles.conversationList}
      showsVerticalScrollIndicator={false}
    />
  );
}

// Chat View
function ChatView({
  conversationId,
  otherPartyName,
  onBack,
}: {
  conversationId: number;
  otherPartyName: string;
  onBack: () => void;
}) {
  const flatListRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const { messages, loading, fetchMessages, sendMessage } = useProsMessages(conversationId);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(messageText.trim());
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ProMessage; index: number }) => {
    const isOwn = item.senderType === 'user'; // Adjust based on current user context
    const showDate = index === 0 || 
      new Date(messages[index - 1]?.createdAt).toDateString() !== new Date(item.createdAt).toDateString();

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        <View style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}>
          <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle} numberOfLines={1}>
          {otherPartyName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor={ProsColors.textMuted}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Main Component
export default function ProsMessagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsMessagesScreen'>>();
  
  const initialConversationId = route.params?.conversationId;
  const proId = route.params?.proId;
  const proName = route.params?.proName;

  const [selectedConversation, setSelectedConversation] = useState<ProConversationWithDetails | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConversationId || null);

  const { conversations, loading, fetchConversations } = useProsConversations();
  const { startConversation, loading: startingConversation } = useProsStartConversation();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // If we have a proId but no conversationId, we might need to start a new conversation
    if (proId && !initialConversationId) {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.provider?.id === proId);
      if (existingConv) {
        setSelectedConversation(existingConv);
        setActiveConversationId(existingConv.conversation.id);
      }
    }
  }, [proId, conversations]);

  const handleSelectConversation = (conv: ProConversationWithDetails) => {
    setSelectedConversation(conv);
    setActiveConversationId(conv.conversation.id);
  };

  const handleBack = () => {
    if (activeConversationId) {
      setSelectedConversation(null);
      setActiveConversationId(null);
    } else {
      navigation.goBack();
    }
  };

  // Show chat view if we have an active conversation
  if (activeConversationId && selectedConversation) {
    const otherPartyName = selectedConversation.provider?.businessName || 
                          selectedConversation.user?.name || 
                          proName || 
                          'Unknown';
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ChatView
          conversationId={activeConversationId}
          otherPartyName={otherPartyName}
          onBack={handleBack}
        />
      </SafeAreaView>
    );
  }

  // Show conversation list
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ConversationList
        conversations={conversations}
        loading={loading}
        onSelectConversation={handleSelectConversation}
        onRefresh={fetchConversations}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationList: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  conversationAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ProsColors.sectionBg,
  },
  conversationAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
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
    color: ProsColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: ProsColors.textMuted,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationPreview: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: ProsColors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Chat styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: ProsColors.textMuted,
    backgroundColor: ProsColors.sectionBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  messageContainerOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleOwn: {
    backgroundColor: ProsColors.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: ProsColors.textPrimary,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: ProsColors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    flex: 1,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: ProsColors.textPrimary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ProsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: ProsColors.textMuted,
  },
});
