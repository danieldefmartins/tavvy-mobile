/**
 * WalletScreen.tsx
 * Tavvy Wallet - account-scoped saved Pro cards
 * Path: screens/WalletScreen.tsx
 *
 * FEATURES:
 * - Accessible card list with expandable contact actions
 * - Each card shows Pro's gradient colors
 * - Tap card to expand to full Pro Card view
 * - Menu for contact export, removal and refresh
 * - Save contact to phone functionality
 * - Fetches data from Supabase
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import * as Contacts from 'expo-contacts';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ToolHeader from '../components/ToolHeader';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 80;


import { useAuth } from '../contexts/AuthContext';
import { readWallet, removeWalletCard, filterWallet, WalletCard as ProCard } from '../lib/wallet';

export default function WalletScreen() {
  const { user, loading } = useAuth();
  if (loading) return <ActivityIndicator accessibilityLabel="Loading account" />;
  return <AccountWallet key={user?.id || 'guest'} userId={user?.id || null} />;
}
function AccountWallet({ userId }: { userId: string | null }) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [savedCards, setSavedCards] = useState<ProCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ProCard | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const active = useRef(true);
  const request = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; request.current++; }; }, []);
  const loadSavedCards = useCallback(async () => {
    const version = ++request.current;
    setError('');
    try {
      const cards = await readWallet(supabase, userId, AsyncStorage);
      if (active.current && version === request.current) setSavedCards(cards);
    } catch {
      if (active.current && version === request.current) setError('Unable to load your wallet. Please retry.');
    } finally {
      if (active.current && version === request.current) { setIsLoading(false); setIsRefreshing(false); }
    }
  }, [userId]);
  useFocusEffect(useCallback(() => { void loadSavedCards(); }, [loadSavedCards]));
  const onRefresh = () => { setIsRefreshing(true); void loadSavedCards(); };
  const visibleCards = filterWallet(savedCards, search);

  // Handle card tap
  const handleCardPress = (card: ProCard) => {
    if (expandedCardId === card.id) {
      // Navigate to full card view
      navigation.navigate('ProCardDetail', { 
        cardId: card.id,
        slug: card.slug,
        card: card 
      });
    } else {
      setExpandedCardId(card.id);
    }
  };

  const removeCard = async (card: ProCard) => {
    if (removing) return;
    setRemoving(true);
    request.current++;
    try {
      await removeWalletCard(supabase, userId, card.id, AsyncStorage);
      if (!active.current) return;
      setSavedCards(cards => cards.filter(c => c.id !== card.id));
      setSelectedCard(null);
    } catch {
      if (active.current) Alert.alert('Error', 'Failed to remove card. Please refresh and try again.');
    } finally { if (active.current) setRemoving(false); }
  };

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    switch (action) {
      case 'refresh':
        onRefresh();
        break;
      case 'remove':
        if (selectedCard) {
          Alert.alert(
            'Remove Card',
            `Remove ${selectedCard.companyName} from your wallet?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => removeCard(selectedCard),
              },
            ]
          );
        }
        break;
    }
  };

  // Save contact to phone
  const saveContactToPhone = async (card: ProCard) => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to save this card.');
        return;
      }

      const contact: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Company,
        name: card.companyName,
        [Contacts.Fields.FirstName]: card.companyName,
        [Contacts.Fields.Company]: card.companyName,
        [Contacts.Fields.JobTitle]: card.category,
        [Contacts.Fields.PhoneNumbers]: card.phone ? [
          {
            label: 'work',
            number: card.phone,
          },
        ] : [],
        [Contacts.Fields.Emails]: card.email ? [
          {
            label: 'work',
            email: card.email,
          },
        ] : [],
        [Contacts.Fields.Addresses]: (card.city || card.state) ? [
          {
            label: 'work',
            city: card.city,
            region: card.state,
            country: 'USA',
          },
        ] : [],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success', `${card.companyName} has been saved to your contacts!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  // Call Pro
  const callPro = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Unable to call', 'No phone app is available.'));
    }
  };

  // Text Pro
  const textPro = (phone: string) => {
    if (phone) {
      Linking.openURL(`sms:${phone}`).catch(() => Alert.alert('Unable to text', 'No messaging app is available.'));
    }
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.background : '#F3F4F6',
    },
    headerTitle: {
      color: isDark ? theme.text : '#111827',
    },
    menuIcon: {
      color: isDark ? theme.text : '#374151',
    },
    subtitle: {
      color: isDark ? theme.textSecondary : '#6B7280',
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8A05BE" />
        <Text style={[styles.loadingText, dynamicStyles.subtitle]}>Loading your wallet...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ToolHeader title="Wallet" subtitle="Your saved cards and contact details." safeAreaTop>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput accessibilityLabel="Search your cards" placeholder="Search your cards..." placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} style={{ flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, paddingHorizontal: 12, backgroundColor: theme.surface, color: theme.text }} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Wallet options" onPress={() => { setSelectedCard(null); setMenuVisible(true); }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="ellipsis-horizontal-circle" size={26} color={theme.text} /></TouchableOpacity>
        </View>
      </ToolHeader>

      {!userId && <Text style={{ padding: 16, color: dynamicStyles.subtitle.color }}>Guest cards stay on this device and are separate from account wallets.</Text>}
      {!!error && <TouchableOpacity accessibilityRole="button" onPress={onRefresh} style={{ padding: 16 }}><Text style={{ color: '#DC2626' }}>{error} Tap to retry.</Text></TouchableOpacity>}
      {removing && <ActivityIndicator accessibilityLabel="Removing card" />}
      {/* Cards Stack */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#8A05BE"
          />
        }
      >
        {visibleCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{search ? 'No matching cards' : 'No Cards Yet'}</Text>
            <Text style={styles.emptySubtitle}>
              Save Pro cards to your wallet for quick access to your favorite contractors
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.getParent()?.navigate('Pros')}
            >
              <Text style={styles.browseButtonText}>Browse Pros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {visibleCards.map((card, index) => {
              const isExpanded = expandedCardId === card.id;

              return (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.95}
                  onPress={() => handleCardPress(card)}
                  onLongPress={() => {
                    setSelectedCard(card);
                    setMenuVisible(true);
                  }}
                  style={[
                    styles.cardWrapper,
                    {
                      marginBottom: 14,
                      zIndex: savedCards.length - index,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={card.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.card,
                      isExpanded && styles.cardExpanded,
                    ]}
                  >
                    {/* Card Content */}
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.companyName} numberOfLines={1}>{card.companyName}</Text>
                        {card.verified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {card.category}{card.city ? ` • ${card.city}` : ''}{card.state ? `, ${card.state}` : ''}
                      </Text>
                    </View>

                    {/* Expanded Actions */}
                    {isExpanded && (
                      <View style={styles.expandedActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => callPro(card.phone)}
                          disabled={!card.phone}
                        >
                          <Ionicons name="call" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => textPro(card.phone)}
                          disabled={!card.phone}
                        >
                          <Ionicons name="chatbubble" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => saveContactToPhone(card)}
                        >
                          <Ionicons name="download" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => navigation.navigate('ProCardDetail', { 
                            cardId: card.id,
                            slug: card.slug,
                            card: card 
                          })}
                        >
                          <Ionicons name="expand" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>
              {selectedCard ? selectedCard.companyName : 'Wallet Options'}
            </Text>
            
            {selectedCard ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('ProCardDetail', { 
                      cardId: selectedCard.id,
                      slug: selectedCard.slug,
                      card: selectedCard 
                    });
                  }}
                >
                  <Ionicons name="expand-outline" size={22} color="#374151" />
                  <Text style={styles.menuItemText}>View Full Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => saveContactToPhone(selectedCard)}
                >
                  <Ionicons name="download-outline" size={22} color="#374151" />
                  <Text style={styles.menuItemText}>Save to Contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => handleMenuAction('remove')}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Remove from Wallet</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('refresh')}
                >
                  <Ionicons name="reorder-four-outline" size={22} color="#374151" />
                  <Text style={styles.menuItemText}>Refresh Cards</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => {
                setMenuVisible(false);
                setSelectedCard(null);
              }}
            >
              <Text style={styles.menuItemCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardsContainer: {
    position: 'relative',
    marginTop: 20,
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardExpanded: {
    height: CARD_HEIGHT + 50,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8A05BE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: '#8A05BE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    paddingTop: 20,
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },
  menuItemCancel: {
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItemCancelText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
