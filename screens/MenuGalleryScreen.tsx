import { menuAppearance } from '../lib/menuAppearance';
/** Responsive photo-led menu gallery with full, scrollable dish details. */

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
import { useThemeContext } from '../contexts/ThemeContext';
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
  const imageHeight = Math.max(160, Math.min(height * 0.4, SCREEN_WIDTH * 0.75));
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
  const [viewMode,setViewMode]=useState<'list'|'photos'>('list');
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
      setViewMode(menuAppearance(menuData).galleryEnabled && route.params.view === 'photos' ? 'photos' : 'list');

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

  const renderCard = ({ item, index }: { item: MenuItem; index: number }) => {
    const priceStr = formatPrice(item.price, item.price_label);
    const imageUrl = item.image_url || menu?.cover_image_url || null;
    return <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} nestedScrollEnabled showsVerticalScrollIndicator>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', height: imageHeight }} resizeMode="cover" accessibilityLabel={item.name} /> : null}
      <View style={styles.details}>
        <Text style={styles.categoryName}>{item.category_name}</Text>
        <Text style={styles.dishName} accessibilityRole="header">{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{priceStr || 'Price not listed'}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareDish(item)} accessibilityRole="button" accessibilityLabel={`Share ${item.name}`}>
            <Ionicons name="share-outline" size={20} color={palette.link} /><Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
        {(item.is_popular || item.is_new) && <View style={styles.dietaryRow}>
          {item.is_popular && <Text style={styles.badge}>Popular</Text>}{item.is_new && <Text style={styles.badge}>New</Text>}
        </View>}
        {activeFilters.length>0&&dietaryMatch(item.dietary_tags,activeFilters)!=='match'&&<Text style={styles.counterText}>{dietaryMatch(item.dietary_tags,activeFilters)==='unknown'?'Dietary information not confirmed for these filters':'Other dish — does not match selected filters'}</Text>}
        {!!item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
        <View style={styles.dietaryRow}>{(item.dietary_tags || []).map(tag => {
          const info = DIETARY_LABELS[tag.toLowerCase()];
          return info ? <Text key={tag} style={styles.badge}>{info.icon} {info.label}</Text> : null;
        })}</View>
        <Text style={styles.counterText}>{index + 1} of {filteredItems.length} dishes{filteredItems.length > 1 ? ' · Swipe for more' : ''}</Text>
      </View>
    </ScrollView>;
  };

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

  return (
    <View style={styles.shell}>
      <StatusBar barStyle={isDark && !textMenu ? 'light-content' : 'dark-content'} />

      {/* Top Navigation */}
      <SafeAreaView edges={['top']} style={styles.navSafeArea}>
        <ScrollView style={{ maxHeight: height * 0.26, flexGrow: 0 }} contentContainerStyle={styles.nav}>
          <TouchableOpacity style={styles.navBack} onPress={() => navigation.navigate('PlaceDetails',{placeId})} accessibilityRole="button" accessibilityLabel="Back to restaurant">
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{placeName}</Text>{(['list','photos'] as const).filter(mode => mode === 'list' || appearance.galleryEnabled).map(mode=><TouchableOpacity key={mode} accessibilityRole="button" accessibilityState={{selected:viewMode===mode}} onPress={()=>setViewMode(mode)} style={{padding:10,minHeight:44}}><Text style={{color:palette.link,fontWeight:viewMode===mode?'800':'400'}}>{mode==='list'?'List':'Photos'}</Text></TouchableOpacity>)}
        </ScrollView>
      </SafeAreaView>

      {/* Scrollable filters remain reachable when text is enlarged. */}
      <ScrollView style={{ maxHeight: height * 0.32, flexGrow: 0 }} contentContainerStyle={styles.filters} nestedScrollEnabled>
        {/* Meal period toggle */}
        {availablePeriods.length > 1 && (
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:8}}>{DIETARY_FILTERS.map(filter=><TouchableOpacity key={filter.key} accessibilityRole="button" accessibilityState={{selected:activeFilters.includes(filter.key)}} style={[styles.catPill,activeFilters.includes(filter.key)&&styles.catPillActive]} onPress={()=>{setShowOtherDishes(false);setActiveFilters(old=>old.includes(filter.key)?old.filter(f=>f!==filter.key):[...old,filter.key])}}><Text style={[styles.catPillText,activeFilters.includes(filter.key)&&styles.catPillTextActive]}>{filter.label}</Text></TouchableOpacity>)}</ScrollView>
        {activeFilters.length>0&&<View><View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:14}}><Text style={{color:palette.text}}>{matchingCount} dishes match</Text><TouchableOpacity accessibilityRole="button" onPress={()=>{setActiveFilters([]);setShowOtherDishes(false)}} style={{paddingVertical:12}}><Text style={{color:palette.link}}>Clear</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={()=>setShowOtherDishes(!showOtherDishes)} style={{paddingVertical:12}}><Text style={{color:palette.link}}>{showOtherDishes?'Matches only':'Other dishes'}</Text></TouchableOpacity></View><Text style={{color:palette.textSecondary,fontSize:13}}>Missing tags mean unknown. Ask the restaurant about allergies.</Text></View>}
      </ScrollView>

      {/* Gallery Cards - Horizontal FlatList */}
      {viewMode==='list'?<FlatList ref={menuListRef} onContentSizeChange={() => { if (!pendingDishScroll.current || !route.params.dishId) return; const index = filteredItems.findIndex(item => item.id === route.params.dishId); if (index >= 0) { pendingDishScroll.current = false; menuListRef.current?.scrollToIndex({index,animated:false}); } }} onScrollToIndexFailed={info => { menuListRef.current?.scrollToOffset({offset:info.averageItemLength*info.index,animated:false}); }} data={filteredItems} keyExtractor={i=>i.id} ListHeaderComponent={<View style={{padding:24,paddingBottom:10}}><Text style={{color:palette.text,fontSize:32,fontFamily:menuFont}}>{menu?.name || 'Menu'}</Text></View>} ListEmptyComponent={<Text style={styles.emptyItemsText}>No matching dishes. Clear filters or show other dishes.</Text>} renderItem={({item,index})=><View style={{padding:20,borderBottomWidth:1,borderColor:palette.border}}>
        {(index === 0 || filteredItems[index-1]?.category_id !== item.category_id) && <Text style={{color:palette.text,fontSize:25,fontFamily:menuFont,marginVertical:12}}>{item.category_name}</Text>}
        <TouchableOpacity disabled={!appearance.galleryEnabled} accessibilityRole={appearance.galleryEnabled ? 'button' : undefined} accessibilityLabel={appearance.galleryEnabled ? `View ${item.name} photos` : undefined} onPress={()=>{setActiveIndex(index);setViewMode('photos')}} style={{flexDirection:'row',gap:14, borderLeftWidth: route.params.dishId === item.id ? 3 : 0, borderLeftColor: palette.link, paddingLeft: route.params.dishId === item.id ? 12 : 0}}>
          {appearance.inlinePhotos && item.image_url && <Image source={{uri:item.image_url}} style={{width:72,height:72,borderRadius:12}}/>}
          <View style={{flex:1}}><Text style={{color:palette.text,fontSize:21,fontWeight:appearance.serif?'400':'600',fontFamily:menuFont}}>{item.name}</Text>{item.description && <Text style={{color:palette.textSecondary,lineHeight:24,marginTop:6,fontFamily:menuFont,fontSize:16}}>{item.description}</Text>}<Text style={{color:palette.text,marginTop:8,fontFamily:menuFont,fontSize:16}}>{formatPrice(item.price,item.price_label)}</Text>{!!item.dietary_tags?.length && <Text style={{color:palette.textSecondary,marginTop:8,fontSize:13}}>{item.dietary_tags.map(tag=>DIETARY_LABELS[tag]?.label || tag.replace(/_/g,' ')).join(' · ')}</Text>}</View>
        </TouchableOpacity></View>}/>
:filteredItems.length > 0 ? (
        <FlatList
          key={SCREEN_WIDTH}
          ref={flatListRef}
          data={filteredItems}
          initialScrollIndex={Math.min(activeIndex,Math.max(0,filteredItems.length-1))}
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
          extraData={{ activeIndex, isDark, fontScale }}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
        />
      ) : (
        <View style={styles.emptyItems}>
          <Text style={styles.emptyItemsText}>No matching dishes. Clear filters or show other dishes.</Text>
        </View>
      )}

      {viewMode==='photos'&&<SafeAreaView edges={['bottom']} style={[styles.footer,{flexDirection:'row',justifyContent:'space-around'}]}><TouchableOpacity accessibilityRole="button" disabled={activeIndex===0} onPress={()=>{const next=activeIndex-1;flatListRef.current?.scrollToIndex({index:next});setActiveIndex(next)}} style={{padding:14,opacity:activeIndex===0?.5:1}}><Text style={{color:palette.link}}>Previous</Text></TouchableOpacity><Text accessibilityLiveRegion="polite" style={{color:palette.text}}>{filteredItems.length?`${activeIndex+1} / ${filteredItems.length}`:'0 dishes'}</Text><TouchableOpacity accessibilityRole="button" disabled={activeIndex>=filteredItems.length-1} onPress={()=>{const next=activeIndex+1;flatListRef.current?.scrollToIndex({index:next});setActiveIndex(next)}} style={{padding:14,opacity:activeIndex>=filteredItems.length-1?.5:1}}><Text style={{color:palette.link}}>Next</Text></TouchableOpacity></SafeAreaView>}
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
  categoryName: { color: palette.textSecondary, fontSize: 14, flexShrink: 1 },
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
  footer: { backgroundColor: palette.background, alignItems: 'center', paddingVertical: 8 },
  footerLogo: { height: 22, width: 94 },
});

export default withScreenErrorBoundary(MenuGalleryScreen, 'MenuGalleryScreen');
