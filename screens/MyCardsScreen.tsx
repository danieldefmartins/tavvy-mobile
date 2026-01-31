/**
 * MyCardsScreen.tsx
 * Manage multiple digital cards for Pro users
 * Path: screens/MyCardsScreen.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// V2 Design System Colors
const V2_COLORS = {
  background: '#0A0A0F',
  cardBackground: '#1A1A24',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)',
};

interface DigitalCard {
  id: string;
  slug: string;
  card_name: string | null;
  full_name: string;
  title: string | null;
  company: string | null;
  gradient_color_1: string;
  gradient_color_2: string;
  profile_photo_url: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function MyCardsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const { user, isPro, maxCards, refreshProfile } = useAuth();
  const [cards, setCards] = useState<DigitalCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, slug, card_name, full_name, title, company, gradient_color_1, gradient_color_2, profile_photo_url, custom_domain, custom_domain_verified, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
      Alert.alert('Error', 'Failed to load your cards.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
      refreshProfile();
    }, [fetchCards, refreshProfile])
  );

  const handleCreateCard = () => {
    if (cards.length >= maxCards) {
      if (!isPro) {
        Alert.alert(
          'Upgrade to Pro',
          'Free users can only have 1 card. Upgrade to Pro to create up to 5 cards!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('ECardPremiumUpsell', { reason: 'card_limit' }) },
          ]
        );
      } else {
        Alert.alert(
          'Card Limit Reached',
          `You've reached your limit of ${maxCards} cards.`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    // Navigate to create new card using the new ECard flow
    navigation.navigate('ECardTemplateGallery', { mode: 'create' });
  };

  const handleEditCard = (card: DigitalCard) => {
    // Navigate to ECardDashboard for editing
    navigation.navigate('ECardDashboard', { 
      cardId: card.id,
    });
  };

  const handleViewCard = (card: DigitalCard) => {
    // Navigate to ECardDashboard for viewing/editing
    navigation.navigate('ECardDashboard', { 
      cardId: card.id,
    });
  };

  const handleDeleteCard = (card: DigitalCard) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${card.card_name || card.full_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete card links first
              await supabase.from('card_links').delete().eq('card_id', card.id);
              // Delete the card
              const { error } = await supabase
                .from('digital_cards')
                .delete()
                .eq('id', card.id);
              
              if (error) throw error;
              
              // Refresh the list
              fetchCards();
              Alert.alert('Success', 'Card deleted successfully.');
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card.');
            }
          },
        },
      ]
    );
  };

  const handleCardSettings = (card: DigitalCard) => {
    navigation.navigate('CardSettings', { cardId: card.id, card });
  };

  const renderCardItem = (card: DigitalCard, index: number) => (
    <TouchableOpacity
      key={card.id}
      style={styles.cardItem}
      onPress={() => handleViewCard(card)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[card.gradient_color_1 || '#8B5CF6', card.gradient_color_2 || '#4F46E5']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardNumber}>Card {index + 1}</Text>
            {card.custom_domain && (
              <View style={[styles.domainBadge, card.custom_domain_verified && styles.domainVerified]}>
                <Ionicons 
                  name={card.custom_domain_verified ? 'checkmark-circle' : 'globe-outline'} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.domainBadgeText}>
                  {card.custom_domain_verified ? 'Domain Active' : 'Domain Pending'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {card.card_name || card.full_name}
            </Text>
            {card.title && (
              <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
            )}
            {card.company && (
              <Text style={styles.cardCompany} numberOfLines={1}>{card.company}</Text>
            )}
          </View>

          <View style={styles.cardUrl}>
            <Ionicons name="link-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.cardUrlText} numberOfLines={1}>
              {card.custom_domain || `tavvy.com/${card.slug}`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditCard(card)}
        >
          <Ionicons name="pencil-outline" size={20} color={V2_COLORS.textSecondary} />
          <Text style={[styles.actionText, { color: V2_COLORS.textSecondary }]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleCardSettings(card)}
        >
          <Ionicons name="settings-outline" size={20} color={V2_COLORS.textSecondary} />
          <Text style={[styles.actionText, { color: V2_COLORS.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteCard(card)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="card-outline" size={64} color={V2_COLORS.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: V2_COLORS.text }]}>No Cards Yet</Text>
      <Text style={[styles.emptySubtitle, { color: V2_COLORS.textSecondary }]}>
        Create your first digital business card to start sharing your contact info.
      </Text>
      <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateCard}>
        <LinearGradient
          colors={['#6B7FFF', '#5563E8']}
          style={styles.createFirstGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createFirstText}>Create Your First Card</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={V2_COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My eCards</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7FFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={V2_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My eCards</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subscription Status */}
      <View style={styles.subscriptionBar}>
        <View style={styles.subscriptionInfo}>
          <Ionicons 
            name={isPro ? 'star' : 'star-outline'} 
            size={20} 
            color={isPro ? '#FFD700' : V2_COLORS.textSecondary} 
          />
          <Text style={styles.subscriptionText}>
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </Text>
        </View>
        <Text style={styles.cardCount}>
          {cards.length} / {maxCards} cards
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {cards.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {cards.map((card, index) => renderCardItem(card, index))}
            
            {/* Add New Card Button */}
            {cards.length < maxCards && (
              <TouchableOpacity style={styles.addCardButton} onPress={handleCreateCard}>
                <View style={styles.addCardInner}>
                  <Ionicons name="add-circle-outline" size={32} color="#6B7FFF" />
                  <Text style={styles.addCardText}>
                    Create New Card
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Upgrade Prompt */}
            {!isPro && cards.length >= maxCards && (
              <TouchableOpacity 
                style={styles.upgradePrompt}
                onPress={() => navigation.navigate('ECardPremiumUpsell')}
              >
                <LinearGradient
                  colors={['#6B7FFF', '#5563E8']}
                  style={styles.upgradeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="rocket-outline" size={24} color="#fff" />
                  <View style={styles.upgradeTextContainer}>
                    <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                    <Text style={styles.upgradeSubtitle}>Create up to 5 cards + custom domains</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: V2_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: V2_COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  subscriptionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: V2_COLORS.cardBackground,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: V2_COLORS.text,
  },
  cardCount: {
    fontSize: 14,
    color: V2_COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardItem: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: V2_COLORS.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainVerified: {
    backgroundColor: 'rgba(0,200,83,0.3)',
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    gap: 4,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  cardCompany: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardUrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardUrlText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: V2_COLORS.border,
    backgroundColor: V2_COLORS.cardBackground,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createFirstGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  createFirstText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  addCardButton: {
    marginTop: 8,
  },
  addCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    borderColor: V2_COLORS.border,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7FFF',
  },
  upgradePrompt: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
