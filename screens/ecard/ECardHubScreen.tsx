/**
 * ECardHubScreen.tsx
 * Clean, simple entry point — shows existing cards or prompts to create one.
 * Single "+" FAB to create. Card type picker before template gallery.
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const ACCENT = '#00C853';

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

const CARD_TYPES = [
  {
    id: 'business',
    icon: 'business-outline' as const,
    label: 'Business',
    desc: 'For your company, store, or service',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    id: 'personal',
    icon: 'person-outline' as const,
    label: 'Personal',
    desc: 'Your personal brand & link page',
    gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
  },
  {
    id: 'politician',
    icon: 'flag-outline' as const,
    label: 'Politician',
    desc: 'For public servants & candidates',
    gradient: ['#00C853', '#00A843'] as [string, string],
  },
];

export default function ECardHubScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalCard, setDeleteModalCard] = useState<CardData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

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
      if (!error && data) setCards(data);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => { fetchCards(); }, [user])
  );

  const onRefresh = () => { setRefreshing(true); fetchCards(); };

  const handleEditCard = (card: CardData) => {
    navigation.navigate('ECardDashboard', { cardId: card.id });
  };

  const openTypePicker = () => {
    setShowTypePicker(true);
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeTypePicker = () => {
    Animated.timing(slideAnim, { toValue: 0, useNativeDriver: true, duration: 200 }).start(() => {
      setShowTypePicker(false);
    });
  };

  const handleCreateWithType = (type: string) => {
    closeTypePicker();
    setTimeout(() => {
      navigation.navigate('ECardTemplateGallery', { mode: 'create', cardType: type });
    }, 250);
  };

  const handleDeleteCard = async () => {
    if (!deleteModalCard) return;
    setDeleting(true);
    try {
      // Collect storage paths
      const storagePaths: string[] = [];
      const card = deleteModalCard;
      if (card.profile_photo_url) {
        const match = card.profile_photo_url.match(/ecard-assets\/(.+)/);
        if (match) storagePaths.push(match[1]);
      }
      if (card.banner_image_url) {
        const match = card.banner_image_url.match(/ecard-assets\/(.+)/);
        if (match) storagePaths.push(match[1]);
      }
      if (card.background_image_url) {
        const match = card.background_image_url.match(/ecard-assets\/(.+)/);
        if (match) storagePaths.push(match[1]);
      }
      if (card.gallery_images) {
        card.gallery_images.forEach((img: any) => {
          const match = img.url?.match(/ecard-assets\/(.+)/);
          if (match) storagePaths.push(match[1]);
        });
      }
      if (storagePaths.length > 0) {
        await supabase.storage.from('ecard-assets').remove(storagePaths);
      }
      const { error } = await supabase.from('digital_cards').delete().eq('id', card.id);
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

  const handleDuplicateCard = async (card: CardData) => {
    if (!user || duplicating) return;
    setDuplicating(card.id);
    try {
      const { data: fullCard } = await supabase.from('digital_cards').select('*').eq('id', card.id).single();
      if (!fullCard) { Alert.alert('Error', 'Could not load card data.'); return; }
      const { data: links } = await supabase.from('digital_card_links').select('*').eq('card_id', card.id).eq('is_active', true).order('sort_order', { ascending: true });
      const suffix = Math.random().toString(36).substring(2, 6);
      const { id, created_at, updated_at, slug, view_count, tap_count, review_count, review_rating, ...rest } = fullCard;
      const newSlug = (slug || 'card') + '-copy-' + suffix;
      const { data: newCard, error } = await supabase.from('digital_cards').insert({
        ...rest, user_id: user.id, slug: newSlug,
        full_name: (fullCard.full_name || 'Card') + ' (Copy)',
        is_published: false, view_count: 0, tap_count: 0, review_count: 0, review_rating: 0,
      }).select().single();
      if (error || !newCard) { Alert.alert('Error', 'Failed to duplicate card.'); return; }
      if (links && links.length > 0) {
        const newLinks = links.map((l: any, i: number) => ({
          card_id: newCard.id, platform: l.platform, title: l.title || l.platform,
          url: l.url || l.value, icon: l.icon || l.platform, sort_order: i, is_active: true,
        }));
        await supabase.from('digital_card_links').insert(newLinks);
      }
      navigation.navigate('ECardDashboard', { cardId: newCard.id });
    } catch (err) {
      console.error('Duplicate error:', err);
      Alert.alert('Error', 'Failed to duplicate card.');
    } finally {
      setDuplicating(null);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#111'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#111' }]}>My eCards</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {cards.length > 0 ? (
          /* ── Cards List ── */
          <View style={{ padding: 20, gap: 12 }}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardRow, { backgroundColor: isDark ? '#1A1A1A' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                onPress={() => handleEditCard(card)}
                activeOpacity={0.8}
              >
                {/* Thumbnail */}
                <LinearGradient
                  colors={[card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']}
                  style={styles.cardThumb}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {card.profile_photo_url ? (
                    <Image source={{ uri: card.profile_photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>
                      {(card.full_name || 'U')[0].toUpperCase()}
                    </Text>
                  )}
                </LinearGradient>

                {/* Info */}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.cardName, { color: isDark ? '#fff' : '#111' }]} numberOfLines={1}>
                      {card.full_name || 'Untitled Card'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: card.is_published ? 'rgba(0,200,83,0.12)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') }]}>
                      <Text style={[styles.badgeText, { color: card.is_published ? ACCENT : (isDark ? '#94A3B8' : '#888') }]}>
                        {card.is_published ? 'Live' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                  {card.title ? (
                    <Text style={[styles.cardSubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]} numberOfLines={1}>
                      {card.title}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye-outline" size={12} color={isDark ? '#94A3B8' : '#888'} />
                      <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#888' }}>{card.view_count || 0}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="hand-left-outline" size={12} color={isDark ? '#94A3B8' : '#888'} />
                      <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#888' }}>{card.tap_count || 0}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleDuplicateCard(card)}
                    disabled={duplicating === card.id}
                    style={{ padding: 6, opacity: duplicating === card.id ? 0.4 : 1 }}
                  >
                    {duplicating === card.id ? (
                      <ActivityIndicator size="small" color={isDark ? '#94A3B8' : '#888'} />
                    ) : (
                      <Ionicons name="copy-outline" size={16} color={isDark ? '#94A3B8' : '#888'} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => setDeleteModalCard(card)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? '#94A3B8' : '#888'} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* ── Empty State ── */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.08)' }]}>
              <Ionicons name="add" size={36} color={ACCENT} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#111' }]}>Create your first eCard</Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
              Tap the + button below to get started with your digital card
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openTypePicker}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[ACCENT, '#00A843']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Card Type Picker Bottom Sheet ── */}
      {showTypePicker && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeTypePicker} />
          </Animated.View>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: isDark ? '#1A1A1A' : '#fff', transform: [{ translateY }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#DDD' }]} />
            <Text style={[styles.sheetTitle, { color: isDark ? '#fff' : '#111' }]}>Choose your card type</Text>
            <Text style={[styles.sheetSubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
              Select the type that best fits your needs
            </Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              {CARD_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.id}
                  style={[styles.typeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                  onPress={() => handleCreateWithType(ct.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={ct.gradient} style={styles.typeIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={ct.icon} size={24} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.typeLabel, { color: isDark ? '#fff' : '#111' }]}>{ct.label}</Text>
                    <Text style={[styles.typeDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>{ct.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#94A3B8' : '#888'} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal visible={!!deleteModalCard} transparent animationType="fade" onRequestClose={() => !deleting && setDeleteModalCard(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => !deleting && setDeleteModalCard(null)}>
              <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#666'} />
            </TouchableOpacity>
            <View style={styles.modalIcon}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#111' }]}>Delete Card?</Text>
            <Text style={[styles.modalDesc, { color: isDark ? '#94A3B8' : '#666' }]}>
              This will permanently remove "{deleteModalCard?.full_name || 'Untitled Card'}" and all its data. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setDeleteModalCard(null)}
                disabled={deleting}
              >
                <Text style={[styles.modalBtnText, { color: isDark ? '#fff' : '#333' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#EF4444' }, deleting && { opacity: 0.6 }]}
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  // Card Row
  cardRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  cardThumb: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cardName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },

  // Empty State
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 80,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 260 },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 24,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  fabGradient: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // Bottom Sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  sheetSubtitle: { fontSize: 14, marginBottom: 16 },

  // Type Row
  typeRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  typeIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: { fontSize: 16, fontWeight: '600' },
  typeDesc: { fontSize: 13, marginTop: 2 },

  // Delete Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 360, borderRadius: 20,
    padding: 28, paddingTop: 28,
  },
  modalClose: {
    position: 'absolute', top: 12, right: 12, padding: 6, borderRadius: 8,
  },
  modalIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});
