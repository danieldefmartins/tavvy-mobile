# Tavvy · On The Go - Complete Implementation Guide

**Version:** 2.0  
**Last Updated:** January 25, 2026  
**Feature Owner:** On The Go Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Edge Functions (API)](#edge-functions-api)
5. [Mobile App Components](#mobile-app-components)
6. [Pro Dashboard Features](#pro-dashboard-features)
7. [Admin Portal Features](#admin-portal-features)
8. [How It Works](#how-it-works)
9. [Testing Guide](#testing-guide)

---

## Overview

**On The Go** is Tavvy's vertical for mobile businesses and experiences including food trucks, trailers, mobile services, pop-ups, and more. Unlike fixed-location businesses, On The Go businesses have dynamic locations that change based on where they're operating.

### Key Features

| Feature | Description |
|---------|-------------|
| **Go Live** | Pros can broadcast their current location to customers |
| **Dynamic Location** | Address auto-populates from GPS and updates in real-time |
| **Session Tracking** | Full history of live sessions with analytics |
| **Category Filtering** | Users can filter by Food Trucks, Mobile Services, etc. |
| **Dedicated Map View** | Full-screen map showing all live On The Go businesses |
| **Offline Status** | When not live, shows "Business offline" instead of stale location |

---

## Architecture

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Pro App       │────▶│  Edge Functions  │────▶│   Supabase DB   │
│   (Go Live)     │     │  (API Layer)     │     │  (tavvy_places) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │   Consumer App   │
                        │   (Map View)     │
                        └──────────────────┘
```

### Table Separation (Important!)

| Table | Purpose | Who Creates Data |
|-------|---------|------------------|
| `places` | External data (Foursquare, NREL, APIs) | Data pipelines |
| `tavvy_places` | User-generated content, **On The Go businesses** | Users, Pros |
| `live_sessions` | Active and historical live sessions | System (via edge functions) |

> **⚠️ IMPORTANT:** On The Go businesses go in `tavvy_places`, NOT `places`. The `places` table is reserved for external data sources.

---

## Database Schema

### tavvy_places (On The Go Columns)

```sql
-- Core On The Go columns
place_type          TEXT DEFAULT 'fixed'    -- 'fixed' or 'on_the_go'
service_area        TEXT                     -- e.g., "Austin, TX"
is_active_today     BOOLEAN DEFAULT false    -- Currently live?
last_live_at        TIMESTAMPTZ              -- Last time they went live
current_lat         DOUBLE PRECISION         -- Current GPS latitude (null when offline)
current_lng         DOUBLE PRECISION         -- Current GPS longitude (null when offline)
current_address     TEXT                     -- Current address or "Business offline"

-- Constraint
CONSTRAINT tavvy_places_valid_place_type CHECK (place_type IN ('fixed', 'on_the_go'))

-- Indexes
CREATE INDEX idx_tavvy_places_place_type ON tavvy_places(place_type);
CREATE INDEX idx_tavvy_places_is_active_today ON tavvy_places(is_active_today) WHERE is_active_today = true;
```

### live_sessions

```sql
CREATE TABLE live_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tavvy_place_id    UUID REFERENCES tavvy_places(id),    -- Links to tavvy_places
  started_by        UUID REFERENCES auth.users(id),
  session_lat       DOUBLE PRECISION NOT NULL,
  session_lng       DOUBLE PRECISION NOT NULL,
  session_location  GEOGRAPHY(POINT, 4326),              -- PostGIS point
  location_label    TEXT,                                 -- e.g., "6th Street & Congress"
  session_address   TEXT,                                 -- Auto-populated address
  address_confirmed BOOLEAN DEFAULT false,                -- Pro confirmed address?
  started_at        TIMESTAMPTZ DEFAULT now(),
  scheduled_end_at  TIMESTAMPTZ NOT NULL,
  actual_end_at     TIMESTAMPTZ,
  status            TEXT DEFAULT 'active',                -- 'active', 'ended', 'disabled'
  today_note        TEXT,                                 -- "Fresh batch of tacos!"
  disabled_by       UUID,
  disabled_at       TIMESTAMPTZ,
  disabled_reason   TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

### live_session_menu_items

```sql
CREATE TABLE live_session_menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  tavvy_place_id UUID REFERENCES tavvy_places(id),
  name          TEXT NOT NULL,
  description   TEXT,
  price_cents   INTEGER,
  is_available  BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### live_session_specials

```sql
CREATE TABLE live_session_specials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  tavvy_place_id UUID REFERENCES tavvy_places(id),
  title         TEXT NOT NULL,
  description   TEXT,
  valid_until   TIMESTAMPTZ,
  urgency_label TEXT,                    -- "Today Only!", "First 50 customers"
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## Edge Functions (API)

### Base URL
```
https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/
```

### 1. create-onthego-place (Auth Required)

**Purpose:** Register a new On The Go business

```bash
POST /create-onthego-place
Authorization: Bearer <jwt>

{
  "name": "Taco Truck Express",
  "tavvy_category": "Food Trucks",
  "tavvy_subcategory": "Mexican",
  "description": "Best tacos in Austin!",
  "service_area": "Austin, TX",
  "phone": "+15125551234",
  "instagram": "@tacotruck"
}
```

**Valid Categories:**
- Food Trucks
- Mobile Services
- Pop-ups
- Mobile Retail
- Event Services
- Mobile Health & Wellness
- Mobile Pet Services
- Mobile Entertainment

### 2. go-live-start (Auth Required)

**Purpose:** Start a live session and broadcast location

```bash
POST /go-live-start
Authorization: Bearer <jwt>

{
  "tavvy_place_id": "uuid-here",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "location_label": "6th Street & Congress",
  "session_address": "123 E 6th St, Austin, TX 78701",
  "duration_hours": 4,
  "today_note": "Fresh batch of tacos ready!",
  "menu_items": [
    { "name": "Street Tacos", "price_cents": 350 },
    { "name": "Burrito Bowl", "price_cents": 1200 }
  ],
  "specials": [
    { "title": "Happy Hour", "description": "2-for-1 tacos until 5pm" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "tavvy_place_id": "place-uuid",
    "place_name": "Taco Truck Express",
    "session_lat": 30.2672,
    "session_lng": -97.7431,
    "started_at": "2026-01-25T14:00:00Z",
    "scheduled_end_at": "2026-01-25T18:00:00Z"
  },
  "message": "You are now live! Customers can see your location."
}
```

**Business Rules:**
- Max session duration: 12 hours
- Cooldown between sessions: 30 minutes
- Only one active session per place

### 3. go-live-confirm-address (Auth Required)

**Purpose:** Confirm or correct the auto-populated address

```bash
POST /go-live-confirm-address
Authorization: Bearer <jwt>

{
  "session_id": "session-uuid",
  "confirmed_address": "123 E 6th St, Austin, TX 78701"
}
```

### 4. go-live-end (Auth Required)

**Purpose:** End a live session and remove from map

```bash
POST /go-live-end
Authorization: Bearer <jwt>

{
  "session_id": "session-uuid"
}
```

**What Happens:**
1. Session status → "ended"
2. `tavvy_places.is_active_today` → false
3. `tavvy_places.current_lat/lng` → null
4. `tavvy_places.current_address` → "Business offline"

### 5. live-onthego-map-data (Public - No Auth)

**Purpose:** Get all live sessions for the map view

```bash
GET /live-onthego-map-data
GET /live-onthego-map-data?category=Food%20Trucks
GET /live-onthego-map-data?center_lat=30.2672&center_lng=-97.7431&radius_meters=10000
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "available_categories": ["Food Trucks", "Mobile Services"],
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "sessions": [
    {
      "session_id": "uuid",
      "tavvy_place_id": "uuid",
      "session_lat": 30.2672,
      "session_lng": -97.7431,
      "place_name": "Taco Truck Express",
      "category": "Food Trucks",
      "session_address": "123 E 6th St, Austin, TX",
      "today_note": "Fresh tacos!",
      "started_at": "2026-01-25T14:00:00Z",
      "scheduled_end_at": "2026-01-25T18:00:00Z"
    }
  ]
}
```

### 6. my-active-session (Auth Required)

**Purpose:** Get Pro's On The Go places and active sessions

```bash
GET /my-active-session
Authorization: Bearer <jwt>
```

**Response:**
```json
{
  "success": true,
  "has_on_the_go_places": true,
  "has_active_session": true,
  "places": [
    {
      "id": "uuid",
      "name": "Taco Truck Express",
      "is_live": true,
      "active_session": { ... }
    }
  ],
  "stats": {
    "sessions_this_week": 5,
    "total_live_time": "23h 45m"
  }
}
```

### 7. admin-disable-session (Auth Required - Admin Only)

**Purpose:** Admin moderation to disable abusive sessions

```bash
POST /admin-disable-session
Authorization: Bearer <admin-jwt>

{
  "session_id": "uuid",
  "reason": "Inappropriate content"
}
```

---

## Mobile App Components

### OnTheGoScreen.tsx

**Location:** `screens/OnTheGoScreen.tsx`

**Features:**
- Full-screen MapLibre map
- Category filter chips
- Real-time updates (30-second refresh)
- Pulsing markers for live businesses
- Session details bottom sheet
- "Get Directions" and "Call" actions

**Navigation:**
- Accessible from Apps Screen → "On The Go" tile
- Route name: `OnTheGo`

### Apps Screen Tile

**Location:** `screens/AppsScreen.tsx`

```typescript
{
  id: 'on-the-go',
  name: 'On The Go',
  icon: 'location',
  iconType: 'ionicons',
  gradientColors: ['#10B981', '#059669'],
  route: 'OnTheGo',
}
```

---

## Pro Dashboard Features

### Go Live Flow

1. **Check Status** → Call `my-active-session`
2. **Select Place** → Choose which On The Go business to go live with
3. **Get Location** → Auto-detect GPS coordinates
4. **Auto-Populate Address** → Reverse geocode to get address
5. **Confirm Address** → Pro confirms or edits the address
6. **Set Duration** → 1-12 hours
7. **Add Note** → Optional "today's special" message
8. **Go Live** → Call `go-live-start`

### Session Management

- View active session status
- Update location (if moved)
- End session early
- View session history and analytics

---

## Admin Portal Features

### Live Sessions Panel

**What Admins Can Do:**

| Action | Description |
|--------|-------------|
| View all active sessions | See who's live right now |
| Filter by category | Focus on specific business types |
| Disable session | Remove abusive/inappropriate sessions |
| View session history | Audit trail of all sessions |
| View disabled sessions | Track moderation actions |

### Moderation Workflow

1. Admin sees flagged or suspicious session
2. Reviews session details (location, note, business info)
3. Can disable with reason
4. Session removed from public map
5. Pro notified of action

---

## How It Works

### When a Pro Goes Live

```
1. Pro opens app → taps "Go Live"
2. App gets GPS coordinates
3. App reverse geocodes to get address
4. Pro confirms address
5. App calls go-live-start endpoint
6. Backend:
   - Creates live_sessions record
   - Updates tavvy_places.is_active_today = true
   - Updates tavvy_places.current_lat/lng
   - Updates tavvy_places.current_address
7. Business appears on map immediately
```

### When a Pro Goes Offline

```
1. Pro taps "End Session" (or session expires)
2. App calls go-live-end endpoint
3. Backend:
   - Updates live_sessions.status = 'ended'
   - Updates tavvy_places.is_active_today = false
   - Clears tavvy_places.current_lat/lng = null
   - Sets tavvy_places.current_address = "Business offline"
4. Business disappears from map
```

### Consumer Experience

```
1. User opens On The Go map
2. App calls live-onthego-map-data (no auth needed)
3. Map shows all live businesses as markers
4. User can filter by category
5. Tap marker → see details, get directions, call
6. Map auto-refreshes every 30 seconds
```

---

## Testing Guide

### Create a Test On The Go Business

```bash
# 1. Get auth token (login as Pro user)
# 2. Create the business
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/create-onthego-place" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Food Truck",
    "tavvy_category": "Food Trucks",
    "service_area": "Austin, TX"
  }'
```

### Go Live

```bash
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/go-live-start" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tavvy_place_id": "PLACE_UUID",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "session_address": "123 E 6th St, Austin, TX",
    "duration_hours": 2,
    "today_note": "Testing the system!"
  }'
```

### Check Map Data

```bash
curl "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/live-onthego-map-data"
```

### End Session

```bash
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/go-live-end" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "SESSION_UUID"}'
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-25 | 2.0 | Migrated to tavvy_places, added dynamic location, session tracking |
| 2026-01-25 | 1.0 | Initial implementation |

---

## Questions?

Contact the On The Go feature owner or the Tavvy development team.
