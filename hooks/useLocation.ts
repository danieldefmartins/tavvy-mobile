/**
 * useLocation Hook - GPS location and reverse geocoding for Universal Add
 */
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  formatted_address: string | null;
}

export interface UseLocationResult {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => Promise<LocationData | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<LocationData | null>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('[useLocation] Error checking permission:', err);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to auto-fill your address. You can also enter it manually.',
          [{ text: 'OK' }]
        );
      }
      
      return granted;
    } catch (err) {
      console.error('[useLocation] Error requesting permission:', err);
      return false;
    }
  };

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<LocationData | null> => {
    try {
      // Use Nominatim for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Tavvy/1.0',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      const address = data.address || {};
      
      // Build address line 1
      let addressLine1 = '';
      if (address.house_number) {
        addressLine1 = address.house_number;
      }
      if (address.road) {
        addressLine1 += addressLine1 ? ` ${address.road}` : address.road;
      }
      if (!addressLine1 && address.neighbourhood) {
        addressLine1 = address.neighbourhood;
      }
      
      // Build formatted address
      const parts = [];
      if (addressLine1) parts.push(addressLine1);
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      if (address.state) parts.push(address.state);
      if (address.postcode) parts.push(address.postcode);
      if (address.country) parts.push(address.country);
      
      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        address_line1: addressLine1 || null,
        address_line2: null,
        city: address.city || address.town || address.village || null,
        region: address.state || address.county || null,
        postal_code: address.postcode || null,
        country: address.country || null,
        formatted_address: parts.join(', ') || data.display_name || null,
      };
      
      return locationData;
    } catch (err) {
      console.error('[useLocation] Reverse geocode error:', err);
      // Return basic location without address
      return {
        latitude: lat,
        longitude: lng,
        address_line1: null,
        address_line2: null,
        city: null,
        region: null,
        postal_code: null,
        country: null,
        formatted_address: null,
      };
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check/request permission
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError('Location permission denied');
          return null;
        }
      }
      
      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get address
      const locationData = await reverseGeocode(latitude, longitude);
      
      if (locationData) {
        setLocation(locationData);
      }
      
      return locationData;
    } catch (err: any) {
      console.error('[useLocation] Error getting location:', err);
      setError(err.message || 'Failed to get location');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, reverseGeocode]);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    reverseGeocode,
  };
}

export default useLocation;
