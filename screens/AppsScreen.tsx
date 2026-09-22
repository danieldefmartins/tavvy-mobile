import { useReleaseCopy } from '../hooks/useReleaseCopy';
/** A shared, descriptive directory of Tavvy tools. */
import React, { useState } from 'react';
import design from '../config/design.json';
import { TOOL_DETAILS, TOOL_GROUPS, toolKey, toolMatches } from '../lib/toolDirectory';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useUnreadMessagesContext } from '../contexts/UnreadMessagesContext';

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  gradientColors: [string, string, ...string[]];
  route?: string;
  params?: object;
  showBadge?: boolean;
  isFeatured?: boolean;
}

// Featured Apps (shown in large horizontal cards)
const FEATURED_APPS: AppTile[] = [
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    gradientColors: ['#8A05BE', '#1D4ED8'],
    route: 'Pros',
    isFeatured: true,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'book',
    iconType: 'ionicons',
    gradientColors: ['#818CF8', '#6366F1'],
    route: 'Atlas',
    isFeatured: true,
  },
  {
    id: 'digital-card',
    name: 'eCard',
    icon: 'id-card',
    iconType: 'ionicons',
    gradientColors: ['#EC4899', '#BE185D'],
    route: 'ECardHub',
    isFeatured: true,
  },
];

// All Apps Grid
const APP_TILES: AppTile[] = [
  { id: 'cruises', name: 'Cruises', icon: 'boat', iconType: 'ionicons', gradientColors: ['#167C9C', '#115E78'], route: 'Cruises' },
  { id: 'experiences', name: 'Experiences', icon: 'compass', iconType: 'ionicons', gradientColors: ['#007F86', '#007F86'], route: 'ExperiencePaths' },
  {
    id: 'food-menu',
    name: 'Food Menu',
    icon: 'restaurant',
    iconType: 'ionicons',
    gradientColors: ['#F97316', '#E65B38'],
    route: 'FoodMenu',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: 'planet',
    iconType: 'ionicons',
    gradientColors: ['#2DD4BF', '#14B8A6'],
    route: 'UniverseDiscovery',
  },
  {
    id: 'on-the-go',
    name: 'On The Go',
    icon: 'car-sport', // Changed to better represent mobile businesses
    iconType: 'ionicons',
    gradientColors: ['#00C2CB', '#059669'],
    route: 'OnTheGo',
  },
  {
    id: 'rides',
    name: 'Rides',
    icon: 'train',
    iconType: 'ionicons',
    gradientColors: ['#F87171', '#EF4444'],
    route: 'RidesBrowse',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: 'bonfire',
    iconType: 'ionicons',
    gradientColors: ['#FB923C', '#EA580C'],
    route: 'RVCampingBrowse',
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubbles',
    iconType: 'ionicons',
    gradientColors: ['#EF4444', '#DC2626'],
    route: 'ProsMessages',
    showBadge: true,
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: 'wallet',
    iconType: 'ionicons',
    gradientColors: ['#8A05BE', '#6366F1'],
    route: 'Wallet',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: 'business',
    iconType: 'ionicons',
    gradientColors: ['#D4A0FF', '#8A05BE'],
    route: 'CitiesBrowse',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'heart',
    iconType: 'ionicons',
    gradientColors: ['#FB7185', '#F43F5E'],
    route: 'SavedMain',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person',
    iconType: 'ionicons',
    gradientColors: ['#94A3B8', '#64748B'],
    route: 'ProfileMain',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    iconType: 'ionicons',
    gradientColors: ['#34D399', '#00C2CB'],
    route: 'UniversalAdd',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: 'home',
    iconType: 'ionicons',
    gradientColors: ['#14B8A6', '#0D9488'],
    route: 'RealtorsHub',
  },
  {
    id: 'happening',
    name: 'Happening',
    icon: 'sparkles',
    iconType: 'ionicons',
    gradientColors: ['#F472B6', '#EC4899'],
    route: 'HappeningNow',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    iconType: 'ionicons',
    gradientColors: ['#6B7280', '#4B5563'],
    route: 'Settings',
  },
];

export default function AppsScreen() {
  const copy = useReleaseCopy();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const { unreadCount } = useUnreadMessagesContext();
  const [searchQuery, setSearchQuery] = useState('');

  const handleTilePress = (tile: AppTile) => {
    if (tile.route) {
      // Special handling for routes that require login
      if ((tile.id === 'saved' || tile.id === 'account' || tile.id === 'messages') && !user) {
        navigation.navigate('Login');
        return;
      }
      
      // Special handling for eCard
      if (tile.id === 'digital-card') {
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        navigation.navigate('ECardHub');
        return;
      }
      
      // Special handling for Atlas - navigate to AtlasMain screen directly
      if (tile.route === 'Atlas') {
        navigation.navigate('AtlasMain');
        return;
      }
      if (tile.route === 'Pros') {
        navigation.getParent()?.navigate("Pros");
        return;
      }
      
      navigation.navigate(tile.route, tile.params || {});
    }
  };

  const handleMenuItemPress = (action: string) => {
    switch (action) {
      case "help":
        navigation.navigate('HelpSupport');
        break;
      case "settings":
        navigation.navigate("Settings");
        break;
    }
  };

  const palette = isDark ? design.dark : design.light;
  const colors = {
    background: palette.background, surface: palette.surface,
    text: palette.text, secondary: palette.textSecondary,
    border: palette.border, accent: palette.link,
    iconBg: isDark ? '#3A254B' : '#F0E7F8', tealBg: isDark ? '#173D3B' : '#E6F2EC', teal: isDark ? '#83D9C9' : '#14675E',
  };
  const allTools = [...FEATURED_APPS, ...APP_TILES];
  const filtered = allTools.filter(app => toolMatches(app.id, searchQuery, copy(TOOL_DETAILS[toolKey(app.id)].name)));
  const detail = (app: AppTile) => TOOL_DETAILS[toolKey(app.id)];
  const featuredColor = (id: string) => id === 'atlas' ? (isDark ? '#193434' : '#E2F0EA') : id === 'digital-card' ? (isDark ? '#362B25' : '#F5ECE1') : (isDark ? '#30203F' : '#EDE3F5');
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><View style={{ flex: 1 }}><Image accessibilityLabel="Tavvy" accessible source={isDark ? require('../assets/brand/tavvy-logo-horizontal-white.png') : require('../assets/brand/tavvy-logo-horizontal-dark.png')} resizeMode="contain" style={{ width: 160, height: 47, marginBottom: 24 }} /><Text style={[styles.eyebrow, { color: colors.accent }]}>{copy("A LITTLE HELP FOR EVERY DAY")}</Text><Text style={[styles.title, { color: colors.text }]}>{copy("What would you like to do?")}</Text><Text style={[styles.intro, { color: colors.secondary }]}>{copy("Find your next stop. Meet the right people. Make yourself at home.")}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={user ? 'Your account' : 'Sign in'} style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate(user ? 'ProfileMain' : 'Login')}><Ionicons name="person-outline" size={22} color={colors.text} /></TouchableOpacity></View>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name={"search"} size={20} color={colors.secondary} /><TextInput accessibilityLabel="Search apps and tools" placeholder={copy("Search food, places, people and more")} placeholderTextColor={colors.secondary} value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchInput, { color: colors.text }]} />{searchQuery.length > 0 && <TouchableOpacity accessibilityLabel={copy("Clear search")} onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={22} color={colors.secondary} /></TouchableOpacity>}</View>
      {!searchQuery.trim() && <View><Text style={[styles.sectionTitle, { color: colors.text }]}>{copy("A good place to start")}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>{FEATURED_APPS.map(app => <TouchableOpacity accessibilityRole="button" key={app.id} onPress={() => handleTilePress(app)} activeOpacity={0.85} style={[styles.featuredCard, { backgroundColor: featuredColor(app.id), borderColor: colors.border }]}><View style={styles.featuredTop}><Ionicons name={app.icon as any} size={26} color={colors.text} /><Ionicons name="arrow-up-outline" style={{ transform: [{ rotate: '45deg' }] }} size={20} color={colors.secondary} /></View><Text style={[styles.toolTitle, { color: colors.text }]}>{copy(detail(app).name)}</Text><Text style={[styles.description, { color: colors.secondary }]}>{copy(detail(app).description)}</Text></TouchableOpacity>)}</ScrollView></View>}
      {filtered.length === 0 ? <View style={styles.empty}><Text style={[styles.sectionTitle, { color: colors.text }]}>{copy("No tools found")}</Text><Text style={[styles.description, { color: colors.secondary }]}>{copy("Try a word like food, cards or places.")}</Text><TouchableOpacity onPress={() => setSearchQuery('')}><Text style={[styles.clear, { color: colors.accent }]}>{copy("Show all tools")}</Text></TouchableOpacity></View> : TOOL_GROUPS.map(group => { const items = filtered.filter(app => detail(app).group === group.id); return items.length > 0 && <View key={group.id} style={styles.group}><Text style={[styles.sectionTitle, { color: colors.text }]}>{copy(group.title)}</Text><Text style={[styles.groupDescription, { color: colors.secondary }]}>{copy(group.description)}</Text>{items.map(app => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${copy(detail(app).name)}. ${copy(detail(app).description)}${app.showBadge && unreadCount > 0 ? `. ${unreadCount} unread messages` : ''}`} key={app.id} onPress={() => handleTilePress(app)} activeOpacity={0.8} style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: group.id === 'discover' ? colors.tealBg : colors.iconBg }]}><Ionicons name={app.icon as any} size={23} color={group.id === 'discover' ? colors.teal : colors.accent} />{app.showBadge && unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}</View><View style={{ flex: 1 }}><Text style={[styles.toolTitle, { color: colors.text }]}>{copy(detail(app).name)}</Text><Text style={[styles.description, { color: colors.secondary }]}>{copy(detail(app).description)}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.secondary} /></TouchableOpacity>)}</View>; })}
      <View style={[styles.appearance, { borderColor: colors.border }]}><TouchableOpacity onPress={() => handleMenuItemPress("help")}><Text style={[styles.clear, { color: colors.accent }]}>Need a hand? Help & support</Text></TouchableOpacity></View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { padding: 20, paddingTop: 28, paddingBottom: 110 }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 14 }, title: { fontSize: 32, fontWeight: '700', lineHeight: 36, letterSpacing: -1 }, intro: { fontSize: 15, lineHeight: 23, marginTop: 12 }, profile: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 16, marginTop: 26, marginBottom: 30 }, searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 16 }, sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }, featuredScroll: { gap: 12, paddingVertical: 16 }, featuredCard: { width: 235, padding: 20, borderWidth: 1, borderRadius: 20 }, featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }, toolTitle: { fontSize: 16, fontWeight: '600', marginBottom: 5 }, description: { fontSize: 13, lineHeight: 20 }, group: { marginTop: 28 }, groupDescription: { fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 16 }, tool: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 }, icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#B91C1C', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' }, empty: { alignItems: 'center', paddingVertical: 32, gap: 8 }, clear: { fontSize: 14, fontWeight: '600', paddingVertical: 16 }, appearance: { borderTopWidth: 1, marginTop: 30, paddingTop: 24 },
});
