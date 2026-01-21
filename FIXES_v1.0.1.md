# Tavvy v1.0.1 Fixes

## Issues to Fix

### 1. Map search not showing places near current view
**Problem:** `fetchPlaces()` is only called once on app init with user location. When user pans the map, places don't update.
**Solution:** Add `onRegionDidChange` handler to MapLibreGL.MapView that updates the bounds and refetches places.

### 2. Need "Search this Area" button
**Problem:** No UI to manually trigger a search when user pans/zooms the map.
**Solution:** 
- Add state to track if map has moved: `mapHasMoved`
- Show "Search this Area" button when map moves
- On tap, fetch places for current visible bounds

### 3. Duplicate places showing
**Problem:** Places appear multiple times on the map (e.g., "Reunion Resorts" stacked pins)
**Possible causes:**
- Same place exists in both `places` and `fsq_places_raw` tables with different source_ids
- Deduplication in `placeService.ts` only filters by `source_id`, but duplicates may have different IDs
- Need to deduplicate by name + coordinates (within threshold)

## Implementation Plan

1. Add map region tracking state
2. Add `onRegionDidChange` handler to MapView
3. Add "Search this Area" button UI
4. Improve deduplication logic in placeService.ts (by name + proximity)
5. Test and commit
