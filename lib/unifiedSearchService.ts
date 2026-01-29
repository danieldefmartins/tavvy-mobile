/**
 * Unified Search Service
 * Search across all Tavvy content types: Places, Events, Articles, Universes, Rides
 * 
 * Features:
 * - Multi-collection search
 * - Unified results interface
 * - Type-specific ranking
 * - Tap-based relevance
 */

const TYPESENSE_HOST = 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = '443';
const TYPESENSE_PROTOCOL = 'https';
const TYPESENSE_API_KEY = '231eb42383d0a3a28d0b6f5b9a1c4e7f8';

export type ContentType = 'place' | 'event' | 'article' | 'universe' | 'ride';

export interface UnifiedSearchParams {
  query: string;
  types?: ContentType[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: Record<string, any>;
  relevanceScore: number;
  distance_km?: number;
}

export interface UnifiedSearchResponse {
  results: SearchResult[];
  resultsByType: Record<ContentType, SearchResult[]>;
  totalFound: number;
  searchTimeMs: number;
}

/**
 * Search across all content types
 */
export async function searchAll(
  params: UnifiedSearchParams
): Promise<UnifiedSearchResponse> {
  const {
    query,
    types = ['place', 'event', 'article'],
    latitude,
    longitude,
    radiusKm = 50,
    limit = 50,
  } = params;

  const startTime = Date.now();
  const searches: Promise<any>[] = [];
  const searchTypes: ContentType[] = [];

  // Search places
  if (types.includes('place')) {
    searchTypes.push('place');
    searches.push(
      searchTypesense('places', query, {
        latitude,
        longitude,
        radiusKm,
        limit: Math.ceil(limit / types.length),
      })
    );
  }

  // Search events
  if (types.includes('event')) {
    searchTypes.push('event');
    searches.push(
      searchTypesense('events', query, {
        latitude,
        longitude,
        radiusKm,
        limit: Math.ceil(limit / types.length),
      })
    );
  }

  // Search articles
  if (types.includes('article')) {
    searchTypes.push('article');
    searches.push(
      searchTypesense('articles', query, {
        limit: Math.ceil(limit / types.length),
      })
    );
  }

  try {
    const results = await Promise.all(searches);
    
    // Transform and merge results
    const allResults: SearchResult[] = [];
    const resultsByType: Record<ContentType, SearchResult[]> = {
      place: [],
      event: [],
      article: [],
      universe: [],
      ride: [],
    };

    for (let i = 0; i < results.length; i++) {
      const type = searchTypes[i];
      const data = results[i];

      if (!data || !data.hits) continue;

      const transformed = data.hits.map((hit: any) => 
        transformResult(hit, type)
      );

      allResults.push(...transformed);
      resultsByType[type] = transformed;
    }

    // Sort by relevance score
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const searchTimeMs = Date.now() - startTime;

    console.log(`[unifiedSearch] ⚡ Found ${allResults.length} results in ${searchTimeMs}ms`);

    return {
      results: allResults.slice(0, limit),
      resultsByType,
      totalFound: allResults.length,
      searchTimeMs,
    };
  } catch (error) {
    console.error('[unifiedSearch] ❌ Search failed:', error);
    return {
      results: [],
      resultsByType: {
        place: [],
        event: [],
        article: [],
        universe: [],
        ride: [],
      },
      totalFound: 0,
      searchTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Search a specific Typesense collection
 */
async function searchTypesense(
  collection: string,
  query: string,
  options: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    limit?: number;
  }
): Promise<any> {
  const { latitude, longitude, radiusKm = 50, limit = 20 } = options;

  const searchParams: any = {
    q: query,
    per_page: limit,
  };

  // Collection-specific search fields
  if (collection === 'places') {
    searchParams.query_by = 'name,address,city,categories';
    searchParams.query_by_weights = '10,5,3,2';
    searchParams.sort_by = '_text_match:desc,tap_quality_score:desc,popularity:desc';
  } else if (collection === 'events') {
    searchParams.query_by = 'title,description,venue_name,city';
    searchParams.query_by_weights = '10,5,3,2';
    searchParams.sort_by = '_text_match:desc,tap_quality_score:desc,popularity:desc,start_time:asc';
  } else if (collection === 'articles') {
    searchParams.query_by = 'title,excerpt,content,seo_keywords';
    searchParams.query_by_weights = '10,5,3,2';
    searchParams.sort_by = '_text_match:desc,engagement_score:desc,published_at:desc';
  }

  // Geo-search for places and events
  if ((collection === 'places' || collection === 'events') && latitude && longitude) {
    searchParams.filter_by = `location:(${latitude},${longitude},${radiusKm} km)`;
  }

  const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/${collection}/documents/search`;
  const queryString = new URLSearchParams(searchParams).toString();

  const response = await fetch(`${url}?${queryString}`, {
    headers: {
      'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Typesense error: ${response.status}`);
  }

  return response.json();
}

/**
 * Transform Typesense result to unified format
 */
function transformResult(hit: any, type: ContentType): SearchResult {
  const doc = hit.document;
  const score = hit.text_match_score || 0;

  if (type === 'place') {
    return {
      id: doc.id,
      type: 'place',
      title: doc.name,
      description: doc.address,
      imageUrl: doc.photo_url,
      location: doc.location ? {
        latitude: doc.location[0],
        longitude: doc.location[1],
        address: doc.address,
      } : undefined,
      metadata: {
        categories: doc.categories,
        phone: doc.tel,
        website: doc.website,
      },
      relevanceScore: score + (doc.tap_quality_score || 0) * 10,
      distance_km: hit.geo_distance_meters ? hit.geo_distance_meters / 1000 : undefined,
    };
  }

  if (type === 'event') {
    return {
      id: doc.id,
      type: 'event',
      title: doc.title,
      description: doc.description,
      imageUrl: doc.image_url,
      location: doc.location ? {
        latitude: doc.location[0],
        longitude: doc.location[1],
        address: doc.venue_name,
      } : undefined,
      metadata: {
        category: doc.category,
        start_time: doc.start_time,
        price_min: doc.price_min,
        is_free: doc.is_free,
      },
      relevanceScore: score + (doc.tap_quality_score || 0) * 10,
      distance_km: hit.geo_distance_meters ? hit.geo_distance_meters / 1000 : undefined,
    };
  }

  if (type === 'article') {
    return {
      id: doc.id,
      type: 'article',
      title: doc.title,
      description: doc.excerpt,
      imageUrl: doc.cover_image_url,
      metadata: {
        author_name: doc.author_name,
        category_name: doc.category_name,
        read_time_minutes: doc.read_time_minutes,
        love_count: doc.love_count,
      },
      relevanceScore: score + (doc.engagement_score || 0),
    };
  }

  return {
    id: doc.id,
    type,
    title: doc.name || doc.title,
    relevanceScore: score,
  };
}

/**
 * Quick search for autocomplete (searches all types)
 */
export async function quickSearch(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const result = await searchAll({
    query,
    types: ['place', 'event', 'article'],
    limit,
  });

  return result.results;
}
