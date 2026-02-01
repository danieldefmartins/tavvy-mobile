/**
 * Typesense Synonyms Configuration
 * 
 * This file contains synonym definitions for better search understanding.
 * Upload these to Typesense to improve search results.
 */

// Load from environment variables (with fallback for development)
const TYPESENSE_HOST = process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = process.env.EXPO_PUBLIC_TYPESENSE_PORT || '443';
const TYPESENSE_PROTOCOL = process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_API_KEY = process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

/**
 * Synonym definitions for place search
 */
export const PLACE_SYNONYMS = [
  {
    id: 'coffee-synonyms',
    root: 'coffee',
    synonyms: ['café', 'coffeehouse', 'coffee shop', 'espresso bar'],
  },
  {
    id: 'restaurant-synonyms',
    root: 'restaurant',
    synonyms: ['eatery', 'diner', 'bistro', 'dining', 'food'],
  },
  {
    id: 'bar-synonyms',
    root: 'bar',
    synonyms: ['pub', 'tavern', 'lounge', 'nightclub', 'club'],
  },
  {
    id: 'gym-synonyms',
    root: 'gym',
    synonyms: ['fitness center', 'health club', 'workout', 'fitness'],
  },
  {
    id: 'hotel-synonyms',
    root: 'hotel',
    synonyms: ['motel', 'inn', 'lodge', 'accommodation', 'lodging'],
  },
  {
    id: 'store-synonyms',
    root: 'store',
    synonyms: ['shop', 'boutique', 'retail', 'market'],
  },
  {
    id: 'park-synonyms',
    root: 'park',
    synonyms: ['garden', 'green space', 'playground', 'recreation area'],
  },
  {
    id: 'salon-synonyms',
    root: 'salon',
    synonyms: ['hair salon', 'beauty salon', 'barber', 'hairdresser'],
  },
  {
    id: 'spa-synonyms',
    root: 'spa',
    synonyms: ['wellness center', 'massage', 'beauty spa'],
  },
  {
    id: 'theater-synonyms',
    root: 'theater',
    synonyms: ['cinema', 'movie theater', 'theatre', 'movies'],
  },
];

/**
 * Configure synonyms in Typesense
 * Run this once to upload all synonyms
 */
export async function configureSynonyms(): Promise<void> {
  console.log('[typesense] Configuring synonyms...');
  
  for (const synonym of PLACE_SYNONYMS) {
    try {
      const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/synonyms/${synonym.id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          synonyms: [synonym.root, ...synonym.synonyms],
        }),
      });
      
      if (response.ok) {
        console.log(`[typesense] Synonym configured: ${synonym.id}`);
      } else {
        const error = await response.text();
        console.warn(`[typesense] Failed to configure synonym ${synonym.id}:`, error);
      }
    } catch (error) {
      console.error(`[typesense] Error configuring synonym ${synonym.id}:`, error);
    }
  }
  
  console.log('[typesense] Synonyms configuration complete!');
}

/**
 * Delete all synonyms (useful for testing)
 */
export async function clearSynonyms(): Promise<void> {
  console.log('[typesense] Clearing synonyms...');
  
  for (const synonym of PLACE_SYNONYMS) {
    try {
      const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/synonyms/${synonym.id}`;
      
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
      });
      
      console.log(`[typesense] Synonym deleted: ${synonym.id}`);
    } catch (error) {
      console.error(`[typesense] Error deleting synonym ${synonym.id}:`, error);
    }
  }
  
  console.log('[typesense] Synonyms cleared!');
}
