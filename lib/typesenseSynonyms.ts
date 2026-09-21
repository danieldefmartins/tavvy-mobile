/**
 * Typesense Synonyms Configuration
 * 
 * This file contains synonym definitions for better search understanding.
 * Upload these to Typesense to improve search results.
 */

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

/** Synonyms are administered only by trusted server tooling, never by the app. */
export async function configureSynonyms(): Promise<never> {
  throw new Error('Synonym administration is unavailable in the mobile app. Use trusted server tooling.');
}

export async function clearSynonyms(): Promise<never> {
  throw new Error('Synonym administration is unavailable in the mobile app. Use trusted server tooling.');
}
