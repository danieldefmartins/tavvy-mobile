/**
 * MultipleEntrancesComponent - UPDATED to match YOUR actual database schema
 * 
 * Displays all entrances for a place with distance calculation and navigation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import {
  useEntrancesWithDistance,
  useClosestEntrance,
  formatDistance,
  getEntranceIcon,
  getEntranceColor,
  PlaceEntrance,
} from '../hooks/useEntrances';

interface MultipleEntrancesComponentProps {
  placeId: string;
  placeName: string;
}

export default function MultipleEntrancesComponent({
  placeId,
  placeName,
}: MultipleEntrancesComponentProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Fetch entrances with distance calculation
  const {
    data: entrances,
    isLoading,
    error,
  } = useEntrancesWithDistance(
    placeId,
    userLocation?.lat,
    userLocation?.lng
  );

  // Get closest entrance
  const { data: closestEntrance } = useClosestEntrance(
    placeId,
    userLocation?.lat,
    userLocation?.lng
  );

  // Get user's current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    })();
  }, []);

  // Open navigation app
  const openNavigation = (entrance: PlaceEntrance) => {
    const label = encodeURIComponent(entrance.label);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${entrance.lat},${entrance.lng}`,
      android: `geo:0,0?q=${entrance.lat},${entrance.lng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
    }
  };

  // Copy GPS coordinates to clipboard
  const copyCoordinates = (entrance: PlaceEntrance) => {
    // Note: You'll need to install @react-native-clipboard/clipboard
    // For now, just show alert
    Alert.alert(
      'GPS Coordinates',
      `Latitude: ${entrance.lat}\nLongitude: ${entrance.lng}`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading entrances...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading entrances</Text>
      </View>
    );
  }

  if (!entrances || entrances.length === 0) {
    return null; // No entrances to display
  }

  // Only show if there are multiple entrances
  if (entrances.length === 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Multiple Entrances</Text>
        <Text style={styles.subtitle}>
          {entrances.length} entrance{entrances.length > 1 ? 's' : ''} available
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entrances.map((entrance) => {
          const isClosest = closestEntrance?.id === entrance.id;
          const isMain = entrance.is_main;

          return (
            <TouchableOpacity
              key={entrance.id}
              style={[
                styles.entranceCard,
                isClosest && styles.closestCard,
                isMain && styles.mainCard,
              ]}
              onPress={() => openNavigation(entrance)}
              onLongPress={() => copyCoordinates(entrance)}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getEntranceColor(entrance.label) + '20' },
                ]}
              >
                <Text style={styles.icon}>{getEntranceIcon(entrance.label)}</Text>
              </View>

              {/* Label */}
              <Text style={styles.entranceLabel} numberOfLines={2}>
                {entrance.label}
              </Text>

              {/* Badges */}
              <View style={styles.badges}>
                {isMain && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Main</Text>
                  </View>
                )}
                {isClosest && userLocation && (
                  <View style={[styles.badge, styles.closestBadge]}>
                    <Text style={styles.badgeText}>Closest</Text>
                  </View>
                )}
              </View>

              {/* Distance */}
              {entrance.distance !== undefined && (
                <Text style={styles.distance}>
                  {formatDistance(entrance.distance)}
                </Text>
              )}

              {/* Address (if available) */}
              {entrance.address_line1 && (
                <Text style={styles.address} numberOfLines={2}>
                  {entrance.address_line1}
                  {entrance.city && `, ${entrance.city}`}
                </Text>
              )}

              {/* Navigate button */}
              <View style={styles.navigateButton}>
                <Text style={styles.navigateText}>Navigate →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tip */}
      <Text style={styles.tip}>
        💡 Tap to navigate, long-press to copy GPS coordinates
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  entranceCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closestCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  mainCard: {
    borderColor: '#3B82F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  entranceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 40,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closestBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    minHeight: 32,
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  navigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tip: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    padding: 16,
  },
});
