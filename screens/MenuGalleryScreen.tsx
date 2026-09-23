import { menuAppearance } from '../lib/menuAppearance';
/**
 * Restaurant menu: a text list (the owner's Elegant Ivory / Clean White designs) or the full-screen
 * photo menu (Visual, the default), mirroring tavvy-web /place/[id]/menu and /menu-gallery.
 * In photo mode the whole screen is the menu: one full-bleed photo page per dish with the details
 * over its lower part, a floating bar (back, position, switch to text) and floating filters; no
 * place details on top and no arrows underneath. One small icon switches between the two views.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  useWindowDimensions,
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
import { useThemeContext } from '../contexts/ThemeContext';
import { tabBarStyle } from '../lib/tabBarStyle';
import {dietaryMatch,DIETARY_FILTERS,DietaryFilter} from '../lib/placePresentation';
import design from '../config/design.json';
import { supabase } from '../lib/supabaseClient';
import { withScreenErrorBoundary } from '../components/ScreenErrorBoundary';



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
  photo_gallery_enabled?: boolean;
  cover_image_url: string | null;
  show_cover?: boolean | null;
  tagline?: string | null;
  welcome_message?: string | null;
  happy_hour_enabled?: boolean | null;
  happy_hour_text?: string | null;
  happy_hour_times?: string | null;
  chef_recommendation_id?: string | null;
  dish_of_day_id?: string | null;
  promo_banner_enabled?: boolean | null;
  promo_banner_text?: string | null;
  seasonal_special_enabled?: boolean | null;
  seasonal_special_text?: string | null;
}

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

type RouteParams = {
  MenuGallery: {
    placeId: string;
    placeName?: string;
    dishId?: string;
    view?: 'list' | 'photos';
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
  spicy: { icon: '🌶️', label: 'Spicy' },
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

function MenuGalleryScreen() {
  const navigation = useNavigation<any>();
  const { width: SCREEN_WIDTH, height, fontScale } = useWindowDimensions();
  const { isDark } = useThemeContext();
  const [stageHeight, setStageHeight] = useState(height);
  const route = useRoute<RouteProp<RouteParams, 'MenuGallery'>>();
  const { placeId, placeName: initialPlaceName } = route.params;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [placeName, setPlaceName] = useState<string>(initialPlaceName || '');
  const [placeSlug, setPlaceSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [noMenu, setNoMenu] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');
  const [activeFilters,setActiveFilters]=useState<DietaryFilter[]>([]);
  const [showOtherDishes,setShowOtherDishes]=useState(false);
  const [showDietary, setShowDietary] = useState(false);
  const [viewMode,setViewMode]=useState<'list'|'photos'>('list');
  // Visual menus open on the cover page (hero + specials) like tavvy.com; "See Full Menu" reveals the categories.
  const [showFullMenu, setShowFullMenu] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  // The photo menu is full-bleed: the tab bar would cover the price row, so hide it while in photo mode.
  useEffect(() => {
    const tabs = navigation.getParent?.();
    if (!tabs) return;
    tabs.setOptions({ tabBarStyle: viewMode === 'photos' ? { display: 'none' } : tabBarStyle(isDark) });
    return () => tabs.setOptions({ tabBarStyle: tabBarStyle(isDark) });
  }, [viewMode, isDark, navigation]);
  const appearance = menuAppearance(menu);
  const textMenu = viewMode === 'list' && !appearance.inlinePhotos;
  const palette = textMenu ? { ...design.light, background: appearance.background, surface: appearance.background, text: appearance.text, textSecondary: appearance.secondary, border: appearance.border } : isDark ? design.dark : design.light;
  const menuFont = appearance.serif ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined;
  const styles = makeStyles(palette, SCREEN_WIDTH);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Scroll position
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<MenuItem>>(null);
  const menuListRef = useRef<FlatList<MenuItem>>(null);
  const pendingDishScroll = useRef(true);

  useEffect(() => {
    if (placeId) {
      loadMenu(placeId);
    }
  }, [placeId]);

  const loadMenu = async (pid: string) => {
    setLoading(true); setLoadError(''); setNoMenu(false); setCategories([]); setAllItems([]); pendingDishScroll.current = true;
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

      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('place_id', pid)
        .eq('is_active', true)
        .maybeSingle();

      if (menuError) throw menuError;
      if (!menuData) {
        setNoMenu(true);
        setLoading(false);
        return;
      }

      setMenu(menuData);
      // The owner's Menu design decides what opens first (photo menu by default); an explicit view param wins.
      const loaded = menuAppearance(menuData);
      setViewMode(route.params.view === 'list' ? 'list' : route.params.view === 'photos' && loaded.galleryEnabled ? 'photos' : loaded.entryView);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);

        const categoryIds = categoriesData.map((c: MenuCategory) => c.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoryIds)
          .eq('is_available', true)
          .order('sort_order', { ascending: true });

        if (itemsError) throw itemsError;
        if (itemsData) {
          const catMap: Record<string, MenuCategory> = {};
          categoriesData.forEach((c: MenuCategory) => { catMap[c.id] = c; });

          const enrichedItems: MenuItem[] = itemsData.map((item: any) => ({
            ...item,
            category_name: catMap[item.category_id]?.name || '',
            meal_period: catMap[item.category_id]?.meal_period || null,
          }));

          enrichedItems.sort((a, b) => (catMap[a.category_id]?.sort_order ?? 0) - (catMap[b.category_id]?.sort_order ?? 0) || a.category_id.localeCompare(b.category_id) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setAllItems(enrichedItems);
        }
      }
    } catch (error) {
      setLoadError('This menu could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered items
  const periodItems = allItems.filter(item => {
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

  const matchingCount=periodItems.filter(i=>dietaryMatch(i.dietary_tags,activeFilters)==='match').length;
  const filteredItems=periodItems.filter(i=>showOtherDishes||dietaryMatch(i.dietary_tags,activeFilters)==='match');
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
  }, [activePeriod, activeCategory,activeFilters,showOtherDishes]);

  useEffect(() => { if (route.params.dishId) setShowFullMenu(true); }, [route.params.dishId]);
  useEffect(()=>{if(loading||!route.params.dishId)return;const index=filteredItems.findIndex(item=>item.id===route.params.dishId);if(index>=0){setActiveIndex(index);requestAnimationFrame(()=>flatListRef.current?.scrollToIndex({index,animated:false}));}},[loading,route.params.dishId]);
  const formatPrice = (price: number | null, priceLabel: string | null): string => {
    if (priceLabel) return priceLabel;
    if (price === null || price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, [SCREEN_WIDTH]);

  const handleShareDish = async (item: MenuItem) => {
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

  const renderPhotoCard = ({ item }: { item: MenuItem }) => {
    const priceStr = formatPrice(item.price, item.price_label);
    const imageUrl = item.image_url || menu?.cover_image_url || null;
    const match = dietaryMatch(item.dietary_tags, activeFilters);
    const dimmed = activeFilters.length > 0 && match !== 'match';
    return <View style={{ width: SCREEN_WIDTH, height: stageHeight, backgroundColor: '#0b0b0e' }} accessibilityLabel={item.name}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={[StyleSheet.absoluteFill, dimmed && { opacity: 0.45 }]} resizeMode="cover" accessibilityIgnoresInvertColors />
        : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}><Text style={styles.photoCategory}>{item.category_name}</Text></View>}
      <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']} locations={[0, 0.24, 0.42, 0.66, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {/* Details over the lower part of the photo; long text scrolls over the still image. */}
      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={{ height: Math.min(stageHeight * 0.44, 420) }} />
        <View style={styles.photoText}>
          {dimmed && <Text style={styles.photoNote}>{match === 'unknown' ? 'Dietary information not confirmed for these filters' : 'Other dish — does not match selected filters'}</Text>}
          {(item.is_popular || item.is_new) && <View style={styles.dietaryRow}>{item.is_popular && <Text style={[styles.photoBadge, styles.photoBadgeFire]}>🔥 Popular</Text>}{item.is_new && <Text style={[styles.photoBadge, styles.photoBadgeNew]}>✨ New</Text>}</View>}
          {!!item.category_name && <Text style={styles.photoCategory}>{item.category_name}</Text>}
          <Text style={styles.photoName} accessibilityRole="header">{item.name}</Text>
          {!!item.description && <Text style={styles.photoDesc}>{item.description}</Text>}
          {!!item.dietary_tags?.length && <View style={styles.dietaryRow}>{item.dietary_tags.map(tag => { const info = DIETARY_LABELS[tag.toLowerCase()]; return <Text key={tag} style={styles.photoDietPill}>{info ? `${info.icon} ${info.label}` : tag.replace(/[_-]/g, ' ')}</Text>; })}</View>}
          <View style={styles.photoActions}>
            <Text style={styles.photoPrice}>{priceStr || 'Price not listed'}</Text>
            <TouchableOpacity style={styles.glassBtnLg} onPress={() => handleShareDish(item)} accessibilityRole="button" accessibilityLabel={`Share ${item.name}`}><Ionicons name="share-outline" size={20} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>;
  };

  // Back returns to wherever the menu was opened from (Food Menu tool, place page, search); the place page is only the fallback.
  const goBack = () => { if (navigation.canGoBack?.()) navigation.goBack(); else navigation.navigate('PlaceDetails', { placeId }); };

  const menuDestinations=<TouchableOpacity style={styles.destinationButton} accessibilityRole="button" onPress={()=>navigation.navigate('PlaceDetails',{placeId})}><Text style={styles.destinationText}>← Back to restaurant</Text></TouchableOpacity>;

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDark && !textMenu ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#8A05BE" />
      </View>
    );
  }

  // No menu state
  if (noMenu || loadError) {
    return (
      <View style={styles.shell}>
        <StatusBar barStyle={isDark && !textMenu ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.emptyContainer}>
          <Text style={styles.emptyText} accessibilityRole={loadError ? 'alert' : undefined}>{loadError || 'No menu available yet.'}</Text>
          {!!loadError && <TouchableOpacity style={styles.goBackButton} onPress={() => loadMenu(placeId)} accessibilityRole="button"><Text style={styles.goBackButtonText}>Try again</Text></TouchableOpacity>}

          {menuDestinations}
        </SafeAreaView>
      </View>
    );
  }

  const total = filteredItems.length;
  const categoryPills = categories.filter(cat => activePeriod === 'all' || cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period);
  const photoMode = viewMode === 'photos';
  const pill = (key: string, label: string, active: boolean, onPress: () => void, diet = false) => (
    <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}
      style={[photoMode ? styles.glassPill : styles.catPill, active && (diet ? styles.dietPillActive : photoMode ? styles.glassPillActive : styles.catPillActive)]}>
      <Text style={[photoMode ? styles.glassPillText : styles.catPillText, active && (diet ? styles.dietPillTextActive : photoMode ? styles.glassPillTextActive : styles.catPillTextActive)]}>{label}</Text>
    </TouchableOpacity>
  );
  const menuPills = <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 8 }} accessibilityLabel="Menu filters">
    {pill('all', 'All', activePeriod === 'all' && activeCategory === 'all', () => { setActivePeriod('all'); setActiveCategory('all'); })}
    {availablePeriods.filter(period => period !== 'all').map(period => pill(`period-${period}`, PERIOD_LABELS[period], activePeriod === period, () => setActivePeriod(activePeriod === period ? 'all' : period)))}
    {categoryPills.map(cat => pill(`cat-${cat.id}`, cat.name, activeCategory === cat.id, () => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)))}
  </ScrollView>;
  const dietaryPills = <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{DIETARY_FILTERS.map(filter => pill(`diet-${filter.key}`, filter.label, activeFilters.includes(filter.key), () => { setShowOtherDishes(false); setActiveFilters(old => old.includes(filter.key) ? old.filter(f => f !== filter.key) : [...old, filter.key]); }, true))}</View>;
  const dietaryResult = activeFilters.length > 0 && <View style={photoMode ? styles.photoPanel : { marginTop: 8 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
      <Text style={{ color: photoMode ? '#fff' : palette.text, fontWeight: '700' }}>{matchingCount} dishes match</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => { setActiveFilters([]); setShowOtherDishes(false); }} style={{ paddingVertical: 8 }}><Text style={{ color: photoMode ? '#fff' : palette.link, textDecorationLine: 'underline' }}>Clear</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setShowOtherDishes(!showOtherDishes)} style={{ paddingVertical: 8 }}><Text style={{ color: photoMode ? '#fff' : palette.link, textDecorationLine: 'underline' }}>{showOtherDishes ? 'Matches only' : 'Other dishes'}</Text></TouchableOpacity>
    </View>
    <Text style={{ color: photoMode ? 'rgba(255,255,255,0.7)' : palette.textSecondary, fontSize: 13 }}>Missing tags mean unknown. Ask the restaurant about allergies.</Text>
  </View>;

  if (photoMode) {
    return (
      <View style={styles.photoShell} onLayout={e => setStageHeight(e.nativeEvent.layout.height)}>
        <StatusBar barStyle="light-content" />
        {filteredItems.length > 0 ? (
          <FlatList
            key={`${SCREEN_WIDTH}x${stageHeight}`}
            ref={flatListRef}
            data={filteredItems}
            initialScrollIndex={Math.min(activeIndex, Math.max(0, filteredItems.length - 1))}
            renderItem={renderPhotoCard}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            style={StyleSheet.absoluteFill}
            extraData={{ activeIndex, stageHeight, fontScale, activeFilters }}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
          />
        ) : (
          <View style={styles.emptyItems}><Text style={styles.emptyItemsTextDark}>No matching dishes. Clear filters or show other dishes.</Text></View>
        )}

        {/* Floating bar and filters over the photo */}
        <SafeAreaView edges={['top']} style={styles.photoTop} pointerEvents="box-none">
          <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.photoTopRow}>
            <TouchableOpacity style={styles.glassBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back"><Ionicons name="chevron-back" size={22} color="#fff" /></TouchableOpacity>
            <Text style={styles.photoPosition} accessibilityLiveRegion="polite">{filteredItems.length ? `${activeIndex + 1} / ${total}` : '0 dishes'}</Text>
            <TouchableOpacity style={styles.glassBtn} onPress={() => setViewMode('list')} accessibilityRole="button" accessibilityLabel="Text menu"><Ionicons name="list-outline" size={22} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.photoFilterRow}>
            {menuPills}
            <TouchableOpacity style={[styles.glassBtn, activeFilters.length > 0 && styles.glassBtnOn]} onPress={() => setShowDietary(open => !open)} accessibilityRole="button" accessibilityLabel="Dietary filters" accessibilityState={{ expanded: showDietary }}><Ionicons name="funnel-outline" size={18} color={activeFilters.length ? '#111' : '#fff'} /></TouchableOpacity>
          </View>
          {showDietary && <View style={styles.photoPanel}>{dietaryPills}</View>}
          {dietaryResult}
        </SafeAreaView>
      </View>
    );
  }

  const chefDish = menu?.chef_recommendation_id ? allItems.find(item => item.id === menu.chef_recommendation_id) : undefined;
  const dayDish = menu?.dish_of_day_id ? allItems.find(item => item.id === menu.dish_of_day_id) : undefined;
  const hasPromos = !!(menu && ((menu.happy_hour_enabled && menu.happy_hour_text) || chefDish || dayDish || (menu.promo_banner_enabled && menu.promo_banner_text) || (menu.seasonal_special_enabled && menu.seasonal_special_text)));
  const openDish = (item: MenuItem) => {
    setShowFullMenu(true);
    const index = filteredItems.findIndex(i => i.id === item.id);
    if (index >= 0) setTimeout(() => menuListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 }), 250);
  };
  const dietaryIcons = (tags: string[] | null | undefined) => (tags || []).map(tag => DIETARY_LABELS[tag.toLowerCase()]?.icon).filter(Boolean).join(' ');
  const tileWidth = (SCREEN_WIDTH - 48 - 12) / 2;

  // ===== Cover page (visual style, like tavvy.com's menu landing) =====
  if (appearance.inlinePhotos && menu?.show_cover !== false && !showFullMenu) {
    return (
      <View style={styles.coverShell}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ height: Math.max(320, Math.min(height * 0.56, 480)) }}>
            <Image source={{ uri: menu?.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop' }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <SafeAreaView edges={['top']} style={styles.coverTop} pointerEvents="box-none">
              <View style={styles.photoTopRow}>
                <TouchableOpacity style={styles.glassBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back"><Ionicons name="chevron-back" size={22} color="#fff" /></TouchableOpacity>
                {appearance.galleryEnabled ? <TouchableOpacity style={styles.glassBtn} onPress={() => setViewMode('photos')} accessibilityRole="button" accessibilityLabel="Photo menu"><Ionicons name="images-outline" size={20} color="#fff" /></TouchableOpacity> : <View style={styles.glassBtn} />}
              </View>
            </SafeAreaView>
            <View style={styles.coverText}>
              <Text style={styles.coverName} accessibilityRole="header">{placeName}</Text>
              {!!menu?.tagline && <Text style={styles.coverTagline}>{menu.tagline}</Text>}
              {!!menu?.welcome_message && <Text style={styles.coverWelcome}>{menu.welcome_message}</Text>}
            </View>
          </View>
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setShowFullMenu(true)} activeOpacity={0.9} style={styles.coverCtaShadow}>
              <LinearGradient colors={['#8A05BE', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverCta}><Text style={styles.coverCtaText}>See Full Menu</Text></LinearGradient>
            </TouchableOpacity>
          </View>
          {hasPromos && <View style={styles.promoGrid}>
            {!!(menu?.happy_hour_enabled && menu.happy_hour_text) && <LinearGradient colors={['#92400e', '#78350f']} style={[styles.tile, { width: tileWidth, height: tileWidth }]}>
              <Text style={styles.tileIcon}>🍸</Text>
              <View style={styles.tileContent}><Text style={[styles.tileLabel, { color: '#fbbf24' }]}>Happy Hour</Text><Text style={styles.tileHeadline}>{menu.happy_hour_text}</Text>{!!menu.happy_hour_times && <Text style={styles.tileSub}>{menu.happy_hour_times}</Text>}</View>
            </LinearGradient>}
            {[{ dish: chefDish, label: "Chef's Pick" }, { dish: dayDish, label: 'Dish of the Day' }].map(({ dish, label }) => dish && <TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${dish.name}`} onPress={() => openDish(dish)} style={[styles.tile, { width: tileWidth, height: tileWidth }]}>
              {dish.image_url ? <Image source={{ uri: dish.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <LinearGradient colors={['#1a1a2e', '#16213e']} style={StyleSheet.absoluteFill} />}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <View style={styles.tileContent}><Text style={styles.tileLabel}>{label}</Text><Text style={styles.tileHeadline} numberOfLines={2}>{dish.name}</Text>{!!formatPrice(dish.price, dish.price_label) && <Text style={styles.tilePrice}>{formatPrice(dish.price, dish.price_label)}</Text>}</View>
            </TouchableOpacity>)}
            {!!(menu?.promo_banner_enabled && menu.promo_banner_text) && <LinearGradient colors={['#9d174d', '#be185d', '#ec4899']} style={[styles.tile, { width: tileWidth, height: tileWidth }]}>
              <Text style={styles.tileIcon}>🎉</Text>
              <View style={styles.tileContent}><Text style={[styles.tileLabel, { color: '#fce7f3' }]}>Special Offer</Text><Text style={styles.tileHeadline} numberOfLines={4}>{menu.promo_banner_text}</Text></View>
            </LinearGradient>}
            {!!(menu?.seasonal_special_enabled && menu.seasonal_special_text) && <LinearGradient colors={['#064e3b', '#065f46', '#059669']} style={[styles.tile, { width: tileWidth, height: tileWidth }]}>
              <Text style={styles.tileIcon}>🌿</Text>
              <View style={styles.tileContent}><Text style={[styles.tileLabel, { color: '#a7f3d0' }]}>Seasonal</Text><Text style={styles.tileHeadline} numberOfLines={4}>{menu.seasonal_special_text}</Text></View>
            </LinearGradient>}
          </View>}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}><Image source={require('../assets/brand/tavvy-logo-horizontal-white.png')} style={{ height: 18, width: 62, opacity: 0.5 }} resizeMode="contain" /></View>
        </ScrollView>
      </View>
    );
  }

  // ===== Text menu (categories + items, same layout as tavvy.com) =====
  const visual = appearance.inlinePhotos;
  return (
    <View style={styles.shell}>
      <StatusBar barStyle={isDark && !textMenu ? 'light-content' : 'dark-content'} />

      {/* Top Navigation */}
      <SafeAreaView edges={['top']} style={styles.navSafeArea}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBack} onPress={() => (visual && menu?.show_cover !== false ? setShowFullMenu(false) : goBack())} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.navTitle} numberOfLines={1}>{menu?.name || `${placeName} Menu`}</Text>
            {!!placeName && <Text style={styles.navSubtitle} numberOfLines={1}>{placeName}</Text>}
          </View>
          {appearance.galleryEnabled ? <TouchableOpacity style={styles.navBack} accessibilityRole="button" accessibilityLabel="Photo menu" onPress={() => setViewMode('photos')}><Ionicons name="images-outline" size={22} color={palette.link} /></TouchableOpacity> : <View style={styles.navBack} />}
        </View>
      </SafeAreaView>

      {/* Meal periods / categories + dietary filter icon (panel opens on demand, like the web) */}
      <View style={styles.filterBar}>
        <View style={{ flex: 1, minWidth: 0 }}>{menuPills}</View>
        <TouchableOpacity style={[styles.filterBtn, activeFilters.length > 0 && styles.filterBtnOn]} onPress={() => setShowDietary(open => !open)} accessibilityRole="button" accessibilityLabel="Dietary filters" accessibilityState={{ expanded: showDietary }}>
          <Ionicons name="funnel-outline" size={18} color={activeFilters.length ? design.primary : palette.textSecondary} />
          {activeFilters.length > 0 && <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilters.length}</Text></View>}
        </TouchableOpacity>
      </View>
      {showDietary && <View style={styles.filters}>{dietaryPills}</View>}
      {!!dietaryResult && <View style={styles.filters}>{dietaryResult}</View>}

      <FlatList ref={menuListRef} onContentSizeChange={() => { if (!pendingDishScroll.current || !route.params.dishId) return; const index = filteredItems.findIndex(item => item.id === route.params.dishId); if (index >= 0) { pendingDishScroll.current = false; menuListRef.current?.scrollToIndex({index,animated:false}); } }} onScrollToIndexFailed={info => { menuListRef.current?.scrollToOffset({offset:info.averageItemLength*info.index,animated:false}); }} data={filteredItems} keyExtractor={i=>i.id} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={visual && menu?.cover_image_url ? <View style={styles.listCover}><Image source={{ uri: menu.cover_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} /></View> : !visual ? <View style={{ paddingVertical: 16 }}>{!!menu?.welcome_message && <Text style={{ color: palette.textSecondary, fontFamily: menuFont, fontSize: 15, lineHeight: 23 }}>{menu.welcome_message}</Text>}</View> : null}
        ListEmptyComponent={<Text style={styles.emptyItemsText}>No matching dishes. Clear filters or show other dishes.</Text>}
        renderItem={({item,index})=>{
          const first = index === 0 || filteredItems[index-1]?.category_id !== item.category_id;
          const category = first ? categories.find(c => c.id === item.category_id) : undefined;
          const price = formatPrice(item.price, item.price_label);
          const icons = visual ? dietaryIcons(item.dietary_tags) : (item.dietary_tags || []).map(tag => DIETARY_LABELS[tag.toLowerCase()]?.label || tag.replace(/[_-]/g, ' ')).join(' · ');
          const highlighted = route.params.dishId === item.id;
          return <View>
            {first && <View style={[styles.categoryHeader, !visual && { borderBottomWidth: 0, marginTop: 24 }]}>
              {visual && category?.image_url && <Image source={{ uri: category.image_url }} style={styles.categoryImg} />}
              <View style={{ flex: 1 }}>
                <Text style={visual ? styles.categoryName : styles.categoryNameText}>{item.category_name}</Text>
                {!!category?.description && <Text style={styles.categoryDesc}>{category.description}</Text>}
              </View>
            </View>}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.name} onPress={() => (appearance.galleryEnabled && visual ? (setActiveIndex(index), setViewMode('photos')) : setExpandedItem(expandedItem === item.id ? null : item.id))} style={[styles.itemRow, highlighted && styles.itemRowHighlighted, index + 1 < filteredItems.length && filteredItems[index+1]?.category_id !== item.category_id && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.itemNameRow}>
                  <Text style={visual ? styles.itemName : styles.itemNameText}>{item.name}</Text>
                  {item.is_popular && <Text style={styles.badgePopular}>{visual ? '🔥 Popular' : 'Popular'}</Text>}
                  {item.is_new && <Text style={styles.badgeNew}>{visual ? '✨' : 'New'}</Text>}
                  <TouchableOpacity style={styles.itemShare} onPress={() => handleShareDish(item)} accessibilityRole="button" accessibilityLabel={`Share ${item.name}`} hitSlop={8}><Ionicons name="share-outline" size={16} color={palette.textSecondary} /></TouchableOpacity>
                </View>
                {!!item.description && <Text style={visual ? styles.itemDesc : styles.itemDescText} numberOfLines={expandedItem === item.id ? undefined : 2}>{item.description}</Text>}
                {(!!price || !!icons) && <View style={styles.itemMeta}>{!!price && <Text style={visual ? styles.itemPrice : styles.itemPriceText}>{price}</Text>}{!!icons && <Text style={[styles.itemDietary, !visual && { letterSpacing: 0, color: palette.textSecondary, fontSize: 13 }]}>{icons}</Text>}</View>}
              </View>
              {visual && !!item.image_url && <Image source={{ uri: item.image_url }} style={styles.itemImg} />}
            </TouchableOpacity>
          </View>;
        }}
        ListFooterComponent={<View style={{ alignItems: 'center', paddingVertical: 28 }}><Image source={isDark || textMenu === false ? require('../assets/brand/tavvy-logo-horizontal-white.png') : require('../assets/brand/tavvy-logo-horizontal-dark.png')} style={{ height: 18, width: 62, opacity: 0.5 }} resizeMode="contain" /></View>}
      />
    </View>
  );
}

// ===== STYLES =====
const makeStyles = (palette: typeof design.light, width: number) => StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background },
  loadingContainer: { flex: 1, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: palette.textSecondary, fontSize: 16, textAlign: 'center' },
  goBackButton: { minHeight: 44, padding: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  goBackButtonText: { color: palette.link, fontSize: 16 },
  navSafeArea: { backgroundColor: palette.background },
  nav: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  navBack: { width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 17, fontWeight: '600', color: palette.text, textAlign: 'center' },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, maxWidth: '100%' },
  destinationButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, maxWidth: '100%', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  destinationText: { color: palette.link, fontSize: 14, flexShrink: 1 },
  filters: { paddingHorizontal: 16, paddingBottom: 12 },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  periodBtn: { minHeight: 44, maxWidth: width - 32, justifyContent: 'center', padding: 12, borderRadius: 20, backgroundColor: palette.surfaceElevated },
  periodBtnActive: { backgroundColor: design.primary },
  periodBtnText: { fontSize: 14, color: palette.textSecondary, flexShrink: 1 },
  periodBtnTextActive: { color: '#fff' },
  categoriesScroll: { flexGrow: 0 }, categoriesContent: { gap: 8, paddingBottom: 2, alignItems: 'flex-start' },
  catPill: { maxWidth: width - 48, minHeight: 44, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 20 },
  catPillActive: { backgroundColor: design.primary, borderColor: design.primary },
  catPillText: { fontSize: 14, color: palette.textSecondary, flexShrink: 1 }, catPillTextActive: { color: '#fff' },
  gallery: { flex: 1, minHeight: 0 }, card: { width, flex: 1 }, cardContent: { flexGrow: 1, paddingBottom: 24 },
  details: { padding: 20, gap: 12, backgroundColor: palette.surface, minWidth: 0 },
  dishName: { fontSize: 26, fontWeight: '800', color: palette.text, flexShrink: 1 },
  dishDescription: { fontSize: 16, color: palette.textSecondary, flexShrink: 1 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  priceText: { color: palette.text, fontSize: 18, fontWeight: '700', flexGrow: 1, flexShrink: 1, flexBasis: 160 },
  shareBtn: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8, alignItems: 'center', maxWidth: '100%' },
  shareText: { color: palette.link, fontSize: 16, flexShrink: 1 },
  dietaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { maxWidth: '100%', flexShrink: 1, color: palette.textSecondary, backgroundColor: palette.surfaceElevated, padding: 8, borderRadius: 12, fontSize: 13 },
  counterText: { color: palette.textSecondary, fontSize: 13, marginTop: 8 },
  emptyItems: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  emptyItemsText: { color: palette.textSecondary, fontSize: 16, textAlign: 'center' },
  // Text menu chrome (matches tavvy.com /place/:id/menu)
  navSubtitle: { fontSize: 12, color: palette.textSecondary, textAlign: 'center', marginTop: 1 },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border },
  filterBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  filterBtnOn: { borderWidth: 2, borderColor: design.primary, backgroundColor: 'rgba(138,5,190,0.08)' },
  filterCount: { position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: design.primary, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  listCover: { height: 160, borderRadius: 14, overflow: 'hidden', marginTop: 14, marginBottom: 4 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: palette.border },
  categoryImg: { width: 56, height: 56, borderRadius: 12 },
  categoryName: { color: palette.text, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  categoryNameText: { color: palette.text, fontSize: 26, fontWeight: '500', lineHeight: 32 },
  categoryDesc: { color: palette.textSecondary, fontSize: 14, fontStyle: 'italic', marginTop: 3 },
  itemRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  itemRowHighlighted: { backgroundColor: 'rgba(138,5,190,0.08)', borderRadius: 8, paddingHorizontal: 8 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  itemName: { color: palette.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  itemNameText: { color: palette.text, fontSize: 21, fontWeight: '500', lineHeight: 27, flexShrink: 1 },
  badgePopular: { fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: '#f97316', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  badgeNew: { fontSize: 12, fontWeight: '700', color: design.primary },
  itemShare: { marginLeft: 'auto', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  itemDesc: { color: palette.textSecondary, fontSize: 14, lineHeight: 21, fontStyle: 'italic', marginTop: 4 },
  itemDescText: { color: palette.textSecondary, fontSize: 15, lineHeight: 25, marginTop: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  itemPrice: { color: palette.text, fontSize: 15, fontWeight: '700' },
  itemPriceText: { color: palette.text, fontSize: 16, fontWeight: '500' },
  itemDietary: { fontSize: 14, letterSpacing: 2 },
  itemImg: { width: 80, height: 80, borderRadius: 12 },
  // Cover page (visual style)
  coverShell: { flex: 1, backgroundColor: '#000' },
  coverTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12 },
  coverText: { position: 'absolute', left: 24, right: 24, bottom: 28 },
  coverName: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40, letterSpacing: -1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 20, textShadowOffset: { width: 0, height: 4 } },
  coverTagline: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  coverWelcome: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontStyle: 'italic', marginTop: 8, maxWidth: 360, lineHeight: 20 },
  coverCtaShadow: { borderRadius: 14, backgroundColor: '#8A05BE', shadowColor: '#8A05BE', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  coverCta: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center' },
  coverCtaText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  promoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24, paddingBottom: 8 },
  tile: { borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  tileIcon: { position: 'absolute', top: '32%', alignSelf: 'center', fontSize: 48 },
  tileContent: { padding: 16, gap: 4 },
  tileLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)' },
  tileHeadline: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 18 },
  tileSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  tilePrice: { fontSize: 16, fontWeight: '800', color: '#fff' },
  // Full-screen photo menu (always dark, over the photo)
  photoShell: { flex: 1, backgroundColor: '#000' },
  photoTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 16 },
  photoTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 10 },
  photoFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  glassBtnOn: { backgroundColor: '#fff', borderColor: '#fff' },
  glassBtnLg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  photoPosition: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  glassPill: { minHeight: 34, justifyContent: 'center', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', maxWidth: width - 80 },
  glassPillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  glassPillText: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  glassPillTextActive: { color: '#111' },
  dietPillActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  dietPillTextActive: { color: '#062b1f' },
  photoPanel: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 6 },
  photoText: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34, gap: 10 },
  photoNote: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  photoBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16, fontSize: 12, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  photoBadgeFire: { backgroundColor: 'rgba(255,80,0,0.75)' },
  photoBadgeNew: { backgroundColor: 'rgba(138,5,190,0.75)' },
  photoCategory: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  photoName: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 35, letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } },
  photoDesc: { color: 'rgba(255,255,255,0.88)', fontSize: 15.5, lineHeight: 24, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  photoDietPill: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 10, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  photoPrice: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } },
  emptyItemsTextDark: { color: '#aaa', fontSize: 16, textAlign: 'center' },
  footer: { backgroundColor: palette.background, alignItems: 'center', paddingVertical: 8 },
  footerLogo: { height: 22, width: 94 },
});

export default withScreenErrorBoundary(MenuGalleryScreen, 'MenuGalleryScreen');
