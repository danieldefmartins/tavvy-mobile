import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'universe', label: 'Universes' },
  { id: 'city', label: 'Cities' },
  { id: 'airport', label: 'Airports' },
];

const MOCK_DATA = [
  { id: 'orlando', type: 'city', name: 'Orlando, FL', image: 'https://images.unsplash.com/photo-1597466599360-3b9775841fea?w=500', subtitle: '2.1M people • 45k signals' },
  { id: 'coffee', type: 'universe', name: 'Best Coffee in NYC', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500', subtitle: '124 places • 12k signals' },
  { id: 'jfk', type: 'airport', name: 'JFK Airport', image: 'https://images.unsplash.com/photo-1587163539236-05b92770231d?w=500', subtitle: 'New York, NY • Busy' },
];

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredData = activeFilter === 'all' 
    ? MOCK_DATA 
    : MOCK_DATA.filter(item => item.type === activeFilter);

  const handlePress = (item: any) => {
    if (item.type === 'city') {
      navigation.navigate('CityDetails', { cityId: item.id });
    } else if (item.type === 'universe') {
      navigation.navigate('UniverseLanding', { universeId: item.id });
    } else {
      // Handle other types
      alert(`Clicked ${item.name}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <Text style={styles.searchText}>Search cities, universes...</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter.id} 
              style={[styles.filterChip, activeFilter === filter.id && styles.activeFilter]} 
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.arrow} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilter: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  filterText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  activeFilterText: {
    color: Colors.primary,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrow: {
    marginLeft: 8,
  },
});