/**
 * useEntrances Hook - UPDATED to match YOUR actual database schema
 * 
 * This hook provides access to place entrances from your existing place_entrances table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Type definition matching YOUR database schema
export interface PlaceEntrance {
  id: string;
  place_id: string;
  label: string; // e.g., "Main Entrance", "RV Entrance", "Delivery Entrance"
  lat: number;
  lng: number;
  geography?: any; // PostGIS geography (optional)
  address_line1?: string;
  city?: string;
  state_region?: string;
  postal_code?: string;
  country_code?: string;
  is_main: boolean; // Is this the primary entrance?
  sort_order: number; // Display order
  created_at: string;
  distance?: number; // Calculated distance from user (not in DB)
}

/**
 * Fetch all entrances for a specific place
 */
export function useEntrances(placeId: string) {
  return useQuery({
    queryKey: ['entrances', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_entrances')
        .select('*')
        .eq('place_id', placeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PlaceEntrance[];
    },
    enabled: !!placeId,
  });
}

/**
 * Fetch entrances with distance calculation from user's location
 */
export function useEntrancesWithDistance(
  placeId: string,
  userLat?: number,
  userLng?: number
) {
  return useQuery({
    queryKey: ['entrances', placeId, userLat, userLng],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_entrances')
        .select('*')
        .eq('place_id', placeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Calculate distance if user location is provided
      if (userLat && userLng && data) {
        return data.map((entrance: PlaceEntrance) => ({
          ...entrance,
          distance: calculateDistance(userLat, userLng, entrance.lat, entrance.lng),
        }));
      }

      return data as PlaceEntrance[];
    },
    enabled: !!placeId,
  });
}

/**
 * Get the main/primary entrance for a place
 */
export function useMainEntrance(placeId: string) {
  return useQuery({
    queryKey: ['main-entrance', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_entrances')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_main', true)
        .single();

      if (error) throw error;
      return data as PlaceEntrance;
    },
    enabled: !!placeId,
  });
}

/**
 * Get the closest entrance to user's current location
 */
export function useClosestEntrance(
  placeId: string,
  userLat?: number,
  userLng?: number
) {
  return useQuery({
    queryKey: ['closest-entrance', placeId, userLat, userLng],
    queryFn: async () => {
      if (!userLat || !userLng) return null;

      const { data, error } = await supabase
        .from('place_entrances')
        .select('*')
        .eq('place_id', placeId);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Calculate distances and find closest
      const entrancesWithDistance = data.map((entrance: PlaceEntrance) => ({
        ...entrance,
        distance: calculateDistance(userLat, userLng, entrance.lat, entrance.lng),
      }));

      // Sort by distance and return closest
      entrancesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      return entrancesWithDistance[0] as PlaceEntrance;
    },
    enabled: !!placeId && !!userLat && !!userLng,
  });
}

/**
 * Add a new entrance to a place
 */
export function useAddEntrance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entrance: Omit<PlaceEntrance, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('place_entrances')
        .insert([entrance])
        .select()
        .single();

      if (error) throw error;
      return data as PlaceEntrance;
    },
    onSuccess: (data) => {
      // Invalidate entrance queries for this place
      queryClient.invalidateQueries({ queryKey: ['entrances', data.place_id] });
      queryClient.invalidateQueries({ queryKey: ['main-entrance', data.place_id] });
      queryClient.invalidateQueries({ queryKey: ['closest-entrance', data.place_id] });
    },
  });
}

/**
 * Update an existing entrance
 */
export function useUpdateEntrance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PlaceEntrance>;
    }) => {
      const { data, error } = await supabase
        .from('place_entrances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PlaceEntrance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entrances', data.place_id] });
      queryClient.invalidateQueries({ queryKey: ['main-entrance', data.place_id] });
      queryClient.invalidateQueries({ queryKey: ['closest-entrance', data.place_id] });
    },
  });
}

/**
 * Delete an entrance
 */
export function useDeleteEntrance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, placeId }: { id: string; placeId: string }) => {
      const { error } = await supabase
        .from('place_entrances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entrances', data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['main-entrance', data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['closest-entrance', data.placeId] });
    },
  });
}

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
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

/**
 * Helper: Format distance for display
 */
export function formatDistance(miles?: number): string {
  if (!miles) return '';
  if (miles < 0.1) return 'Less than 0.1 mi';
  if (miles < 1) return `${miles.toFixed(1)} mi`;
  return `${miles.toFixed(1)} mi`;
}

/**
 * Helper: Get entrance type icon/emoji
 */
export function getEntranceIcon(label: string): string {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('main') || lowerLabel.includes('front')) return '🚪';
  if (lowerLabel.includes('rv') || lowerLabel.includes('truck')) return '🚐';
  if (lowerLabel.includes('delivery') || lowerLabel.includes('pickup')) return '📦';
  if (lowerLabel.includes('service') || lowerLabel.includes('employee')) return '🔧';
  if (lowerLabel.includes('emergency') || lowerLabel.includes('ambulance')) return '🚨';
  if (lowerLabel.includes('pedestrian') || lowerLabel.includes('walk')) return '🚶';
  if (lowerLabel.includes('side') || lowerLabel.includes('back')) return '🚪';
  
  return '📍'; // Default
}

/**
 * Helper: Get entrance type color
 */
export function getEntranceColor(label: string): string {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('main') || lowerLabel.includes('front')) return '#10B981'; // Green
  if (lowerLabel.includes('rv') || lowerLabel.includes('truck')) return '#3B82F6'; // Blue
  if (lowerLabel.includes('delivery') || lowerLabel.includes('pickup')) return '#F59E0B'; // Orange
  if (lowerLabel.includes('service') || lowerLabel.includes('employee')) return '#6B7280'; // Gray
  if (lowerLabel.includes('emergency') || lowerLabel.includes('ambulance')) return '#EF4444'; // Red
  if (lowerLabel.includes('pedestrian') || lowerLabel.includes('walk')) return '#8B5CF6'; // Purple
  
  return '#6B7280'; // Default gray
}
