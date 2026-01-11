import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserFavorites, FavoriteWithPlace } from '../hooks/useFavorite';
import { useAuth } from '../contexts/AuthContext';

export default function SavedScreen({ navigation }: any) {
  const { user } = useAuth();
  const { data: favorites, isLoading, refetch } = useUserFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: FavoriteWithPlace }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Home', {
        screen: 'PlaceDetails',
        params: { placeId: item.placeId }
      })}
    >
      <Image
        source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/100' }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.placeName} numberOfLines={1}>{item.placeName}</Text>
          <Ionicons name="heart" size={20} color="#EF4444" />
        </View>
        
        <Text style={styles.category}>{item.primaryCategory}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.city}, {item.state}
          </Text>
        </View>

        {item.notes && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteText} numberOfLines={1}>📝 {item.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Image 
            source={require('../assets/brand/logo-icon.png')} 
            style={styles.emptyLogo}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Sign in to view saved places</Text>
          <Text style={styles.emptySubtitle}>
            Keep track of your favorite spots and places you want to visit.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Profile', { screen: 'Login' })}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Places</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      ) : favorites && favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Image 
            source={require('../assets/brand/logo-icon.png')} 
            style={styles.emptyLogo}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>No saved places yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any place to save it to your list.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.exploreButtonText}>Explore Places</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  noteContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  noteText: {
    fontSize: 11,
    color: '#92400E',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  signInButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  exploreButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  exploreButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
});