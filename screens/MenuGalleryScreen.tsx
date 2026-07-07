/**
 * Menu Gallery Screen - Full-Screen Image-First Experience
 * Path: screens/MenuGalleryScreen.tsx
 *
 * Features:
 * - Full-screen horizontal scroll (Instagram Stories style)
 * - Big food images on black background
 * - FlatList with pagingEnabled for one-card-at-a-time swiping
 * - Category filter pills, meal period toggle
 * - Counter for position
 * - Dark, minimal, premium feel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { withScreenErrorBoundary } from '../components/ScreenErrorBoundary';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ===== TYPES =====

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  dietary_tags: string[] | null;
  category_id: string;
  category_name?: string;
  meal_period?: string | null;
  sort_order?: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
  meal_period: string | null;
}

interface Menu {
  id: string;
  place_id: string;
  name: string;
  style: string | null;
  cover_image_url: string | null;
}

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

type RouteParams = {
  MenuGallery: {
    placeId: string;
    placeName?: string;
  };
};

const DIETARY_LABELS: Record<string, { icon: string; label: string }> = {
  vegan: { icon: '🌱', label: 'Vegan' },
  vegetarian: { icon: '🌱', label: 'Veggie' },
  'gluten-free': { icon: '🌾', label: 'GF' },
  gluten_free: { icon: '🌾', label: 'GF' },
  gf: { icon: '🌾', label: 'GF' },
  dairy_free: { icon: '🥛', label: 'DF' },
  nut_free: { icon: '🌰', label: 'NF' },
  spicy: { icon: '🌶️', label: 'Mild' },
  'spicy-2': { icon: '🌶️🌶️', label: 'Spicy' },
  'spicy-3': { icon: '🌶️🌶️🌶️', label: 'Hot' },
};

const PERIOD_LABELS: Record<MealPeriod, string> = {
  all: 'All',
  dinner: 'Dinner',
  lunch: 'Lunch',
  breakfast: 'Breakfast',
  all_day: 'All Day',
};

const ALLERGEN_FILTERS = [
  { id: 'nut-free', label: 'Nut-Free', tag: 'nut_free' },
  { id: 'gluten-free', label: 'Gluten-Free', tag: 'gluten_free' },
  { id: 'dairy-free', label: 'Dairy-Free', tag: 'dairy_free' },
  { id: 'vegan', label: 'Vegan', tag: 'vegan' },
  { id: 'vegetarian', label: 'Vegetarian', tag: 'vegetarian' },
];

function MenuGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'MenuGallery'>>();
  const { placeId, placeName: initialPlaceName } = route.params;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [placeName, setPlaceName] = useState<string>(initialPlaceName || '');
  const [placeSlug, setPlaceSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [noMenu, setNoMenu] = useState(false);

  // Filters
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Scroll position
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (placeId) {
      loadMenu(placeId);
    }
  }, [placeId]);

  const loadMenu = async (pid: string) => {
    setLoading(true);
    try {
      // Fetch place name and slug
      const { data: placeData } = await supabase
        .from('places')
        .select('name, slug')
        .eq('id', pid)
        .maybeSingle();
      if (placeData) {
        if (!initialPlaceName) setPlaceName(placeData.name || '');
        setPlaceSlug(placeData.slug || '');
      }

      const { data: menuData } = await supabase
        .from('menus')
        .select('*')
        .eq('place_id', pid)
        .maybeSingle();

      if (!menuData) {
        setNoMenu(true);
        setLoading(false);
        return;
      }

      setMenu(menuData);

      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);

        const categoryIds = categoriesData.map((c: MenuCategory) => c.id);
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoryIds)
          .order('sort_order', { ascending: true });

        if (itemsData) {
          const catMap: Record<string, MenuCategory> = {};
          categoriesData.forEach((c: MenuCategory) => { catMap[c.id] = c; });

          const enrichedItems: MenuItem[] = itemsData.map((item: any) => ({
            ...item,
            category_name: catMap[item.category_id]?.name || '',
            meal_period: catMap[item.category_id]?.meal_period || null,
          }));

          setAllItems(enrichedItems);
        }
      }
    } catch (error) {
      console.error('[MenuGallery] Error loading menu:', error);
      setNoMenu(true);
    } finally {
      setLoading(false);
    }
  };

  // Filtered items
  const filteredItems = allItems.filter(item => {
    if (activePeriod !== 'all') {
      if (item.meal_period !== activePeriod && item.meal_period !== 'all_day' && item.meal_period !== null) {
        return false;
      }
    }
    if (activeCategory !== 'all') {
      if (item.category_id !== activeCategory) return false;
    }
    return true;
  });

  // Available periods
  const availablePeriods: MealPeriod[] = ['all'];
  const periodsInData = new Set(categories.map(c => c.meal_period).filter(Boolean));
  if (periodsInData.has('dinner')) availablePeriods.push('dinner');
  if (periodsInData.has('lunch')) availablePeriods.push('lunch');
  if (periodsInData.has('breakfast')) availablePeriods.push('breakfast');
  if (periodsInData.has('all_day')) availablePeriods.push('all_day');

  // Reset index when filters change
  useEffect(() => {
    setActiveIndex(0);
    if (flatListRef.current && filteredItems.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [activePeriod, activeCategory]);

  const formatPrice = (price: number | null, priceLabel: string | null): string => {
    if (priceLabel) return priceLabel;
    if (price === null || price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const handleShareDish = async (item: MenuItem) => {
    const slug = placeSlug || placeId;
    const shareUrl = `https://tavvy.com/place/${placeId}/menu-gallery?dish=${item.id}`;
    const priceStr = formatPrice(item.price, item.price_label);
    const shareText = `${item.name} at ${placeName}${priceStr ? ` — ${priceStr}` : ''}`;
    try {
      await Share.share({
        message: `${shareText}\n${shareUrl}`,
        title: item.name,
        url: shareUrl,
      });
    } catch {}
  };

  const renderCard = useCallback(({ item, index }: { item: MenuItem; index: number }) => {
    const priceStr = formatPrice(item.price, item.price_label);
    const imageUrl = item.image_url || menu?.cover_image_url || null;

    return (
      <View style={styles.card}>
        {/* Full-screen image */}
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardPlaceholder}>
              <Text style={styles.cardPlaceholderText}>{item.category_name}</Text>
            </View>
          )}

          {/* Gradient overlay for text readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
            locations={[0, 0.15, 0.6, 0.9, 1]}
            style={styles.cardGradient}
            pointerEvents="none"
          />

          {/* Price badge + share (top right) */}
          <View style={styles.topRightGroup}>
            {priceStr ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{priceStr}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => handleShareDish(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Badges (top left) */}
          <View style={styles.badgesTopLeft}>
            {item.is_popular && (
              <View style={[styles.badge, styles.badgeFire]}>
                <Text style={styles.badgeText}>{'\u{1F525}'} Popular</Text>
              </View>
            )}
            {item.is_new && (
              <View style={[styles.badge, styles.badgeNew]}>
                <Text style={styles.badgeText}>{'\u2728'} New</Text>
              </View>
            )}
          </View>

          {/* Counter */}
          {filteredItems.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {activeIndex + 1} / {filteredItems.length}
              </Text>
            </View>
          )}

          {/* Dish name */}
          <Text style={styles.dishName}>{item.name}</Text>

          {/* Description + dietary tags */}
          <View style={styles.infoBlock}>
            {item.description ? (
              <Text style={styles.dishDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <View style={styles.dietaryRow}>
                {item.dietary_tags.map(tag => {
                  const info = DIETARY_LABELS[tag.toLowerCase()];
                  if (!info) return null;
                  return (
                    <View key={tag} style={styles.dietaryPill}>
                      <Text style={styles.dietaryPillText}>
                        {info.icon} {info.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [menu, filteredItems.length, activeIndex]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#8A05BE" />
      </View>
    );
  }

  // No menu state
  if (noMenu) {
    return (
      <View style={styles.shell}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No menu available yet.</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation */}
      <SafeAreaView edges={['top']} style={styles.navSafeArea}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{placeName}</Text>
          <TouchableOpacity style={styles.navClassic} onPress={() => navigation.goBack()}>
            <Text style={styles.navClassicText}>Classic</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Filter Bar */}
      <View style={styles.filters}>
        {/* Meal period toggle */}
        {availablePeriods.length > 2 && (
          <View style={styles.periods}>
            {availablePeriods.map(period => (
              <TouchableOpacity
                key={period}
                style={[styles.periodBtn, activePeriod === period && styles.periodBtnActive]}
                onPress={() => setActivePeriod(period)}
              >
                <Text style={[styles.periodBtnText, activePeriod === period && styles.periodBtnTextActive]}>
                  {PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.catPillText, activeCategory === 'all' && styles.catPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories
            .filter(cat => {
              if (activePeriod === 'all') return true;
              return cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period;
            })
            .map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, activeCategory === cat.id && styles.catPillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.catPillText, activeCategory === cat.id && styles.catPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Gallery Cards - Horizontal FlatList */}
      {filteredItems.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredItems}
          renderItem={renderCard}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={styles.gallery}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
        />
      ) : (
        <View style={styles.emptyItems}>
          <Text style={styles.emptyItemsText}>No dishes in this category.</Text>
        </View>
      )}

      {/* Tavvy logo footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Image
          source={require('../assets/brand/tavvy-logo-white.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
      </SafeAreaView>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  goBackButton: {
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 14,
  },

  // Navigation
  navSafeArea: {
    backgroundColor: '#000',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBack: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 8,
  },
  navClassic: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 5, 190, 0.4)',
    borderRadius: 16,
  },
  navClassicText: {
    fontSize: 12,
    color: '#8A05BE',
    fontWeight: '500',
  },

  // Filters
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  periods: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  periodBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  periodBtnActive: {
    backgroundColor: '#8A05BE',
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    gap: 6,
    paddingBottom: 2,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
  },
  catPillActive: {
    backgroundColor: '#8A05BE',
    borderColor: '#8A05BE',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#aaa',
  },
  catPillTextActive: {
    color: '#fff',
  },

  // Gallery
  gallery: {
    flex: 1,
  },

  // Card
  card: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderText: {
    fontSize: 18,
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Top right group (price + share)
  topRightGroup: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  priceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  priceBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges top left
  badgesTopLeft: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  badgeFire: {
    backgroundColor: 'rgba(255, 80, 0, 0.7)',
  },
  badgeNew: {
    backgroundColor: 'rgba(138, 5, 190, 0.7)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Counter - bottom right corner
  counter: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Dish name - close to description
  dishName: {
    position: 'absolute',
    bottom: 52,
    left: 20,
    right: 70,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 29,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },

  // Info block at bottom
  infoBlock: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    gap: 8,
  },
  dishDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dietaryPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dietaryPillText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },

  // Empty items
  emptyItems: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItemsText: {
    color: '#555',
    fontSize: 15,
  },

  // Footer
  footer: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  footerLogo: {
    height: 18,
    width: 80,
    opacity: 0.5,
  },
});

export default withScreenErrorBoundary(MenuGalleryScreen, 'MenuGalleryScreen');
