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
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
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
  banner_image_url?: string | null;
  background_image_url?: string | null;
  gallery_images?: { id: string; url: string; caption?: string }[] | null;
  videos?: { type: string; url: string }[] | null;
  gradient_color_1: string;
  gradient_color_2: string;
  view_count: number;
  tap_count: number;
  created_at: string;
}

export default function ECardHubScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalCard, setDeleteModalCard] = useState<CardData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchCards = async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, full_name, title, slug, is_published, profile_photo_url, banner_image_url, background_image_url, gallery_images, videos, gradient_color_1, gradient_color_2, view_count, tap_count, created_at')
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
    navigation.navigate('ECardTemplateGallery', { mode: 'create' });
  };

  const handleViewCard = (card: CardData) => {
    navigation.navigate('ECardPreview', { cardId: card.id });
  };

  /**
   * Full cascade delete — removes storage files then DB row.
   * Child table rows (digital_card_links, card_links, card_blocks,
   * form_submissions, card_recommendations) are cleaned up automatically
   * by ON DELETE CASCADE foreign-key constraints.
   */
  const handleDeleteCard = async () => {
    if (!deleteModalCard) return;
    setDeleting(true);
    try {
      const card = deleteModalCard;

      // 1. Collect every ecard-assets URL referenced by this card
      const urlsToDelete: string[] = [];
      if (card.profile_photo_url) urlsToDelete.push(card.profile_photo_url);
      if (card.banner_image_url) urlsToDelete.push(card.banner_image_url);
      if (card.background_image_url) urlsToDelete.push(card.background_image_url);
      if (Array.isArray(card.gallery_images)) {
        for (const img of card.gallery_images) {
          if (img?.url) urlsToDelete.push(img.url);
        }
      }
      if (Array.isArray(card.videos)) {
        for (const vid of card.videos) {
          if (vid?.url) urlsToDelete.push(vid.url);
        }
      }

      // 2. Convert public URLs to storage paths and batch-delete
      const storagePaths: string[] = [];
      for (const url of urlsToDelete) {
        if (!url) continue;
        const match = url.match(/ecard-assets\/(.+)$/);
        if (match) storagePaths.push(match[1]);
      }
      if (storagePaths.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from('ecard-assets')
          .remove(storagePaths);
        if (storageErr) {
          console.warn('Failed to remove some storage files:', storageErr);
        }
      }

      // 3. Delete the card row (cascades to all child tables)
      const { error } = await supabase
        .from('digital_cards')
        .delete()
        .eq('id', card.id);

      if (error) throw error;

      setCards(prev => prev.filter(c => c.id !== card.id));
      setDeleteModalCard(null);
    } catch (err) {
      console.error('Error deleting card:', err);
      Alert.alert('Error', 'Failed to delete card. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderCardTile = (card: CardData) => {
    const gradientColors: [string, string] = [
      card.gradient_color_1 || '#667eea',
      card.gradient_color_2 || '#764ba2',
    ];

    return (
      <TouchableOpacity
        key={card.id}
        style={[styles.cardTile, { backgroundColor: isDark ? theme.surface : '#fff' }]}
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

        {/* Action Row: Edit + Duplicate + Delete */}
        <View style={[styles.cardActions, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <Text style={[styles.editText, { color: isDark ? '#94A3B8' : '#666' }]}>Edit Card</Text>
          <View style={styles.cardActionsRight}>
            <TouchableOpacity
              style={styles.duplicateBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={duplicating === card.id}
              onPress={async () => {
                if (!user || duplicating) return;
                setDuplicating(card.id);
                try {
                  // Fetch full card data
                  const { data: fullCard } = await supabase.from('digital_cards').select('*').eq('id', card.id).single();
                  if (!fullCard) { Alert.alert('Error', 'Could not load card data.'); return; }
                  // Fetch links
                  const { data: links } = await supabase.from('digital_card_links').select('*').eq('card_id', card.id).eq('is_active', true).order('sort_order', { ascending: true });
                  // Build new card
                  const suffix = Math.random().toString(36).substring(2, 6);
                  const { id, created_at, updated_at, slug, view_count, tap_count, review_count, review_rating, ...rest } = fullCard;
                  const newSlug = (slug || 'card') + '-copy-' + suffix;
                  const { data: newCard, error } = await supabase.from('digital_cards').insert({
                    ...rest,
                    user_id: user.id,
                    slug: newSlug,
                    full_name: (fullCard.full_name || 'Card') + ' (Copy)',
                    is_published: false,
                    view_count: 0,
                    tap_count: 0,
                    review_count: 0,
                    review_rating: 0,
                  }).select().single();
                  if (error || !newCard) { Alert.alert('Error', 'Failed to duplicate card.'); return; }
                  // Copy links
                  if (links && links.length > 0) {
                    const newLinks = links.map((l: any, i: number) => ({
                      card_id: newCard.id,
                      platform: l.platform,
                      title: l.title || l.platform,
                      url: l.url || l.value,
                      icon: l.icon || l.platform,
                      sort_order: i,
                      is_active: true,
                    }));
                    await supabase.from('digital_card_links').insert(newLinks);
                  }
                  // Navigate to the new card
                  navigation.navigate('ECardDashboard', { cardId: newCard.id });
                } catch (err) {
                  console.error('Duplicate error:', err);
                  Alert.alert('Error', 'Failed to duplicate card.');
                } finally {
                  setDuplicating(null);
                }
              }}
            >
              {duplicating === card.id ? (
                <ActivityIndicator size="small" color={isDark ? '#94A3B8' : '#666'} />
              ) : (
                <Ionicons name="copy-outline" size={16} color={isDark ? '#94A3B8' : '#666'} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                setDeleteModalCard(card);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#94A3B8' : '#666'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateNewTile = () => (
    <TouchableOpacity
      style={[styles.cardTile, { backgroundColor: isDark ? theme.surface : '#fff' }]}
      onPress={handleCreateNew}
      activeOpacity={0.9}
    >
      <View style={[styles.createNewGradient, { 
        backgroundColor: isDark ? theme.surfaceElevated : '#F8F8F8',
        borderColor: isDark ? '#374151' : '#E8E8E8',
      }]}>
        <View style={styles.createNewIcon}>
          <Ionicons name="add" size={40} color="#00C853" />
        </View>
        <Text style={[styles.createNewTitle, { color: isDark ? '#fff' : '#333' }]}>Create New</Text>
        <Text style={[styles.createNewSubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#999' }]}>
          Start fresh with a new card
        </Text>
      </View>
      <View style={[styles.cardActions, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <Text style={[styles.editText, { color: isDark ? '#94A3B8' : '#666' }]}>Get Started</Text>
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#94A3B8' : '#666'} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#666' }]}>Loading your cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.background,
        borderBottomColor: isDark ? '#1A1A1A' : '#F0F0F0',
      }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? theme.surface : '#F5F5F5' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]}>My eCards</Text>
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
          <Text style={[styles.heroTitle, { color: isDark ? '#fff' : '#1A1A1A' }]}>Your Digital Business Cards</Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }]}>
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
            <Text style={[styles.quickStatsTitle, { color: isDark ? '#fff' : '#333' }]}>Quick Stats</Text>
            <View style={styles.statsCards}>
              <View style={[styles.statCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                <Text style={styles.statCardValue}>
                  {cards.reduce((sum, card) => sum + (card.view_count || 0), 0)}
                </Text>
                <Text style={[styles.statCardLabel, { color: isDark ? '#94A3B8' : '#999' }]}>Total Views</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                <Text style={styles.statCardValue}>
                  {cards.reduce((sum, card) => sum + (card.tap_count || 0), 0)}
                </Text>
                <Text style={[styles.statCardLabel, { color: isDark ? '#94A3B8' : '#999' }]}>Total Taps</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                <Text style={styles.statCardValue}>{cards.length}</Text>
                <Text style={[styles.statCardLabel, { color: isDark ? '#94A3B8' : '#999' }]}>Cards</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State (no cards) */}
        {cards.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="id-card-outline" size={64} color={isDark ? '#374151' : '#E0E0E0'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#333' }]}>No cards yet</Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#666' }]}>
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
        <View style={[styles.proTip, { backgroundColor: isDark ? theme.surface : '#FFF8E1' }]}>
          <View style={[styles.proTipIcon, { backgroundColor: isDark ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 179, 0, 0.2)' }]}>
            <Ionicons name="bulb" size={20} color="#FFB300" />
          </View>
          <View style={styles.proTipContent}>
            <Text style={[styles.proTipTitle, { color: isDark ? '#fff' : '#333' }]}>Pro Tip</Text>
            <Text style={[styles.proTipText, { color: isDark ? 'rgba(255,255,255,0.7)' : '#666' }]}>
              Share your card link on social media bios, email signatures, and business materials for maximum reach.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteModalCard}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteModalCard(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => !deleting && setDeleteModalCard(null)}
            >
              <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#666'} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.modalIcon}>
              <Ionicons name="trash" size={32} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#111' }]}>Delete Card?</Text>

            {/* Description */}
            <Text style={[styles.modalDesc, { color: isDark ? '#94A3B8' : '#666' }]}>
              Are you sure you want to delete "{deleteModalCard?.full_name || 'Untitled Card'}"? This will permanently remove the card, all its links, and uploaded photos. This cannot be undone.
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setDeleteModalCard(null)}
                disabled={deleting}
              >
                <Text style={[styles.modalBtnText, { color: isDark ? '#fff' : '#333' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteCard}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
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
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  duplicateBtn: {
    padding: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
  },
  createNewGradient: {
    padding: 16,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
  },
  createNewSubtitle: {
    fontSize: 12,
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
    marginBottom: 16,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTipContent: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Delete Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 28,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {},
  modalBtnDelete: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
