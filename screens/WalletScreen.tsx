/**
 * WalletScreen.tsx
 * Tavvy Wallet - Apple Wallet style stacked cards
 * Path: screens/WalletScreen.tsx
 *
 * FEATURES:
 * - Stacked cards like Apple Wallet (overlapping)
 * - Each card shows Pro's gradient colors
 * - Tap card to expand to full Pro Card view
 * - Menu for Edit, Remove, Reorder
 * - Save contact to phone functionality
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import * as Contacts from 'expo-contacts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 80;
const CARD_OVERLAP = 60;

interface ProCard {
  id: string;
  companyName: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  gradientColors: [string, string];
  profilePhoto?: string;
  verified: boolean;
}

// Mock saved cards data
const MOCK_SAVED_CARDS: ProCard[] = [
  {
    id: '1',
    companyName: 'Quick Fix Handyman',
    category: 'Handyman',
    city: 'Fort Myers',
    state: 'FL',
    phone: '+15551234567',
    email: 'contact@quickfix.com',
    gradientColors: ['#EF4444', '#DC2626'],
    verified: true,
  },
  {
    id: '2',
    companyName: 'Pro Roofing',
    category: 'Roofing',
    city: 'Naples',
    state: 'FL',
    phone: '+15552345678',
    email: 'info@proroofing.com',
    gradientColors: ['#14B8A6', '#0D9488'],
    verified: true,
  },
  {
    id: '3',
    companyName: 'Green Lawn Care',
    category: 'Landscaping',
    city: 'Jacksonville',
    state: 'FL',
    phone: '+15553456789',
    email: 'hello@greenlawn.com',
    gradientColors: ['#22C55E', '#16A34A'],
    verified: true,
  },
  {
    id: '4',
    companyName: 'Cool Air HVAC',
    category: 'HVAC',
    city: 'Miami',
    state: 'FL',
    phone: '+15554567890',
    email: 'service@coolair.com',
    gradientColors: ['#F97316', '#EA580C'],
    verified: true,
  },
  {
    id: '5',
    companyName: "John's Electric",
    category: 'Electrician',
    city: 'Tampa',
    state: 'FL',
    phone: '+15555678901',
    email: 'john@johnselectric.com',
    gradientColors: ['#3B82F6', '#2563EB'],
    verified: true,
  },
  {
    id: '6',
    companyName: 'Martinez Plumbing',
    category: 'Plumber',
    city: 'Orlando',
    state: 'FL',
    phone: '+15556789012',
    email: 'contact@martinezplumbing.com',
    gradientColors: ['#8B5CF6', '#7C3AED'],
    verified: true,
  },
];

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [savedCards, setSavedCards] = useState<ProCard[]>(MOCK_SAVED_CARDS);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ProCard | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Handle card tap
  const handleCardPress = (card: ProCard) => {
    if (expandedCardId === card.id) {
      // Navigate to full card view
      navigation.navigate('ProCardDetail', { cardId: card.id });
    } else {
      setExpandedCardId(card.id);
    }
  };

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    switch (action) {
      case 'edit':
        // Reorder mode
        Alert.alert('Reorder Cards', 'Drag cards to reorder them');
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
                onPress: () => {
                  setSavedCards(cards => cards.filter(c => c.id !== selectedCard.id));
                  setSelectedCard(null);
                },
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
        [Contacts.Fields.FirstName]: card.companyName,
        [Contacts.Fields.Company]: card.companyName,
        [Contacts.Fields.JobTitle]: card.category,
        [Contacts.Fields.PhoneNumbers]: [
          {
            label: 'work',
            number: card.phone,
          },
        ],
        [Contacts.Fields.Emails]: [
          {
            label: 'work',
            email: card.email,
          },
        ],
        [Contacts.Fields.Addresses]: [
          {
            label: 'work',
            city: card.city,
            region: card.state,
            country: 'USA',
          },
        ],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success', `${card.companyName} has been saved to your contacts!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  // Call Pro
  const callPro = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Text Pro
  const textPro = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
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
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Tavvy Wallet</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal-circle" size={28} color={dynamicStyles.menuIcon.color} />
        </TouchableOpacity>
      </View>

      {/* Cards Stack */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptySubtitle}>
              Save Pro cards to your wallet for quick access
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {savedCards.map((card, index) => {
              const isExpanded = expandedCardId === card.id;
              const cardTop = index * (CARD_HEIGHT - CARD_OVERLAP);

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
                      top: cardTop,
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
                      <Text style={styles.companyName}>{card.companyName}</Text>
                      <Text style={styles.cardSubtitle}>
                        {card.category} • {card.city}, {card.state}
                      </Text>
                    </View>

                    {/* Expanded Actions */}
                    {isExpanded && (
                      <View style={styles.expandedActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => callPro(card.phone)}
                        >
                          <Ionicons name="call" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => textPro(card.phone)}
                        >
                          <Ionicons name="chatbubble" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => saveContactToPhone(card)}
                        >
                          <Ionicons name="download" size={20} color="#fff" />
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
          <View style={[styles.menuContainer, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
            >
              <Ionicons name="reorder-three" size={24} color={isDark ? theme.text : '#374151'} />
              <Text style={[styles.menuItemText, { color: isDark ? theme.text : '#374151' }]}>
                Reorder Cards
              </Text>
            </TouchableOpacity>
            {selectedCard && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('remove')}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                  Remove Card
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => setMenuVisible(false)}
            >
              <Ionicons name="close" size={24} color={isDark ? theme.textSecondary : '#6B7280'} />
              <Text style={[styles.menuItemText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                Cancel
              </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
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
    height: MOCK_SAVED_CARDS.length * (CARD_HEIGHT - CARD_OVERLAP) + CARD_OVERLAP + 100,
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
});
