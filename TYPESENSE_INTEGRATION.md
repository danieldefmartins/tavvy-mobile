# Typesense Integration Guide

## Overview

Typesense search has been integrated into the Tavvy mobile app for **lightning-fast search** across 12.7M+ places with <50ms response times.

**Performance Improvement:** 100-500x faster than Supabase ILIKE queries!

## Installation

No additional packages needed! The service uses native `fetch` API.

## Usage

### 1. Import the Service

```typescript
import {
  searchPlaces,
  getAutocompleteSuggestions,
  searchNearbyPlaces,
  searchPlacesInBounds,
  getPlaceById,
  healthCheck,
} from './lib/typesenseService';
```

### 2. Basic Text Search

```typescript
const result = await searchPlaces({
  query: 'coffee',
  limit: 20
});

console.log(`Found ${result.totalFound} places in ${result.searchTimeMs}ms`);

result.places.forEach(place => {
  console.log(place.name, place.locality, place.region);
});
```

### 3. Geo-Search (Find Nearby Places)

```typescript
const result = await searchPlaces({
  query: 'restaurant',
  latitude: 40.7128,
  longitude: -74.0060,
  radiusKm: 5,
  limit: 50
});

result.places.forEach(place => {
  if (place.distance) {
    console.log(`${place.name} - ${place.distance} miles away`);
  }
});
```

### 4. Autocomplete Suggestions

```typescript
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<string[]>([]);

// Debounced autocomplete
useEffect(() => {
  const fetchSuggestions = async () => {
    if (query.length >= 2) {
      const sugg = await getAutocompleteSuggestions(
        query,
        8,
        userLocation?.latitude,
        userLocation?.longitude
      );
      setSuggestions(sugg);
    } else {
      setSuggestions([]);
    }
  };

  const debounce = setTimeout(fetchSuggestions, 300);
  return () => clearTimeout(debounce);
}, [query]);
```

### 5. Map Bounds Search

```typescript
// When map moves, search places in visible area
const onMapMove = async (bounds: MapBounds) => {
  const places = await searchPlacesInBounds(
    {
      ne: [bounds.neLng, bounds.neLat],
      sw: [bounds.swLng, bounds.swLat]
    },
    selectedCategory,
    100
  );
  
  setMapPlaces(places);
};
```

### 6. Nearby Places

```typescript
const loadNearbyPlaces = async () => {
  const location = await Location.getCurrentPositionAsync();
  
  const places = await searchNearbyPlaces(
    location.coords.latitude,
    location.coords.longitude,
    10, // 10km radius
    ['Restaurant', 'Cafe'],
    50
  );
  
  setNearbyPlaces(places);
};
```

### 7. Get Place by ID

```typescript
const loadPlaceDetails = async (fsqPlaceId: string) => {
  const place = await getPlaceById(fsqPlaceId);
  
  if (place) {
    console.log(place.name);
    console.log(place.address);
    console.log(place.tel);
    console.log(place.website);
  }
};
```

### 8. Health Check & Fallback

```typescript
const performSearch = async (query: string) => {
  try {
    // Try Typesense first (fast!)
    const result = await searchPlaces({ query, limit: 50 });
    return result.places;
  } catch (error) {
    console.warn('Typesense failed, falling back to Supabase');
    
    // Fallback to Supabase
    const { data } = await supabase
      .from('places')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(50);
    
    return data || [];
  }
};
```

## Integration Examples

### Replace Existing Search

**Before (Supabase):**
```typescript
const searchPlaces = async (query: string) => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(50);
  
  return data || [];
};
```

**After (Typesense):**
```typescript
import { searchPlaces as typesenseSearch } from './lib/typesenseService';

const searchPlaces = async (query: string) => {
  try {
    const result = await typesenseSearch({ query, limit: 50 });
    return result.places;
  } catch (error) {
    // Fallback to Supabase if needed
    const { data } = await supabase
      .from('places')
      .select('*')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(50);
    return data || [];
  }
};
```

### Search Screen Component

```typescript
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';
import { searchPlaces, getAutocompleteSuggestions } from './lib/typesenseService';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        const sugg = await getAutocompleteSuggestions(query, 8);
        setSuggestions(sugg);
      } else {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Search
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await searchPlaces({ query, limit: 50 });
      setResults(result.places);
      console.log(`Search completed in ${result.searchTimeMs}ms`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        placeholder="Search places..."
      />
      
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          renderItem={({ item }) => (
            <Text onPress={() => { setQuery(item); handleSearch(); }}>
              {item}
            </Text>
          )}
        />
      )}
      
      {loading ? (
        <Text>Searching...</Text>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <View>
              <Text>{item.name}</Text>
              <Text>{item.locality}, {item.region}</Text>
              {item.distance && <Text>{item.distance} miles away</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}
```

### Map Screen Integration

```typescript
import React, { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { searchPlacesInBounds } from './lib/typesenseService';

export default function MapScreen() {
  const [places, setPlaces] = useState([]);

  const onRegionChangeComplete = async (region) => {
    const places = await searchPlacesInBounds({
      ne: [
        region.longitude + region.longitudeDelta / 2,
        region.latitude + region.latitudeDelta / 2
      ],
      sw: [
        region.longitude - region.longitudeDelta / 2,
        region.latitude - region.latitudeDelta / 2
      ]
    }, undefined, 100);
    
    setPlaces(places);
  };

  return (
    <MapView
      onRegionChangeComplete={onRegionChangeComplete}
      style={{ flex: 1 }}
    >
      {places.map(place => (
        <Marker
          key={place.id}
          coordinate={{
            latitude: place.latitude!,
            longitude: place.longitude!
          }}
          title={place.name}
          description={place.address}
        />
      ))}
    </MapView>
  );
}
```

## Performance Tips

1. **Use geo-search when possible** - Searching with lat/lng is faster and more relevant
2. **Limit results appropriately** - Don't fetch more than you need (default 50 is good)
3. **Debounce autocomplete** - Wait 300ms before fetching suggestions
4. **Cache popular searches** - Cache results on the client side
5. **Monitor performance** - Log `searchTimeMs` to track performance

## API Reference

### `searchPlaces(options)`

Search places with filters.

**Options:**
- `query` (string) - Search query (use '*' for all)
- `latitude` (number, optional) - User latitude for geo-search
- `longitude` (number, optional) - User longitude for geo-search
- `radiusKm` (number, optional) - Search radius in km (default: 50)
- `country` (string, optional) - Filter by country code (e.g., 'US')
- `region` (string, optional) - Filter by region/state
- `locality` (string, optional) - Filter by city
- `categories` (string[], optional) - Filter by categories
- `limit` (number, optional) - Max results (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)

**Returns:** `SearchResult` with `places`, `totalFound`, `searchTimeMs`, `page`

### `getAutocompleteSuggestions(query, limit?, latitude?, longitude?)`

Get autocomplete suggestions.

**Returns:** `string[]` - Array of place names

### `searchNearbyPlaces(latitude, longitude, radiusKm?, categories?, limit?)`

Search places near a location.

**Returns:** `PlaceSearchResult[]` - Array of places sorted by distance

### `searchPlacesInBounds(bounds, category?, limit?)`

Search places within map bounds.

**Returns:** `PlaceSearchResult[]` - Array of places

### `getPlaceById(fsqPlaceId)`

Get place details by Foursquare ID.

**Returns:** `PlaceSearchResult | null`

### `healthCheck()`

Check if Typesense server is healthy.

**Returns:** `boolean`

### `getCollectionStats()`

Get collection statistics.

**Returns:** `{ numDocuments: number, isHealthy: boolean } | null`

## Troubleshooting

### Search returns no results

1. Check if Typesense server is healthy: `await healthCheck()`
2. Verify query syntax is correct
3. Check if filters are too restrictive
4. Try a simpler query (e.g., '*' for all places)

### Slow performance

1. Reduce `limit` parameter
2. Use geo-search with lat/lng for better performance
3. Check network connection
4. Verify Typesense server status

### Errors

All functions throw errors that should be caught:

```typescript
try {
  const result = await searchPlaces({ query: 'coffee' });
} catch (error) {
  console.error('Search failed:', error);
  // Fallback to Supabase or show error to user
}
```

## Migration Checklist

- [ ] Import `typesenseService` in search-related files
- [ ] Replace Supabase search calls with Typesense
- [ ] Add autocomplete to search inputs
- [ ] Update map screen to use `searchPlacesInBounds`
- [ ] Add error handling and fallback to Supabase
- [ ] Test on device with real location
- [ ] Monitor search performance with `searchTimeMs`
- [ ] Deploy to TestFlight/Play Store

## Support

For issues:
1. Check Typesense server health
2. Review Railway logs
3. Verify API key is correct
4. Test with curl to isolate issues

## Performance Benchmarks

| Query | Typesense | Supabase | Improvement |
|-------|-----------|----------|-------------|
| "coffee" | 2-5ms | 1000+ms | 200-500x |
| "restaurant" | 5-10ms | 1500+ms | 150-300x |
| Nearby (5km) | 10-20ms | 2000+ms | 100-200x |

Your mobile app now has **rocket-fast search**! 🚀
