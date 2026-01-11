import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

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
  radiusMiles: number = 5000,
  options?: { categories?: string[] }
) {
  return useQuery({
    queryKey: ['places', latitude, longitude, radiusMiles, options?.categories],
    queryFn: async () => {
      if (!latitude || !longitude) return [];

      // Create bounding box for efficient query
      const latDelta = 0.1; // ~11km
      const lngDelta = 0.1;
      
      // Query fsq_places_raw table (104M Foursquare places)
      let query = supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, fsq_category_labels')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
        .limit(200);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distance and map to Place interface
      const placesWithDistance = (data || [])
        .filter((place: any) => place.latitude && place.longitude)
        .map((place: any) => {
          // Parse category from fsq_category_labels
          let category = 'Other';
          if (place.fsq_category_labels) {
            // fsq_category_labels is stored as text, might be comma-separated
            const labels = typeof place.fsq_category_labels === 'string' 
              ? place.fsq_category_labels.split(',')[0] 
              : place.fsq_category_labels[0];
            if (labels) category = labels.trim();
          }
          
          return {
            id: place.fsq_place_id,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            primary_category: category,
            address_line1: place.address,
            city: place.locality,
            state_region: place.region,
            country: place.country,
            distance: calculateDistance(
              latitude,
              longitude,
              place.latitude,
              place.longitude
            ),
          };
        });

      // Filter by categories if provided
      let filtered = placesWithDistance;
      if (options?.categories && options.categories.length > 0) {
        filtered = placesWithDistance.filter((p: any) => 
          options.categories!.some(cat => 
            p.primary_category?.toLowerCase().includes(cat.toLowerCase())
          )
        );
      }

      // Return sorted by distance
      return filtered.sort((a, b) => a.distance - b.distance);
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
