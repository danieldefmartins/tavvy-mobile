
/**
 * Experience Paths Screen
 * Install path: screens/ExperiencePathsScreen.tsx
 * 
 * Guided sequences like Date Night, Family Saturday, Moving to a City, and more.
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
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Experience Paths colors
const ExperienceColors = {
  primary: '#5856D6',
  secondary: '#7C3AED',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  gradientStart: '#5856D6',
  gradientEnd: '#7C3AED',
};

// Path categories
const CATEGORIES = [
  { id: 'all', name: 'All Paths', icon: 'compass' },
  { id: 'date', name: 'Date Night', icon: 'heart' },
  { id: 'family', name: 'Family', icon: 'people' },
  { id: 'adventure', name: 'Adventure', icon: 'rocket' },
  { id: 'relocation', name: 'New in Town', icon: 'home' },
  { id: 'foodie', name: 'Foodie', icon: 'restaurant' },
];

// Mock experience paths data
const MOCK_PATHS = [
  {
    id: '1',
    title: 'Perfect Date Night',
    description: 'A curated evening of romance, from dinner reservations to sunset views',
    image: 'https://images.unsplash.com/photo-1529543544277-750e0c7f0c38?w=600',
    category: 'date',
    duration: '4-5 hours',
    stops: 4,
    difficulty: 'Easy',
    rating: 4.9,
    completions: 2340,
    featured: true,
    steps: [
      { name: 'Cocktails at Rooftop Bar', type: 'bar' },
      { name: 'Dinner at Italian Bistro', type: 'restaurant' },
      { name: 'Sunset Walk at Pier', type: 'outdoor' },
      { name: 'Dessert at Gelato Shop', type: 'dessert' },
    ],
  },
  {
    id: '2',
    title: 'Family Fun Saturday',
    description: 'Kid-friendly activities that parents will love too',
    image: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=600',
    category: 'family',
    duration: '6-8 hours',
    stops: 5,
    difficulty: 'Easy',
    rating: 4.8,
    completions: 1890,
    featured: true,
    steps: [
      { name: 'Breakfast at Family Diner', type: 'restaurant' },
      { name: 'Morning at Science Museum', type: 'museum' },
      { name: 'Lunch at Food Court', type: 'restaurant' },
      { name: 'Afternoon at Adventure Park', type: 'park' },
      { name: 'Ice Cream Treat', type: 'dessert' },
    ],
  },
  {
    id: '3',
    title: 'New to the City',
    description: 'Essential spots every newcomer should discover in their first month',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600',
    category: 'relocation',
    duration: 'Multi-day',
    stops: 12,
    difficulty: 'Moderate',
    rating: 4.7,
    completions: 5670,
    featured: true,
    steps: [
      { name: 'City Hall & Downtown', type: 'landmark' },
      { name: 'Best Local Coffee Shop', type: 'cafe' },
      { name: 'Neighborhood Grocery', type: 'shopping' },
      { name: 'Popular Gym', type: 'fitness' },
    ],
  },
  {
    id: '4',
    title: 'Foodie Tour',
    description: 'Taste your way through the best local cuisine and hidden gems',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    category: 'foodie',
    duration: '5-6 hours',
    stops: 6,
    difficulty: 'Easy',
    rating: 4.9,
    completions: 3210,
    featured: false,
    steps: [
      { name: 'Morning Pastries', type: 'bakery' },
      { name: 'Brunch Spot', type: 'restaurant' },
      { name: 'Local Market', type: 'market' },
      { name: 'Street Food Alley', type: 'street_food' },
      { name: 'Craft Brewery', type: 'bar' },
      { name: 'Fine Dining Finale', type: 'restaurant' },
    ],
  },
  {
    id: '5',
    title: 'Outdoor Adventure',
    description: 'Explore nature trails, scenic viewpoints, and outdoor activities',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
    category: 'adventure',
    duration: 'Full Day',
    stops: 4,
    difficulty: 'Challenging',
    rating: 4.6,
    completions: 1450,
    featured: false,
    steps: [
      { name: 'Sunrise Hike', type: 'trail' },
      { name: 'Mountain Viewpoint', type: 'viewpoint' },
      { name: 'Lakeside Picnic', type: 'outdoor' },
      { name: 'Sunset at Peak', type: 'viewpoint' },
    ],
  },
  {
    id: '6',
    title: 'Romantic Getaway',
    description: 'A weekend escape for couples seeking quality time together',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
    category: 'date',
    duration: 'Weekend',
    stops: 8,
    difficulty: 'Easy',
    rating: 4.8,
    completions: 890,
    featured: false,
    steps: [
      { name: 'Boutique Hotel Check-in', type: 'hotel' },
      { name: 'Couples Spa', type: 'spa' },
      { name: 'Wine Tasting', type: 'winery' },
      { name: 'Candlelit Dinner', type: 'restaurant' },
    ],
  },
];

type NavigationProp = NativeStackNavigationProp<any>;

export default function ExperiencePathsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePathPress = (path: typeof MOCK_PATHS[0]) => {
    navigation.navigate('ExperiencePathDetail', { pathId: path.id });
  };

  const filteredPaths = selectedCategory === 'all' 
    ? MOCK_PATHS 
    : MOCK_PATHS.filter(p => p.category === selectedCategory);

  const featuredPaths = MOCK_PATHS.filter(p => p.featured);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Moderate': return '#F59E0B';
      case 'Challenging': return '#EF4444';
      default: return ExperienceColors.textMuted;
    }
  };

  const renderFeaturedPath = ({ item }: { item: typeof MOCK_PATHS[0] }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => handlePathPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={12} color="#FFFFFF" />
          <Text style={styles.featuredBadgeText}>{t('experiencePaths.popular', 'Popular')}</Text>
        </View>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="time-outline" size={14} color="#FFFFFF" />
          <Text style={styles.featuredMetaText}>{item.duration}</Text>
          <Ionicons name="flag-outline" size={14} color="#FFFFFF" style={{ marginLeft: 12 }} />
          <Text style={styles.featuredMetaText}>{t('experiencePaths.stops', '{{count}} stops', { count: item.stops })}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPathCard = ({ item }: { item: typeof MOCK_PATHS[0] }) => (
    <TouchableOpacity 
      style={styles.pathCard}
      onPress={() => handlePathPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.pathImage} />
      <View style={styles.pathInfo}>
        <View style={styles.pathHeader}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.pathTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.pathDescription} numberOfLines={2}>{item.description}</Text>
        
        {/* Steps Preview */}
        <View style={styles.stepsPreview}>
          {item.steps.slice(0, 3).map((step, index) => (
            <View key={index} style={styles.stepDot}>
              <View style={styles.stepDotInner} />
              {index < 2 && <View style={styles.stepLine} />}
            </View>
          ))}
          {item.steps.length > 3 && (
            <Text style={styles.moreSteps}>{t('experiencePaths.more', '+{{count}} more', { count: item.steps.length - 3 })}</Text>
          )}
        </View>

        <View style={styles.pathFooter}>
          <View style={styles.pathMeta}>
            <Ionicons name="time-outline" size={14} color={ExperienceColors.textLight} />
            <Text style={styles.pathMetaText}>{item.duration}</Text>
          </View>
          <View style={styles.pathMeta}>
            <Ionicons name="people-outline" size={14} color={ExperienceColors.textLight} />
            <Text style={styles.pathMetaText}>
              {t('experiencePaths.completed', '{{count}} completed', { count: item.completions > 1000 ? `${(item.completions / 1000).toFixed(1)}k` : item.completions })}
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
        colors={[ExperienceColors.gradientStart, ExperienceColors.gradientEnd]}
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
              <Text style={styles.headerTitle}>{t('experiencePaths.experiences', 'Experiences')}</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        {/* Featured Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('experiencePaths.featuredPaths', 'Featured Paths')}</Text>
          <FlatList
            data={featuredPaths}
            renderItem={renderFeaturedPath}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredListContent}
            snapToInterval={width - 60 + 16}
            decelerationRate="fast"
          />
        </View>

        {/* Categories Section */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : ExperienceColors.primary} 
                />
                <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                  {t(`experiencePaths.${category.id}`, category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* All Paths Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('experiencePaths.allExperiencePaths', 'All Experience Paths')}</Text>
          {filteredPaths.length > 0 ? (
            <FlatList
              data={filteredPaths}
              renderItem={renderPathCard}
              keyExtractor={item => item.id}
              scrollEnabled={false} // Use parent ScrollView
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={ExperienceColors.textMuted} />
              <Text style={styles.emptyStateText}>{t('experiencePaths.noPathsAvailable', 'No paths available for this category.')}</Text>
              <Text style={styles.emptyStateSubtext}>{t('experiencePaths.checkBackLater', 'Check back later or select another category.')}</Text>
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
    backgroundColor: ExperienceColors.background,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40, // to balance the back button
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ExperienceColors.text,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  featuredListContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  categoryContainer: {
    marginTop: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: ExperienceColors.primary,
    borderColor: ExperienceColors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: ExperienceColors.primary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  featuredCard: {
    width: width - 80,
    height: (width - 80) * 0.6,
    borderRadius: 20,
    marginRight: 16,
    backgroundColor: ExperienceColors.cardBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pathImage: {
    width: '100%',
    height: 160,
  },
  pathInfo: {
    padding: 16,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: ExperienceColors.text,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ExperienceColors.text,
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    color: ExperienceColors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  stepsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ExperienceColors.primary,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: ExperienceColors.primary,
    opacity: 0.3,
  },
  moreSteps: {
    fontSize: 12,
    color: ExperienceColors.textMuted,
    marginLeft: 8,
  },
  pathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pathMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pathMetaText: {
    fontSize: 13,
    color: ExperienceColors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: ExperienceColors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: ExperienceColors.textLight,
    marginTop: 4,
  },
});
