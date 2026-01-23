# Tavvy Future Tasks - To-Do List

## High Priority

### 1. Gas Station Price Integration
**Status:** Deferred - Research Complete
**Recommended Solution:** Apify GasBuddy Scraper
- **API:** https://apify.com/stanvanrooy6/gasbuddy-scraper/api
- **Cost:** ~$10.99/month + Apify platform usage
- **Features:** Real-time gas prices, station ratings, multiple fuel types
- **Implementation Approach:**
  1. Set up Apify account and subscribe to GasBuddy scraper
  2. Create a scheduled job to sync prices for major cities
  3. Store prices in Supabase `gas_station_prices` table
  4. Display prices on Gas station place cards and map markers
  5. Add fuel type filter (Regular, Premium, Diesel, E85)

### 2. Trending Near You - Still Not Showing
**Status:** Needs Investigation
**Issue:** Despite code fixes, Trending Near You section may still be empty
**Possible Causes:**
- Database query returning no results
- User location not being passed correctly
- Data doesn't exist for the user's area
**Next Steps:**
1. Add more console logging to debug
2. Check if `fsq_places_raw` has data with valid lat/lng
3. Consider showing "Trending in [City]" as fallback

### 3. UI Regression - Vertical Panel on Right Side
**Status:** Could Not Reproduce in Code
**Issue:** Screenshot showed a vertical results panel appearing on the right side of the map
**Possible Causes:**
- Search suggestions rendering incorrectly
- State issue causing unexpected component render
- Third-party library behavior
**Next Steps:**
1. Test on physical device to reproduce
2. Check if issue persists after latest changes
3. Add conditional rendering guards

---

## Medium Priority

### 4. Advanced Filter Modal - Make Functional
**Status:** UI Complete, Logic Pending
**Current State:** Modal opens with all filter options displayed
**Needed:**
- Wire up filter state management
- Apply filters to search results
- Persist filter preferences
- Add filter count badge on Filter icon

### 5. Search Results Improvements
**Status:** Partially Complete
**Done:**
- Distance-based sorting
- Dynamic limits based on zoom
**Needed:**
- Full-text search optimization
- Search result ranking algorithm
- Recent searches history
- Search suggestions from place names

### 6. Map Marker Clustering
**Status:** Not Started
**Issue:** When zoomed out, many markers overlap
**Solution:** Implement marker clustering to group nearby places
**Libraries:** react-native-map-clustering or custom implementation

---

## Low Priority

### 7. Place Card Distance Display
**Status:** Backend Ready, UI Pending
**Done:** `formatDistance()` function added to placeService
**Needed:** Display distance on PlaceCard component

### 8. Gas Station Features
**Status:** Category Added, Features Pending
**Done:**
- Gas filter in filter bar
- Gas category mappings
**Needed:**
- Fuel type icons on markers
- Price display on cards
- Fuel type filter (Regular, Premium, Diesel)

### 9. Filter Bar Enhancements
**Status:** Basic Implementation Complete
**Ideas:**
- Add more categories (Grocery, Pharmacy, ATM, EV Charging)
- Category icons in chips
- Recently used categories
- Custom category ordering

---

## Completed Tasks

- [x] Distance-based search sorting
- [x] Category-based marker colors
- [x] Category icons inside markers
- [x] Dynamic result limits based on zoom
- [x] Gas category added to filter bar
- [x] Filter icon with advanced filter modal
- [x] Gas and Gas Stations added to searchable categories
- [x] Research on gas price APIs (GasBuddy via Apify recommended)

---

## Notes

### Gas Price API Options Researched:
| API | Pricing | US Coverage | Recommendation |
|-----|---------|-------------|----------------|
| TomTom Fuel Prices | Enterprise only | Yes | ❌ Too expensive |
| HERE Fuel Prices | Paid tier | Yes | ⚠️ Possible |
| Google Places (FuelPrice) | Pay-per-use | Yes | ❌ Budget constraint |
| NREL Alt Fuel | FREE | Yes | ⚠️ Only alt fuels |
| **Apify GasBuddy** | ~$11/month | Yes | ✅ Recommended |

### Map Marker Color Scheme:
| Category | Color | Icon |
|----------|-------|------|
| Restaurants | #E53935 (Red) | restaurant |
| Cafes/Coffee | #795548 (Brown) | cafe |
| Bars | #9C27B0 (Purple) | wine |
| Gas Stations | #FF9800 (Orange) | car |
| Shopping | #2196F3 (Blue) | cart |
| Hotels | #673AB7 (Deep Purple) | bed |
| Entertainment | #E91E63 (Pink) | film |
| Health | #4CAF50 (Green) | medkit |
| RV & Camping | #8BC34A (Light Green) | bonfire |
| Default | #0A84FF (Blue) | location |
