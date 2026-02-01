/**
 * Search Analytics Tracking
 * 
 * Tracks search queries, results, and performance metrics
 * for data-driven optimization.
 */

import { supabase } from './supabaseClient';

export interface SearchAnalyticsData {
  query: string;
  resultsCount: number;
  searchTimeMs: number;
  hasLocation?: boolean;
  latitude?: number;
  longitude?: number;
  filters?: string[];
  error?: string;
  source?: 'typesense' | 'supabase' | 'hybrid';
}

/**
 * Log search analytics to Supabase
 */
export async function logSearchAnalytics(data: SearchAnalyticsData): Promise<void> {
  try {
    const { error } = await supabase
      .from('search_analytics')
      .insert({
        query: data.query,
        results_count: data.resultsCount,
        search_time_ms: data.searchTimeMs,
        has_location: data.hasLocation || false,
        latitude: data.latitude,
        longitude: data.longitude,
        filters: data.filters,
        error: data.error,
        source: data.source || 'typesense',
        timestamp: new Date().toISOString(),
      });
    
    if (error) {
      console.warn('[searchAnalytics] Failed to log analytics:', error);
    }
  } catch (error) {
    // Silently fail - don't break search if analytics fails
    console.warn('[searchAnalytics] Exception logging analytics:', error);
  }
}

/**
 * Get top searched queries
 */
export async function getTopSearchQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('query')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(1000);
    
    if (error || !data) {
      console.warn('[searchAnalytics] Failed to get top queries:', error);
      return [];
    }
    
    // Count occurrences
    const queryCounts = new Map<string, number>();
    data.forEach((row: any) => {
      const count = queryCounts.get(row.query) || 0;
      queryCounts.set(row.query, count + 1);
    });
    
    // Sort by count
    const sorted = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sorted;
  } catch (error) {
    console.error('[searchAnalytics] Exception getting top queries:', error);
    return [];
  }
}

/**
 * Get failed searches (no results)
 */
export async function getFailedSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('query')
      .eq('results_count', 0)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(1000);
    
    if (error || !data) {
      console.warn('[searchAnalytics] Failed to get failed searches:', error);
      return [];
    }
    
    // Count occurrences
    const queryCounts = new Map<string, number>();
    data.forEach((row: any) => {
      const count = queryCounts.get(row.query) || 0;
      queryCounts.set(row.query, count + 1);
    });
    
    // Sort by count
    const sorted = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sorted;
  } catch (error) {
    console.error('[searchAnalytics] Exception getting failed searches:', error);
    return [];
  }
}

/**
 * Get average search performance metrics
 */
export async function getSearchMetrics(): Promise<{
  avgSearchTimeMs: number;
  avgResultsCount: number;
  successRate: number;
  totalSearches: number;
}> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('search_time_ms, results_count')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
    
    if (error || !data || data.length === 0) {
      return {
        avgSearchTimeMs: 0,
        avgResultsCount: 0,
        successRate: 0,
        totalSearches: 0,
      };
    }
    
    const totalSearches = data.length;
    const successfulSearches = data.filter((row: any) => row.results_count > 0).length;
    const avgSearchTimeMs = data.reduce((sum: number, row: any) => sum + row.search_time_ms, 0) / totalSearches;
    const avgResultsCount = data.reduce((sum: number, row: any) => sum + row.results_count, 0) / totalSearches;
    const successRate = (successfulSearches / totalSearches) * 100;
    
    return {
      avgSearchTimeMs: Math.round(avgSearchTimeMs),
      avgResultsCount: Math.round(avgResultsCount),
      successRate: Math.round(successRate),
      totalSearches,
    };
  } catch (error) {
    console.error('[searchAnalytics] Exception getting metrics:', error);
    return {
      avgSearchTimeMs: 0,
      avgResultsCount: 0,
      successRate: 0,
      totalSearches: 0,
    };
  }
}
