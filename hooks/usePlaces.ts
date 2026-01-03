import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  primary_category: string;
  address_line1?: string;
  city?: string;
  state_region?: string;
  cover_image_url?: string;
  distance?: number;
}

export function useNearbyPlaces(
  latitude?: number,
  longitude?: number,
  radiusMiles: number = 50,
  options?: { categories?: string[] }
) {
  return useQuery({
    queryKey: ['places', latitude, longitude, radiusMiles, options?.categories],
    queryFn: async () => {
      if (!latitude || !longitude) return [];

      let query = supabase
        .from('places')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Filter by categories if provided
      if (options?.categories && options.categories.length > 0) {
        query = query.in('primary_category', options.categories);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Calculate distance and filter by radius
      const placesWithDistance = (data || []).map((place: any) => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude
        ),
      }));

      return placesWithDistance
        .filter((place) => place.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);
    },
    enabled: !!latitude && !!longitude,
  });
}

// Haversine formula to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}