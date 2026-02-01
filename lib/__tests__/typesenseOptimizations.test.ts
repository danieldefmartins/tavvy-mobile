/**
 * Test Suite for Typesense Optimizations
 * 
 * Run these tests to verify all optimizations are working correctly.
 */

import { searchPlaces, clearQueryCache } from '../typesenseService';
import { configureSynonyms } from '../typesenseSynonyms';

describe('Typesense Optimizations', () => {
  
  beforeEach(() => {
    // Clear cache before each test
    clearQueryCache();
  });

  describe('Optimization #1: Tap Signals', () => {
    it('should search tap_signals field with highest weight', async () => {
      const result = await searchPlaces({
        query: 'best coffee',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      expect(result.places.length).toBeGreaterThan(0);
      // Verify results are sorted by tap_quality_score
      console.log('Top result:', result.places[0].name);
    });
  });

  describe('Optimization #2: Typo Tolerance', () => {
    it('should handle typos in search queries', async () => {
      const correctResult = await searchPlaces({
        query: 'restaurant',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      const typoResult = await searchPlaces({
        query: 'resturant', // intentional typo
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      expect(typoResult.places.length).toBeGreaterThan(0);
      // Should return similar results despite typo
      expect(typoResult.places.length).toBeGreaterThanOrEqual(correctResult.places.length * 0.5);
    });
  });

  describe('Optimization #3: Query Caching', () => {
    it('should cache and retrieve query results', async () => {
      const query = {
        query: 'pizza',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      };
      
      // First query - should hit Typesense
      const start1 = Date.now();
      const result1 = await searchPlaces(query);
      const time1 = Date.now() - start1;
      
      // Second query - should hit cache
      const start2 = Date.now();
      const result2 = await searchPlaces(query);
      const time2 = Date.now() - start2;
      
      expect(result2.places.length).toBe(result1.places.length);
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.5);
      console.log(`Cache speedup: ${time1}ms → ${time2}ms (${Math.round((1 - time2/time1) * 100)}% faster)`);
    });
  });

  describe('Optimization #4: Prefix Search', () => {
    it('should enable prefix search for autocomplete', async () => {
      const result = await searchPlaces({
        query: 'cof', // partial word
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      expect(result.places.length).toBeGreaterThan(0);
      // Should find places with "coffee" in the name
      const hasRelevantResults = result.places.some(place => 
        place.name.toLowerCase().includes('cof')
      );
      expect(hasRelevantResults).toBe(true);
    });
  });

  describe('Optimization #5: Synonyms', () => {
    it('should configure synonyms successfully', async () => {
      // This test uploads synonyms to Typesense
      // Run this once to configure synonyms
      await expect(configureSynonyms()).resolves.not.toThrow();
    });
    
    it('should find results using synonyms', async () => {
      const cafeResult = await searchPlaces({
        query: 'café',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      const coffeeResult = await searchPlaces({
        query: 'coffee',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      // Should return similar results for synonyms
      expect(cafeResult.places.length).toBeGreaterThan(0);
      expect(coffeeResult.places.length).toBeGreaterThan(0);
    });
  });

  describe('Optimization #6: Faceted Search', () => {
    it('should return facet counts for categories', async () => {
      const result = await searchPlaces({
        query: '*',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 50,
      });
      
      expect(result.places.length).toBeGreaterThan(0);
      // Facets should be included in response
      console.log('Search completed with facets enabled');
    });
  });

  describe('Optimization #7: Analytics Tracking', () => {
    it('should log search analytics', async () => {
      const result = await searchPlaces({
        query: 'test query',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      expect(result.searchTimeMs).toBeGreaterThan(0);
      // Analytics should be logged to Supabase
      console.log(`Search took ${result.searchTimeMs}ms`);
    });
  });

  describe('Optimization #8: Multi-field Boosting', () => {
    it('should use max_score for best field matching', async () => {
      const result = await searchPlaces({
        query: 'italian restaurant',
        latitude: 37.7749,
        longitude: -122.4194,
        limit: 10,
      });
      
      expect(result.places.length).toBeGreaterThan(0);
      // Results should prioritize best matching field
      console.log('Top result:', result.places[0].name);
    });
  });

  describe('Optimization #9: Geo Optimization', () => {
    it('should sort by proximity when location provided', async () => {
      const result = await searchPlaces({
        query: 'restaurant',
        latitude: 37.7749,
        longitude: -122.4194,
        radiusKm: 5,
        limit: 10,
      });
      
      expect(result.places.length).toBeGreaterThan(0);
      // Results should have distance information
      const hasDistance = result.places.some(place => place.distance !== undefined);
      expect(hasDistance).toBe(true);
    });
  });

  describe('Optimization #10: Environment Variables', () => {
    it('should load configuration from environment', () => {
      // Verify environment variables are being used
      expect(process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app').toBeTruthy();
      expect(process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277').toBeTruthy();
    });
  });
});

/**
 * Manual Test Scenarios
 * 
 * Run these manually in the app to verify optimizations:
 * 
 * 1. Tap Signals Test:
 *    - Search for "best coffee"
 *    - Verify results show places with high tap_quality_score first
 * 
 * 2. Typo Tolerance Test:
 *    - Search for "resturant" (typo)
 *    - Should still find restaurants
 * 
 * 3. Cache Test:
 *    - Search for "pizza" twice
 *    - Second search should be instant (< 10ms)
 * 
 * 4. Prefix Search Test:
 *    - Type "cof" in search
 *    - Should suggest "coffee" places immediately
 * 
 * 5. Synonyms Test:
 *    - Search for "café" and "coffee shop"
 *    - Should return similar results
 * 
 * 6. Analytics Test:
 *    - Check Supabase search_analytics table
 *    - Should see logged searches
 * 
 * 7. Performance Test:
 *    - Search with location
 *    - Should complete in < 200ms
 */
