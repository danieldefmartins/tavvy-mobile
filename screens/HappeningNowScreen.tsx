/**
 * Happening Now Screen
 * Install path: screens/HappeningNowScreen.tsx
 * 
 * Discover seasonal and live experiences nearby – events, holiday lights, concerts, games, and more.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Happening Now colors
const HappeningColors = {
  primary: '#FF2D55',
  secondary: '#FF6B6B',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  gradientStart: '#FF2D55',
  gradientEnd: '#FF6B6B',
};

// Event categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'sparkles' },
  { id: 'concerts', name: 'Concerts', icon: 'musical-notes' },
  { id: 'sports', name: 'Sports', icon: 'football' },
  { id: 'festivals', name: 'Festivals', icon: 'balloon' },
  { id: 'holiday', name: 'Holiday', icon: 'snow' },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant' },
  { id: 'arts', name: 'Arts', icon: 'color-palette' },
];

// Mock events data
const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Winter Lights Festival',
    description: 'Experience millions of lights across 50 acres of magical displays',
    image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=600',
    category: 'holiday',
    date: 'Dec 15 - Jan 5',
    time: '5:00 PM - 10:00 PM',
    location: 'Botanical Gardens',
    distance: '2.3 mi',
    price: '$25',
    featured: true,
    attendees: 1250,
  },
  {
    id: '2',
    title: 'Downtown Jazz Night',
    description: 'Live jazz performances from local and touring artists',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600',
    category: 'concerts',
    date: 'Tonight',
    time: '7:00 PM',
    location: 'Blue Note Club',
    distance: '0.8 mi',
    price: '$15',
    featured: false,
    attendees: 89,
  },
  {
    id: '3',
    title: 'Food Truck Rally',
    description: '30+ food trucks, live music, and family fun',
    image: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600',
    category: 'food',
    date: 'This Weekend',
    time: '11:00 AM - 8:00 PM',
    location: 'Central Park',
    distance: '1.5 mi',
    price: 'Free Entry',
    featured: true,
    attendees: 3400,
  },
  {
    id: '4',
    title: 'Basketball: Home Game',
    description: 'Catch the action as our team takes on the rivals',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
    category: 'sports',
    date: 'Tomorrow',
    time: '7:30 PM',
    location: 'City Arena',
    distance: '4.2 mi',
    price: 'From $45',
    featured: false,
    attendees: 15000,
  },
  {
    id: '5',
    title: 'Art Walk Friday',
    description: 'Explore galleries, meet artists, and enjoy refreshments',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600',
    category: 'arts',
    date: 'Friday',
    time: '6:00 PM - 9:00 PM',
    location: 'Arts District',
    distance: '1.1 mi',
    price: 'Free',
    featured: false,
    attendees: 450,
  },
  {
    id: '6',
    title: 'Summer Music Festival',
    description: '3 days of music, art, and community celebration',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600',
    category: 'festivals',
    date: 'Jan 20-22',
    time: 'All Day',
    location: 'Riverside Park',
    distance: '3.7 mi',
    price: 'From $75',
    featured: true,
    attendees: 8500,
  },
];

type NavigationProp = NativeStackNavigationProp<any>;

export default function HappeningNowScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEventPress = (event: typeof MOCK_EVENTS[0]) => {
    navigation.navigate('HappeningNowDetail', { eventId: event.id });
  };

  const filteredEvents = selectedCategory === 'all' 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.category === selectedCategory);

  const featuredEvents = MOCK_EVENTS.filter(e => e.featured);

  const renderFeaturedEvent = ({ item }: { item: typeof MOCK_EVENTS[0] }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
          <Text style={styles.featuredMetaText}>{item.date}</Text>
          <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginLeft: 12 }} />
          <Text style={styles.featuredMetaText}>{item.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEventCard = ({ item }: { item: typeof MOCK_EVENTS[0] }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <View style={styles.eventDateBadge}>
          <Text style={styles.eventDateText}>{item.date}</Text>
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.eventMeta}>
          <View style={styles.eventMetaItem}>
            <Ionicons name="location-outline" size={14} color={HappeningColors.textLight} />
            <Text style={styles.eventMetaText}>{item.location}</Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={14} color={HappeningColors.textLight} />
            <Text style={styles.eventMetaText}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.eventFooter}>
          <Text style={styles.eventPrice}>{item.price}</Text>
          <View style={styles.eventAttendees}>
            <Ionicons name="people-outline" size={14} color={HappeningColors.textMuted} />
            <Text style={styles.eventAttendeesText}>
              {item.attendees > 1000 ? `${(item.attendees / 1000).toFixed(1)}k` : item.attendees} interested
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[HappeningColors.gradientStart, HappeningColors.gradientEnd]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Image 
                source={require('../assets/brand/tavvy-logo-white.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Happening Now</Text>
            </View>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Pills */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === category.id && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : HappeningColors.primary} 
                />
                <Text style={[
                  styles.categoryPillText,
                  selectedCategory === category.id && styles.categoryPillTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Events */}
        {selectedCategory === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Events</Text>
            <FlatList
              data={featuredEvents}
              renderItem={renderFeaturedEvent}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* All Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Upcoming Events' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </Text>
          {filteredEvents.map((event) => (
            <View key={event.id}>
              {renderEventCard({ item: event })}
            </View>
          ))}
          {filteredEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={HappeningColors.textMuted} />
              <Text style={styles.emptyStateText}>No events found</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for new events</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HappeningColors.background,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 80,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: HappeningColors.primary,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: HappeningColors.primary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: HappeningColors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: width * 0.8,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: HappeningColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: 120,
    height: 140,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  eventDateBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eventDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: HappeningColors.primary,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: HappeningColors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: HappeningColors.textLight,
    lineHeight: 16,
    marginBottom: 8,
  },
  eventMeta: {
    gap: 4,
    marginBottom: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: HappeningColors.textLight,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: HappeningColors.primary,
  },
  eventAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventAttendeesText: {
    fontSize: 11,
    color: HappeningColors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: HappeningColors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: HappeningColors.textLight,
    marginTop: 4,
  },
});
