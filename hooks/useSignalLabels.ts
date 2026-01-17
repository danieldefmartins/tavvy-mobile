// Hook to fetch and cache signal labels for display
// Used by HomeScreen and PlaceDetailsScreen to show proper signal names

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SignalLabel {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: 'best_for' | 'vibe' | 'heads_up';
  color: string;
}

// Global cache for signal labels
let signalLabelCache: Map<string, SignalLabel> = new Map();
let cacheLoaded = false;

/**
 * Hook to get signal labels from cache or database
 */
export function useSignalLabels() {
  const [labels, setLabels] = useState<Map<string, SignalLabel>>(signalLabelCache);
  const [isLoading, setIsLoading] = useState(!cacheLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cacheLoaded) {
      loadSignalLabels();
    }
  }, []);

  const loadSignalLabels = async () => {
    try {
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('review_items')
        .select('id, slug, label, icon_emoji, signal_type, color')
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching signal labels:', fetchError);
        setError(fetchError.message);
        return;
      }

      const newCache = new Map<string, SignalLabel>();
      (data || []).forEach((item: SignalLabel) => {
        newCache.set(item.id, item);
        // Also cache by slug for backward compatibility
        newCache.set(item.slug, item);
      });

      signalLabelCache = newCache;
      cacheLoaded = true;
      setLabels(newCache);
      setError(null);
    } catch (err) {
      console.error('Error loading signal labels:', err);
      setError('Failed to load signal labels');
    } finally {
      setIsLoading(false);
    }
  };

  const getLabel = useCallback((signalId: string): string => {
    const signal = labels.get(signalId);
    if (signal) return signal.label;
    
    // Fallback: convert slug to title case
    return signalId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [labels]);

  const getSignal = useCallback((signalId: string): SignalLabel | undefined => {
    return labels.get(signalId);
  }, [labels]);

  const getSignalType = useCallback((signalId: string): 'best_for' | 'vibe' | 'heads_up' | null => {
    const signal = labels.get(signalId);
    return signal?.signal_type || null;
  }, [labels]);

  const getColor = useCallback((signalId: string): string => {
    const signal = labels.get(signalId);
    if (signal?.color) return signal.color;
    
    // Fallback colors based on signal type
    const signalType = getSignalType(signalId);
    if (signalType === 'best_for') return '#0A84FF';
    if (signalType === 'heads_up') return '#FF9500';
    return '#8B5CF6'; // Purple - The Vibe
  }, [labels, getSignalType]);

  const getEmoji = useCallback((signalId: string): string => {
    const signal = labels.get(signalId);
    return signal?.icon_emoji || '📍';
  }, [labels]);

  const refreshCache = useCallback(async () => {
    cacheLoaded = false;
    await loadSignalLabels();
  }, []);

  return {
    labels,
    isLoading,
    error,
    getLabel,
    getSignal,
    getSignalType,
    getColor,
    getEmoji,
    refreshCache,
  };
}

/**
 * Get signal label synchronously from cache (for use outside hooks)
 * Returns the signalId as fallback if not found
 */
export function getSignalLabelSync(signalId: string): string {
  const signal = signalLabelCache.get(signalId);
  if (signal) return signal.label;
  
  // Fallback: convert slug to title case
  return signalId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get signal color synchronously from cache
 */
export function getSignalColorSync(signalId: string): string {
  const signal = signalLabelCache.get(signalId);
  if (signal?.color) return signal.color;
  
  // Fallback based on signal type
  if (signal?.signal_type === 'best_for') return '#0A84FF';
  if (signal?.signal_type === 'heads_up') return '#FF9500';
  return '#8B5CF6'; // Purple - The Vibe
}

/**
 * Get signal type synchronously from cache
 */
export function getSignalTypeSync(signalId: string): 'best_for' | 'vibe' | 'heads_up' | null {
  const signal = signalLabelCache.get(signalId);
  return signal?.signal_type || null;
}

/**
 * Preload signal labels (call early in app lifecycle)
 */
export async function preloadSignalLabels(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const { data, error } = await supabase
      .from('review_items')
      .select('id, slug, label, icon_emoji, signal_type, color')
      .eq('is_active', true);

    if (error) {
      console.error('Error preloading signal labels:', error);
      return;
    }

    const newCache = new Map<string, SignalLabel>();
    (data || []).forEach((item: SignalLabel) => {
      newCache.set(item.id, item);
      newCache.set(item.slug, item);
    });

    signalLabelCache = newCache;
    cacheLoaded = true;
  } catch (err) {
    console.error('Error preloading signal labels:', err);
  }
}

/**
 * Clear the signal label cache
 */
export function clearSignalLabelCache(): void {
  signalLabelCache = new Map();
  cacheLoaded = false;
}