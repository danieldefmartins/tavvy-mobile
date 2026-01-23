# Search Results Research Findings

## Current Implementation Analysis

### How Search Currently Works

1. **fetchPlaces() in HomeScreen.tsx (lines 871-976)**
   - Uses user location or defaults to San Francisco
   - Creates a bounding box: ±0.1 degrees lat/lng from center (approximately 7 miles)
   - Calls `fetchPlacesInBounds()` with limit of 150 places
   - Does NOT sort by distance from user

2. **fetchPlacesInBounds() in placeService.ts**
   - Queries `places` table first (canonical data)
   - Falls back to `fsq_places_raw` if results < 40
   - Uses geographic bounds filtering (minLat, maxLat, minLng, maxLng)
   - **NO distance-based sorting** - results are returned in database order
   - Limit is hardcoded to 150

### Identified Issues

#### Issue 1: No Distance-Based Sorting
The current implementation filters by bounding box but does NOT sort results by distance from user. This means:
- Places at the edge of the bounding box may appear before nearby places
- Results feel random/irrelevant to the user

#### Issue 2: Fixed Bounding Box Size
- The bounding box is always ±0.1 degrees (~7 miles)
- When user zooms out, the visible area is larger but we still only search the small box
- Need to use the actual visible map bounds

#### Issue 3: Hardcoded Result Limit
- Limit is always 150, regardless of zoom level
- When zoomed out, user expects to see more places across the larger area

#### Issue 4: No Text Search Integration
- The `handleSearchInputChange` function exists but search results don't seem to filter by text query
- Need to verify if text search is properly integrated with location

## Best Practices for Location-Based Search

### 1. Distance-Based Sorting (PostGIS)
```sql
-- Using PostGIS for distance calculation
SELECT *, 
  ST_Distance(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  ) as distance
FROM places
WHERE latitude BETWEEN minLat AND maxLat
  AND longitude BETWEEN minLng AND maxLng
ORDER BY distance ASC
LIMIT 150;
```

### 2. Haversine Formula (Client-Side)
If PostGIS is not available, calculate distance client-side:
```typescript
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### 3. Dynamic Limits Based on Zoom
- Zoom level 10-12: Show 50-100 places
- Zoom level 13-15: Show 100-200 places
- Zoom level 16+: Show 200-500 places

### 4. Text Search with Location Weighting
Combine text relevance with distance:
```sql
SELECT *, 
  (text_score * 0.6 + (1 / (1 + distance)) * 0.4) as combined_score
FROM places
WHERE name ILIKE '%query%' OR category ILIKE '%query%'
ORDER BY combined_score DESC;
```

## Recommended Fixes

### Fix 1: Add Distance Calculation and Sorting
Modify `fetchPlacesInBounds` to:
1. Calculate distance from user location for each place
2. Sort results by distance ascending
3. Return distance in PlaceCard for display

### Fix 2: Use Visible Map Bounds
When user moves/zooms the map:
1. Get the actual visible bounds from the map
2. Pass those bounds to fetchPlacesInBounds
3. Adjust limit based on zoom level

### Fix 3: Dynamic Result Limits
```typescript
function getLimitForZoom(zoom: number): number {
  if (zoom >= 16) return 500;
  if (zoom >= 14) return 300;
  if (zoom >= 12) return 200;
  return 100;
}
```

### Fix 4: Integrate Text Search with Location
When user types a search query:
1. Filter by text match (name, category, address)
2. Also filter by visible bounds
3. Sort by combined text relevance + distance score

## Implementation Priority

1. **HIGH**: Add distance calculation and sort by distance
2. **HIGH**: Use visible map bounds instead of fixed box
3. **MEDIUM**: Dynamic limits based on zoom
4. **MEDIUM**: Text search with location weighting


---

# Gas Price API Research

## Available APIs for Fuel Prices

### 1. TomTom Fuel Prices API
- **URL**: https://developer.tomtom.com/fuel-prices-api
- **Features**: 
  - Real-time fuel prices refreshed every 10 minutes
  - Fuel price in local currency and volume unit
  - Multiple fuel types supported
- **Pricing**: Enterprise only - NOT available on Freemium or Pay As You Grow
- **Coverage**: Multiple countries (need to check Market Coverage)
- **Verdict**: ❌ Not suitable - requires enterprise sales contact

### 2. HERE Fuel Prices API
- **URL**: https://www.here.com/docs/bundle/fuel-prices-api-developer-guide
- **Features**:
  - Get list of fuel stations
  - Get details for a fuel station
  - Get fuel prices by station ID
  - Stations along a route
  - Multiple fuel types and categories
- **Pricing**: Likely paid tier required
- **Coverage**: Global coverage
- **Verdict**: ⚠️ Possible option - need to check pricing

### 3. Google Places API (FuelPrice)
- **URL**: https://developers.google.com/maps/documentation/places
- **Features**:
  - FuelPrice model includes fuel type, price, and last updated time
  - Part of Places SDK
- **Pricing**: Google Maps Platform pricing
- **Verdict**: ✅ Good option if already using Google Maps

### 4. NREL Alternative Fuel Stations API
- **URL**: https://developer.nrel.gov/docs/transportation/alt-fuel-stations-v1
- **Features**:
  - Alternative fuel stations (EV, biodiesel, etc.)
  - Free government API
- **Pricing**: FREE
- **Verdict**: ⚠️ Only for alternative fuels, not regular gasoline

### 5. GasBuddy (Unofficial)
- No official public API
- Would require web scraping (not recommended)
- **Verdict**: ❌ Not available

### 6. INRIX Fuel Station API
- **URL**: https://docs.inrix.com/traffic/fuel/
- **Features**:
  - Brand, location, address
  - Fuel type and price
  - Currency used
- **Pricing**: Enterprise pricing
- **Verdict**: ⚠️ Possible option for enterprise

## Recommendation

**Best Options for Tavvy:**

1. **Google Places API** (if already using Google Maps)
   - Integrated with existing Places data
   - FuelPrice data available
   - Pay-per-use pricing

2. **HERE Fuel Prices API** (if not using Google)
   - Comprehensive fuel station data
   - Good documentation
   - Need to verify US coverage and pricing

3. **Build Custom Solution**
   - Crowdsource fuel prices from users
   - Partner with gas station chains
   - More work but no API costs

## Implementation Approach

If using Google Places API:
```typescript
// When fetching gas stations, include fuel prices in the request
const placeDetails = await placesClient.getPlaceDetails({
  placeId: gasStationId,
  fields: ['fuel_options', 'price_level']
});

// Access fuel prices
const fuelPrices = placeDetails.fuelOptions?.fuelPrices;
```

For HERE API:
```typescript
// Get fuel stations near location
const response = await fetch(
  `https://fuel.cc.api.here.com/fuel/6.0/stations.json?` +
  `prox=${lat},${lng},5000&apiKey=${HERE_API_KEY}`
);
```
