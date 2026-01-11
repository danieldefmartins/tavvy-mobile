/**
 * Pros Browse Screen
 * Install path: screens/ProsBrowseScreen.tsx
 * 
 * Service discovery and provider search screen.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors, PROS_CATEGORIES } from '../constants/ProsConfig';
import { ProsProviderCard } from '../components/ProsProviderCard';
import { useSearchPros } from '../hooks/usePros';
import { Pro } from '../lib/ProsTypes';

type RouteParams = {
  ProsBrowseScreen: {
    categorySlug?: string;
    query?: string;
    location?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsBrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsBrowseScreen'>>();
  
  const initialCategory = route.params?.categorySlug;
  const initialQuery = route.params?.query || '';
  const initialLocation = route.params?.location || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [showFilters, setShowFilters] = useState(false);

  const { pros, total, loading, error, searchPros } = useSearchPros();

  useEffect(() => {
    performSearch();
  }, [selectedCategory]);

  const performSearch = useCallback(() => {
    searchPros({
      categorySlug: selectedCategory || undefined,
      query: searchQuery || undefined,
      city: location || undefined,
      limit: 20,
    });
  }, [selectedCategory, searchQuery, location]);

  const handleSearch = () => {
    performSearch();
  };

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug === selectedCategory ? null : slug);
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfileScreen', { slug });
  };

  const handleMessagePress = (proId: number) => {
    navigation.navigate('ProsMessagesScreen', { proId });
  };

  const selectedCategoryName = selectedCategory
    ? PROS_CATEGORIES.find(c => c.slug === selectedCategory)?.name
    : null;

  const renderPro = ({ item }: { item: Pro }) => (
    <ProsProviderCard
      pro={item}
      onPress={handleProPress}
      onMessagePress={handleMessagePress}
    />
  );

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={ProsColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pros..."
            placeholderTextColor={ProsColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={ProsColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters ? ProsColors.primary : ProsColors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Location Filter */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.locationBar}>
            <Ionicons name="location-outline" size={20} color={ProsColors.textMuted} />
            <TextInput
              style={styles.locationInput}
              placeholder="City or ZIP code"
              placeholderTextColor={ProsColors.textMuted}
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPills}
      >
        <TouchableOpacity
          style={[
            styles.categoryPill,
            !selectedCategory && styles.categoryPillActive,
          ]}
          onPress={() => handleCategorySelect(null)}
        >
          <Text
            style={[
              styles.categoryPillText,
              !selectedCategory && styles.categoryPillTextActive,
            ]}
          >
            All Services
          </Text>
        </TouchableOpacity>
        {PROS_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategory === category.slug && styles.categoryPillActive,
            ]}
            onPress={() => handleCategorySelect(category.slug)}
          >
            <Ionicons
              name={category.icon as any}
              size={14}
              color={
                selectedCategory === category.slug
                  ? '#FFFFFF'
                  : ProsColors.textSecondary
              }
              style={styles.categoryPillIcon}
            />
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === category.slug && styles.categoryPillTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {selectedCategoryName || 'All Services'}
        </Text>
        <Text style={styles.resultsCount}>
          {total} {total === 1 ? 'pro' : 'pros'} found
        </Text>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.emptyText}>Searching for pros...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={ProsColors.error} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={performSearch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={ProsColors.textMuted} />
        <Text style={styles.emptyTitle}>No pros found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or browse different categories
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Pros</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={pros}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPro}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPills: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: ProsColors.primary,
  },
  categoryPillIcon: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProsColors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  resultsCount: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
