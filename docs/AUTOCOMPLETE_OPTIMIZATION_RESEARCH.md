# Autocomplete Search Optimization Research

## Summary of Best Practices from Industry Leaders

### 1. Location-Based Prioritization (Your Idea is Correct!)

**Google's Approach:**
- **Location Bias**: Pass user's coordinates + radius to prefer local results
- **Location Restriction**: Hard limit results to specific geographic area
- **Component Restrictions**: Limit to specific countries
- **Progressive expansion**: Start narrow, expand if no results

**Recommended Strategy for Tavvy:**
```
1. First: Search within user's city/state (fastest, most relevant)
2. Second: Expand to country if < 3 results
3. Third: Global search only if still insufficient
```

### 2. Data Structure: Trie (Prefix Tree)

The industry standard for fast prefix matching:
- **O(m) lookup time** where m = prefix length (not dependent on total words!)
- Each node stores: frequency, last_updated, cached top-N suggestions
- Common prefixes share nodes = space efficient

### 3. Caching Strategy (Two-Level)

**Level 1: Client-Side Cache**
- Cache previous search results in memory
- If user types "rest" then backspaces to "res", show cached results instantly
- Use LRU (Least Recently Used) eviction

**Level 2: Server-Side Cache (Redis)**
- Cache hot prefixes (most searched)
- 80% of queries hit top 20% of prefixes
- TTL: 1-24 hours depending on freshness needs

### 4. Debouncing Best Practices

| Delay | Use Case |
|-------|----------|
| 100-150ms | Fast typers, real-time feel |
| 200ms | **Recommended default** |
| 300ms+ | Starts feeling sluggish |

**Current Tavvy**: Check if debounce is implemented and what delay is used.

### 5. Query Optimization Strategies

**A. Prefix-Based Database Queries**
```sql
-- Instead of ILIKE '%search%' (slow, full scan)
-- Use: name LIKE 'search%' (can use index)
```

**B. Geo-Bounded Queries**
```sql
-- Add bounding box FIRST, then text search
WHERE latitude BETWEEN ? AND ?
  AND longitude BETWEEN ? AND ?
  AND name ILIKE 'search%'
```

**C. Pre-computed Local Index**
- Cache nearby places on app launch
- Search local cache first (instant)
- Fall back to server only if needed

### 6. Ranking Signals

```
score = α×popularity + β×recency + γ×distance + δ×CTR
```

Where:
- **popularity**: How often this place is searched/visited
- **recency**: Recent activity (reviews, check-ins)
- **distance**: Closer = higher score
- **CTR**: Click-through rate from previous suggestions

### 7. Progressive Enhancement Strategy

**Phase 1: Instant (0ms)**
- Show recent searches
- Show cached results for this prefix

**Phase 2: Fast (50-100ms)**
- Search local/cached places index
- Show category suggestions

**Phase 3: Network (200-500ms)**
- Query remote database
- Geocoding API for addresses

### 8. Nominatim (OSM Geocoding) Optimization

For address autocomplete:
- **Bounded queries**: Add `viewbox` parameter with user's area
- **Country codes**: Add `countrycodes=us` to limit scope
- **Limit results**: `limit=5` reduces response size
- **Structured queries**: Separate street, city, state for faster matching

## Recommended Implementation for Tavvy

### Immediate Optimizations (Quick Wins)

1. **Add location bias to Nominatim queries**
   ```typescript
   const params = {
     q: searchQuery,
     viewbox: `${lng-0.5},${lat+0.5},${lng+0.5},${lat-0.5}`,
     bounded: 1, // Prefer results in viewbox
     countrycodes: userCountry, // e.g., 'us'
     limit: 5
   };
   ```

2. **Implement client-side caching**
   ```typescript
   const searchCache = new Map<string, SearchResult[]>();
   
   // Before API call
   if (searchCache.has(prefix)) {
     return searchCache.get(prefix);
   }
   ```

3. **Optimize debounce timing**
   - Current: Check what it is
   - Recommended: 200ms

4. **Pre-fetch nearby places on app launch**
   - Store top 100 places within 10 miles
   - Search this cache first (instant results)

### Medium-Term Optimizations

1. **Geo-partitioned database queries**
   - Query user's state/region first
   - Expand only if needed

2. **Server-side Redis cache for hot prefixes**
   - Cache "rest", "coff", "bar" etc.
   - Refresh hourly

3. **Trie-based local index**
   - Build prefix tree from cached places
   - Sub-millisecond lookups

### Long-Term Optimizations

1. **Machine learning ranking**
   - Personalize based on user history
   - Time-of-day relevance

2. **Predictive prefetching**
   - If user types "r", prefetch "re", "ro", "ra"
   - Results ready before next keystroke

## Performance Targets

| Metric | Target |
|--------|--------|
| Time to first suggestion | < 100ms |
| Full results | < 300ms |
| Cache hit rate | > 70% |
| Debounce delay | 200ms |

## References

- AlgoMaster: Design Search Autocomplete System
- Google Maps Platform: Place Autocomplete Tips
- Algolia: Debouncing Best Practices
- Stack Overflow: Debounce timing discussions
