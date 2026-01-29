/**
 * Events Search Service
 * Typesense-powered fast search for events
 * 
 * Features:
 * - Text search across title, description, venue
 * - Geo-search within radius
 * - Category filtering
 * - Date range filtering
 * - Price range filtering
 * - Tap-based ranking
 */

const TYPESENSE_HOST = 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = '443';
const TYPESENSE_PROTOCOL = 'https';
const TYPESENSE_API_KEY = '231eb42383d0a3a28d0b6f5b9a1c4e7f8';
const COLLECTION_NAME = 'events';

export interface EventSearchParams {
  query?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  priceMin?: number;
  priceMax?: number;
  isFree?: boolean;
  verifiedOnly?: boolean;
  limit?: number;
}

export interface EventSearchResult {
  id: string;
  source: 'ticketmaster' | 'predicthq' | 'tavvy';
  source_id: string;
  title: string;
  description?: string;
  venue_name?: string;
  category: string;
  location?: [number, number];
  city?: string;
  state?: string;
  country?: string;
  start_time: number;
  end_time?: number;
  price_min?: number;
  price_max?: number;
  currency?: string;
  is_free?: boolean;
  popularity: number;
  tap_signals?: string[];
  tap_quality_score?: number;
  verified?: boolean;
  image_url?: string;
  url?: string;
  distance_km?: number;
}

export interface EventsSearchResponse {
  events: EventSearchResult[];
  totalFound: number;
  searchTimeMs: number;
}

/**
 * Search events using Typesense
 */
export async function searchEvents(
  params: EventSearchParams
): Promise<EventsSearchResponse> {
  const {
    query = '*',
    latitude,
    longitude,
    radiusKm = 50,
    category,
    startDate,
    endDate,
    priceMin,
    priceMax,
    isFree,
    verifiedOnly,
    limit = 50,
  } = params;

  try {
    const startTime = Date.now();

    // Build search parameters
    const searchParams: any = {
      q: query,
      query_by: 'title,description,venue_name,city',
      query_by_weights: '10,5,3,2',
      per_page: limit,
      sort_by: '_text_match:desc,tap_quality_score:desc,popularity:desc,start_time:asc',
    };

    // Geo-search if location provided
    if (latitude && longitude) {
      searchParams.filter_by = `location:(${latitude},${longitude},${radiusKm} km)`;
    }

    // Build filters
    const filters: string[] = [];
    
    if (category) {
      filters.push(`category:=${category}`);
    }
    
    if (startDate) {
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      filters.push(`start_time:>=${startTimestamp}`);
    }
    
    if (endDate) {
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      filters.push(`start_time:<=${endTimestamp}`);
    }
    
    if (priceMin !== undefined) {
      filters.push(`price_min:>=${priceMin}`);
    }
    
    if (priceMax !== undefined) {
      filters.push(`price_max:<=${priceMax}`);
    }
    
    if (isFree === true) {
      filters.push(`is_free:=true`);
    }
    
    if (verifiedOnly) {
      filters.push(`verified:=true`);
    }

    // Combine filters
    if (filters.length > 0) {
      if (searchParams.filter_by) {
        searchParams.filter_by += ' && ' + filters.join(' && ');
      } else {
        searchParams.filter_by = filters.join(' && ');
      }
    }

    // Make request to Typesense
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/${COLLECTION_NAME}/documents/search`;
    
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Typesense error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const searchTimeMs = Date.now() - startTime;

    // Transform results
    const events: EventSearchResult[] = data.hits.map((hit: any) => {
      const doc = hit.document;
      return {
        id: doc.id,
        source: doc.source,
        source_id: doc.source_id,
        title: doc.title,
        description: doc.description,
        venue_name: doc.venue_name,
        category: doc.category,
        location: doc.location,
        city: doc.city,
        state: doc.state,
        country: doc.country,
        start_time: doc.start_time,
        end_time: doc.end_time,
        price_min: doc.price_min,
        price_max: doc.price_max,
        currency: doc.currency,
        is_free: doc.is_free,
        popularity: doc.popularity,
        tap_signals: doc.tap_signals,
        tap_quality_score: doc.tap_quality_score,
        verified: doc.verified,
        image_url: doc.image_url,
        url: doc.url,
        distance_km: hit.geo_distance_meters ? hit.geo_distance_meters / 1000 : undefined,
      };
    });

    console.log(`[eventsSearchService] ⚡ Typesense: ${events.length} events in ${searchTimeMs}ms`);

    return {
      events,
      totalFound: data.found,
      searchTimeMs,
    };
  } catch (error) {
    console.error('[eventsSearchService] ❌ Typesense search failed:', error);
    
    // Return empty results on error
    return {
      events: [],
      totalFound: 0,
      searchTimeMs: 0,
    };
  }
}

/**
 * Get events happening now (within next 24 hours)
 */
export async function getHappeningNowEvents(
  latitude?: number,
  longitude?: number,
  radiusKm: number = 50,
  limit: number = 50
): Promise<EventsSearchResponse> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return searchEvents({
    query: '*',
    latitude,
    longitude,
    radiusKm,
    startDate: now,
    endDate: tomorrow,
    limit,
  });
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(
  latitude?: number,
  longitude?: number,
  radiusKm: number = 50,
  limit: number = 50
): Promise<EventsSearchResponse> {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return searchEvents({
    query: '*',
    latitude,
    longitude,
    radiusKm,
    startDate: now,
    endDate: nextWeek,
    limit,
  });
}

/**
 * Search events by category
 */
export async function searchEventsByCategory(
  category: string,
  latitude?: number,
  longitude?: number,
  radiusKm: number = 50,
  limit: number = 50
): Promise<EventsSearchResponse> {
  return searchEvents({
    query: '*',
    category,
    latitude,
    longitude,
    radiusKm,
    limit,
  });
}
