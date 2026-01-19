# Tavvy Bible: Technical Documentation & Developer Guide

**Author:** Manus AI
**Date:** January 19, 2026

## Introduction

This document serves as the central technical reference for the Tavvy mobile application, also known as the "Tavvy Bible." It captures key architectural decisions, data structures, debugging procedures, and component logic discovered and implemented during development. The goal is to provide a comprehensive guide for current and future developers to understand the system, onboard quickly, and maintain a consistent and robust codebase.

## 1. Supabase Setup & Environment

Proper configuration of the Supabase client is critical for the application to connect to the backend and fetch data. Without it, the app will fail silently and appear to be empty or filled with mock data.

### 1.1 Environment Variables

The application uses environment variables to store Supabase credentials. These are loaded from a `.env` file in the root of the project. This file is **not** checked into version control (and should not be) for security reasons.

**File:** `.env`

```
EXPO_PUBLIC_SUPABASE_URL=https://scasgwrikoqdwlwlwcff.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 1.2 Supabase Client

The Supabase client is initialized in `lib/supabaseClient.ts` and uses the environment variables defined above.

**File:** `lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or anon key not provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 1.3 Debugging Connection Issues

If the app shows no data, the first step is always to check the following:

1. **`.env` file exists:** Ensure the `.env` file is present in the project root.
2. **Credentials are correct:** Verify that the `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct.
3. **Restart the app with `--clear`:** After creating or modifying the `.env` file, you **must** restart the Expo development server with the `--clear` flag to clear the cache and load the new variables:

   ```bash
   npx expo start --clear
   ```

## 2. Data Model & Relationships

The Tavvy platform is built on a hierarchical data model of **Universes**, **Planets** (sub-universes), and **Places**. Understanding this structure is key to fetching and displaying data correctly.

### 2.1 Core Concepts

| Concept | Description |
|---|---|
| **Universe** | A top-level container for a large, complex location (e.g., Walt Disney World, JFK Airport). Universes are what users see on the main discovery screen. |
| **Planet** | A sub-universe or zone within a larger Universe (e.g., Magic Kingdom is a Planet within the Walt Disney World Universe). |
| **Place** | An individual point of interest within a Universe or Planet (e.g., Space Mountain, a specific restaurant, or a restroom). |

### 2.2 Database Tables

| Table | Description |
|---|---|
| `atlas_universes` | Stores both Universes and Planets. A `parent_universe_id` field links a Planet to its parent Universe. |
| `places` | Stores all individual places with their details (name, category, location, etc.). |
| `atlas_universe_places` | A join table that links places to universes/planets. This is critical for showing which places belong to which universe. |

### 2.3 Common Data Issues & Fixes

- **Duplicate Universes:** We encountered an issue where two entries for "Walt Disney World" existed. This caused the app to show an empty universe. **Solution:** Merge duplicate entries, ensuring all `place` links and metadata (like banner images) are transferred to the correct, canonical entry.

- **Missing `category_id`:** Universes must be assigned a `category_id` (e.g., "Theme Parks") to appear in the filtered sections of the `UniverseDiscoveryScreen`. If a universe is missing, check this field in the `atlas_universes` table.

- **Incorrect Place Counts:** The `place_count` in `atlas_universes` is a denormalized field for performance. It must be updated whenever places are linked or unlinked. We ran a script to recount and update this for all universes.
## 3. Component Logic & Data Fetching

This section details the logic for the primary screens involved in universe and place discovery.

### 3.1 UniverseDiscoveryScreen

This screen is the main entry point for exploring universes.

- **Data Source:** Fetches data from the `atlas_universes` table.
- **Filtering:**
    - **Main Category Filter (Theme Parks, Airports, etc.):** Filters universes based on their `category_id`.
    - **Curated Parks:** For the "Theme Parks" category, we currently show a hardcoded list of featured parks (`FEATURED_PARK_IDS`) to ensure a curated experience. Other categories will show all published universes.
- **Mock Data:** A significant issue was that this screen contained hardcoded mock data, which prevented real data from showing. **Solution:** The mock data was removed and replaced with Supabase queries.

### 3.2 UniverseLandingScreen

This screen displays the details of a single universe, including its sub-universes (planets) and places.

- **Zone Filter (All Zones, Animal Kingdom, etc.):**
    - The filter bar at the top allows users to select a sub-universe (planet).
    - When a zone is selected, the `activeZone` state is updated, which triggers a new data fetch in the `loadPlacesForZone` function.
    - This function fetches all places linked to the selected sub-universe's ID from the `atlas_universe_places` table.

- **Category Buttons (Dining, Restrooms, etc.):**
    - These buttons filter the currently displayed list of places based on the `tavvy_category` field.
    - The `activeCategory` state stores the selected filter.
    - The filtering logic is case-insensitive and checks for common variations (e.g., 'restaurant', 'dining', 'food').
    - **Important:** These filters will only work if the `places` data has the correct `tavvy_category` assigned.

## 4. Git & Collaboration

To ensure smooth collaboration, follow these Git practices.

### 4.1 Handling Merge Conflicts

We encountered a "divergent branches" issue. This happens when both the local and remote branches have new commits.

**Solution:**

1. **Set merge as the default pull strategy:**
   ```bash
   git config pull.rebase false
   ```
2. **Pull with the `--no-rebase` flag:**
   ```bash
   git pull origin <branch_name> --no-rebase
   ```

If conflicts occur, VS Code will highlight them. You can then choose to "Accept Incoming Change" (the remote version) or resolve them manually.

### 4.2 Stashing Changes

If you have local changes that are not ready to be committed, but you need to pull from the remote, use `git stash`:

```bash
# Temporarily save your local changes
git stash

# Pull the latest code
git pull origin <branch_name>

# Re-apply your saved changes
git stash pop
```

## 5. Data Import & Linking

When importing places from CSV files or other sources, the data must be properly linked to universes.

### 5.1 The `atlas_universe_places` Join Table

This is the most critical table for displaying places. A place will **not** appear in a universe unless a row exists in this table linking the two.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `universe_id` | UUID | Foreign key to `atlas_universes.id` |
| `place_id` | UUID | Foreign key to `places.id` |
| `display_order` | Integer | Optional. Used for custom ordering of places within a universe. |

### 5.2 Import Process

When importing new places:

1. **Insert places into the `places` table.** Use `ON CONFLICT DO NOTHING` to avoid duplicates.
2. **Insert links into `atlas_universe_places`.** Map each place to its correct universe/planet.
3. **Update `place_count` in `atlas_universes`.** Run an update query to set the correct count for each universe.

**Example SQL to update place counts:**

```sql
UPDATE atlas_universes u
SET place_count = (
  SELECT COUNT(*) FROM atlas_universe_places aup WHERE aup.universe_id = u.id
);
```

### 5.3 Current Data Summary (as of Jan 2026)

| Universe | Place Count |
|---|---|
| Walt Disney World | 361 |
| Magic Kingdom | 185 |
| EPCOT | 65 |
| Hollywood Studios | 35 |
| SeaWorld Orlando | 33 |
| Islands of Adventure | 32 |
| Universal Studios Florida | 31 |
| Animal Kingdom | 31 |
| Disney Springs | 27 |
| Disney Resort Hotels | 18 |

## 6. Place Categories

The `tavvy_category` field on the `places` table is used for filtering. The following categories are currently used for theme park places:

| Category | Description |
|---|---|
| `attraction` | Rides, shows, and experiences |
| `restaurant` | Dining locations |
| `shop` | Retail stores |
| `entrance` | Park entrances (not yet populated) |
| `restroom` | Restroom facilities (not yet populated) |
| `parking` | Parking areas (not yet populated) |

**Note:** The `Entrances`, `Restrooms`, and `Parking` quick-action buttons on the `UniverseLandingScreen` will not show results until places with those categories are added to the database.

## 7. Quick Reference: Common Debugging Checklist

When something isn't working, run through this checklist:

1. **No data showing at all?**
   - Check if `.env` file exists with correct Supabase credentials.
   - Restart Expo with `npx expo start --clear`.

2. **Universe shows 0 places?**
   - Check `atlas_universe_places` for links to that universe.
   - Verify the `universe_id` being used is the correct one (no duplicates).

3. **Zone filter not working?**
   - Ensure sub-universes have `parent_universe_id` set correctly.
   - Check that places are linked to the sub-universe, not just the parent.

4. **Category filter (Dining, etc.) not working?**
   - Verify that places have the correct `tavvy_category` value.
   - The filter is case-insensitive but expects specific values.

5. **Git sync issues?**
   - Run `git config pull.rebase false` to set merge as default.
   - Use `git stash` to save local changes before pulling.

---

**End of Tavvy Bible v1.0**
