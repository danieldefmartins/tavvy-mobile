/**
 * ECardHubScreen.tsx
 * Main entry point for eCard feature - shows existing cards or create new option
 * Inspired by Linktree's dashboard design
 * Path: screens/ecard/ECardHubScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // Two cards side by side with padding

interface CardData {
  id: string;
  full_name: string;
  title: string;
  slug: string;
  is_published: boolean;
  profile_photo_url: string | null;
  gradient_color_1: string;
  gradient_color_2: string;
  view_count: number;
  tap_count: number;
  created_at: string;
}

export default function ECardHubScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCards = async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, full_name, title, slug, is_published, profile_photo_url, gradient_color_1, gradient_color_2, view_count, tap_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCards(data);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCards();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };

  const handleEditCard = (card: CardData) => {
    navigation.navigate('ECardDashboard', { cardId: card.id });
  };

  const handleCreateNew = () => {
    navigation.navigate('ECardTemplateGallery');
  };

  const handleViewCard = (card: CardData) => {
    navigation.navigate('ECardPreview', { cardId: card.id });
  };

  const renderCardTile = (card: CardData) => {
    const gradientColors: [string, string] = [
      card.gradient_color_1 || '#667eea',
      card.gradient_color_2 || '#764ba2',
    ];

    return (
      <TouchableOpacity
        key={card.id}
        style={styles.cardTile}
        onPress={() => handleEditCard(card)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, card.is_published ? styles.publishedBadge : styles.draftBadge]}>
            <Text style={styles.statusText}>
              {card.is_published ? 'Live' : 'Draft'}
            </Text>
          </View>

          {/* Profile Photo */}
          <View style={styles.cardPhotoContainer}>
            {card.profile_photo_url ? (
              <Image
                source={{ uri: card.profile_photo_url }}
                style={styles.cardPhoto}
              />
            ) : (
              <View style={styles.cardPhotoPlaceholder}>
                <Ionicons name="person" size={24} color="rgba(255,255,255,0.5)" />
              </View>
            )}
          </View>

          {/* Card Info */}
          <Text style={styles.cardName} numberOfLines={1}>
            {card.full_name || 'Untitled Card'}
          </Text>
          {card.title && (
            <Text style={styles.cardTitle} numberOfLines={1}>
              {card.title}
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{card.view_count || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="hand-left-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{card.tap_count || 0}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Edit Button */}
        <View style={styles.cardActions}>
          <Text style={styles.editText}>Edit Card</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateNewTile = () => (
    <TouchableOpacity
      style={styles.cardTile}
      onPress={handleCreateNew}
      activeOpacity={0.9}
    >
      <View style={styles.createNewGradient}>
        <View style={styles.createNewIcon}>
          <Ionicons name="add" size={40} color="#00C853" />
        </View>
        <Text style={styles.createNewTitle}>Create New</Text>
        <Text style={styles.createNewSubtitle}>Start fresh with a new card</Text>
      </View>
      <View style={styles.cardActions}>
        <Text style={styles.editText}>Get Started</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={styles.loadingText}>Loading your cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My eCards</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Digital Business Cards</Text>
          <Text style={styles.heroSubtitle}>
            Create, customize, and share your professional identity
          </Text>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {cards.map(renderCardTile)}
          {renderCreateNewTile()}
        </View>

        {/* Quick Stats (if user has cards) */}
        {cards.length > 0 && (
          <View style={styles.quickStats}>
            <Text style={styles.quickStatsTitle}>Quick Stats</Text>
            <View style={styles.statsCards}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>
                  {cards.reduce((sum, card) => sum + (card.view_count || 0), 0)}
                </Text>
                <Text style={styles.statCardLabel}>Total Views</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>
                  {cards.reduce((sum, card) => sum + (card.tap_count || 0), 0)}
                </Text>
                <Text style={styles.statCardLabel}>Total Taps</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{cards.length}</Text>
                <Text style={styles.statCardLabel}>Cards</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State (no cards) */}
        {cards.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="id-card-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first digital business card and start sharing your professional identity
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateNew}
            >
              <LinearGradient
                colors={['#00C853', '#00A843']}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Your First Card</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Pro Tip */}
        <View style={styles.proTip}>
          <View style={styles.proTipIcon}>
            <Ionicons name="bulb" size={20} color="#FFB300" />
          </View>
          <View style={styles.proTipContent}>
            <Text style={styles.proTipTitle}>Pro Tip</Text>
            <Text style={styles.proTipText}>
              Share your card link on social media bios, email signatures, and business materials for maximum reach.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  cardTile: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
    minHeight: 180,
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  publishedBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.9)',
  },
  draftBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardPhotoContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  cardPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  createNewGradient: {
    padding: 16,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  createNewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  createNewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  createNewSubtitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  quickStats: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00C853',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  proTip: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  proTipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 179, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTipContent: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
