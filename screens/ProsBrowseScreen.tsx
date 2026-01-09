/**
 * Pros Browse Screen
 * Install path: screens/ProsBrowseScreen.tsx
 * 
 * Service discovery and provider search screen.
 */

import React, { useEffect, useState } from 'react';
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
import { useProsDirectory, useServiceCategories } from '../hooks/useProsDirectory';

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

  // Categories from DB (fallback to static config if DB is empty)
  const {
    data: dbCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useServiceCategories();

  const categories = (dbCategories && dbCategories.length > 0)
    ? dbCategories
    : PROS_CATEGORIES.map((c) => ({
        id: String(c.id),
        slug: c.slug,
        name: c.name,
        icon: c.icon,
      }));

  const selectedCategoryObj = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)
    : null;

  const categoryId = selectedCategoryObj?.id;

  const {
    data: places,
    isLoading: loading,
    error,
    refetch,
  } = useProsDirectory({
    categoryId: categoryId,
    query: searchQuery,
    cityOrZip: location,
    limit: 30,
  });

  const total = places?.length ?? 0;

  useEffect(() => {
    // Refetch when category changes
    if (categoryId) {
      refetch();
    }
  }, [categoryId]);

  const handleSearch = () => {
    refetch();
  };

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug === selectedCategory ? null : slug);
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfile', { slug });
  };

  const handleMessagePress = (proId: number) => {
    navigation.navigate('ProsMessages', { proId });
  };

  const selectedCategoryName = selectedCategoryObj?.name ?? null;

  const renderPro = ({ item }: { item: any }) => {
    // Adapt DB place -> ProviderData expected by ProsProviderCard
    const provider = {
      id: 0,
      slug: item?.id,
      businessName: item?.name,
      city: item?.city || '—',
      state: item?.state_region || '—',
      logoUrl: item?.cover_image_url || undefined,
      isVerified: true,
      categoryName: selectedCategoryName || undefined,
    };

    return (
      <ProsProviderCard
        provider={provider as any}
        onPress={() => handleProPress(provider.slug)}
        onMessagePress={() => handleMessagePress(0)}
      />
    );
  };

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
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategory === category.slug && styles.categoryPillActive,
            ]}
            onPress={() => handleCategorySelect(category.slug)}
          >
            <Ionicons
              name={
                // Prefer icon from static config (ensures valid Ionicons)
                (PROS_CATEGORIES.find((c) => c.slug === category.slug)?.icon as any) ||
                (category.icon as any) ||
                'briefcase-outline'
              }
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

      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[
            styles.getQuotesButton,
            !selectedCategory && styles.getQuotesButtonDisabled,
          ]}
          onPress={() =>
            navigation.navigate('ProsRequestQuote', { categorySlug: selectedCategory || undefined })
          }
          disabled={!selectedCategory}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
          <Text style={styles.getQuotesButtonText}>Get Quotes</Text>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
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
        data={places ?? []}
        keyExtractor={(item: any) => String(item.id)}
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
  ctaRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  getQuotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  getQuotesButtonDisabled: {
    opacity: 0.5,
  },
  getQuotesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
