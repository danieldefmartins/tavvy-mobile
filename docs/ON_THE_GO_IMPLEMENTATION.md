# Tavvy · On The Go - Complete Implementation Guide

**Version:** 3.0  
**Last Updated:** January 25, 2026  
**Feature Owner:** On The Go Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Edge Functions (API)](#edge-functions-api)
5. [Mobile App Screens](#mobile-app-screens)
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
| **Scheduled Events** | Pros can schedule future locations in advance |
| **Check Schedule** | Users can see where a business will be next |
| **Category Filtering** | Users can filter by Food Trucks, Mobile Services, etc. |
| **Dedicated Map View** | Full-screen map showing live AND scheduled businesses |
| **Offline Status** | When not live, shows "Business offline" or upcoming schedule |

---

## Architecture

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Pro App       │────▶│  Edge Functions  │────▶│   Supabase DB   │
│   (Go Live)     │     │  (API Layer)     │     │  (tavvy_places) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                         │
                                │                         ▼
                                │                 ┌─────────────────┐
                                │                 │ live_sessions   │
                                │                 │ scheduled_events│
                                │                 └─────────────────┘
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
| `scheduled_events` | Future scheduled locations | Pros (via edge functions) |

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
has_upcoming_events BOOLEAN DEFAULT false    -- Has scheduled future events?
next_event_at       TIMESTAMPTZ              -- When is the next scheduled event?

-- Constraint
CONSTRAINT tavvy_places_valid_place_type CHECK (place_type IN ('fixed', 'on_the_go'))

-- Indexes
CREATE INDEX idx_tavvy_places_place_type ON tavvy_places(place_type);
CREATE INDEX idx_tavvy_places_is_active_today ON tavvy_places(is_active_today) WHERE is_active_today = true;
CREATE INDEX idx_tavvy_places_has_upcoming_events ON tavvy_places(has_upcoming_events) WHERE has_upcoming_events = true;
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
  location_label    TEXT,                                 -- Friendly name
  session_address   TEXT,                                 -- Auto-populated address
  address_confirmed BOOLEAN DEFAULT false,                -- Pro confirmed address?
  today_note        TEXT,                                 -- "Today's special: ..."
  status            TEXT DEFAULT 'active',                -- active, ended, disabled
  started_at        TIMESTAMPTZ DEFAULT now(),
  scheduled_end_at  TIMESTAMPTZ NOT NULL,                 -- When session ends
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_sessions_tavvy_place_id ON live_sessions(tavvy_place_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status) WHERE status = 'active';
CREATE INDEX idx_live_sessions_location ON live_sessions USING GIST(session_location);
```

### scheduled_events (NEW!)

```sql
CREATE TABLE scheduled_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tavvy_place_id    UUID NOT NULL REFERENCES tavvy_places(id) ON DELETE CASCADE,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  event_title       TEXT,                                 -- Optional title
  event_description TEXT,                                 -- Optional description
  location_name     TEXT NOT NULL,                        -- e.g., "Downtown Austin"
  location_address  TEXT,                                 -- Full address
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  scheduled_start   TIMESTAMPTZ NOT NULL,                 -- When event starts
  scheduled_end     TIMESTAMPTZ NOT NULL,                 -- When event ends
  is_recurring      BOOLEAN DEFAULT false,                -- Is this recurring?
  recurrence_rule   TEXT,                                 -- e.g., "WEEKLY:MON,WED,FRI"
  status            TEXT DEFAULT 'scheduled',             -- scheduled, cancelled, completed
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Constraint
CONSTRAINT scheduled_events_status_check CHECK (status IN ('scheduled', 'cancelled', 'completed'))

-- Indexes
CREATE INDEX idx_scheduled_events_tavvy_place_id ON scheduled_events(tavvy_place_id);
CREATE INDEX idx_scheduled_events_scheduled_start ON scheduled_events(scheduled_start);
CREATE INDEX idx_scheduled_events_status ON scheduled_events(status) WHERE status = 'scheduled';

-- RLS Policies
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view scheduled events" 
  ON scheduled_events FOR SELECT 
  USING (status = 'scheduled' AND scheduled_start > now());

CREATE POLICY "Users can manage their own scheduled events" 
  ON scheduled_events FOR ALL 
  USING (auth.uid() = created_by);
```

---

## Edge Functions (API)

### Summary

| Function | Auth | Method | Description |
|----------|------|--------|-------------|
| `create-onthego-place` | Yes | POST | Register new On The Go business |
| `go-live-start` | Yes | POST | Start a live session |
| `go-live-confirm-address` | Yes | POST | Confirm/correct auto-populated address |
| `go-live-update` | Yes | POST | Update session details |
| `go-live-end` | Yes | POST | End live session |
| `my-active-session` | Yes | GET | Get Pro's current active session |
| `live-sessions-nearby` | No | GET | Find live sessions near location |
| `live-session-details` | No | GET | Get full session details |
| `live-onthego-map-data` | No | GET | Get map data (live + scheduled) |
| `schedule-event` | Yes | POST | Schedule a future location |
| `get-place-schedule` | No | GET | Get upcoming schedule for a place |
| `cancel-scheduled-event` | Yes | POST | Cancel a scheduled event |
| `my-scheduled-events` | Yes | GET | Get Pro's scheduled events |
| `admin-disable-session` | Yes | POST | Admin: disable abusive session |

### Detailed API Documentation

#### 1. Go Live Start

```bash
POST /functions/v1/go-live-start
Authorization: Bearer <token>
Content-Type: application/json

{
  "tavvy_place_id": "uuid",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "duration_hours": 4,
  "today_note": "Today's special: $2 tacos!"
}

# Response
{
  "success": true,
  "session_id": "uuid",
  "auto_address": "123 Main St, Austin, TX 78701",
  "message": "You're now live! Please confirm your address."
}
```

#### 2. Confirm Address

```bash
POST /functions/v1/go-live-confirm-address
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "uuid",
  "confirmed_address": "123 Main St, Austin, TX 78701"  # Can be edited
}

# Response
{
  "success": true,
  "message": "Address confirmed! Customers can now see your location."
}
```

#### 3. End Session

```bash
POST /functions/v1/go-live-end
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "uuid"
}

# Response
{
  "success": true,
  "message": "Session ended. Your location has been removed from the map."
}
```

#### 4. Get Map Data (Live + Scheduled)

```bash
GET /functions/v1/live-onthego-map-data?include_scheduled=true&category=Food%20Trucks

# Response
{
  "success": true,
  "live_count": 5,
  "scheduled_count": 3,
  "total_count": 8,
  "available_categories": ["Food Trucks", "Mobile Services", "Pop-ups"],
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "sessions": [
    {
      "session_id": "uuid",
      "tavvy_place_id": "uuid",
      "place_name": "Taco Truck Express",
      "session_address": "123 Main St, Austin, TX",
      "is_live": true,
      "has_schedule": true
    }
  ],
  "scheduled_places": [
    {
      "tavvy_place_id": "uuid",
      "place_name": "BBQ Wagon",
      "is_live": false,
      "has_schedule": true,
      "next_event_label": "Tomorrow",
      "next_event": {
        "location_name": "Downtown Austin",
        "scheduled_start": "2026-01-26T11:00:00Z"
      }
    }
  ]
}
```

#### 5. Schedule Event

```bash
POST /functions/v1/schedule-event
Authorization: Bearer <token>
Content-Type: application/json

{
  "tavvy_place_id": "uuid",
  "event_title": "Lunch Special",
  "location_name": "Downtown Austin",
  "location_address": "500 Congress Ave, Austin, TX",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "scheduled_start": "2026-01-26T11:00:00Z",
  "scheduled_end": "2026-01-26T15:00:00Z"
}

# Response
{
  "success": true,
  "message": "Event scheduled successfully!",
  "event": {
    "id": "uuid",
    "location_name": "Downtown Austin",
    "scheduled_start": "2026-01-26T11:00:00Z"
  }
}
```

#### 6. Get Place Schedule

```bash
GET /functions/v1/get-place-schedule?tavvy_place_id=uuid&include_place=true

# Response
{
  "success": true,
  "place": {
    "id": "uuid",
    "name": "Taco Truck Express",
    "is_active_today": false,
    "current_address": "Business offline"
  },
  "is_live_now": false,
  "has_upcoming_events": true,
  "event_count": 3,
  "events": [
    {
      "id": "uuid",
      "location_name": "Downtown Austin",
      "formatted_date": "Mon, Jan 26",
      "formatted_time": "11:00 AM - 3:00 PM",
      "relative_time": "Tomorrow",
      "days_until": 1
    }
  ]
}
```

---

## Mobile App Screens

### 1. OnTheGoScreen (Map View)

**Path:** `screens/OnTheGoScreen.tsx`

**Features:**
- Full-screen map with MapLibre
- Shows live businesses with pulsing markers (solid colored)
- Shows scheduled businesses with calendar markers (outline style)
- Category filter dropdown
- Header shows "X Live · Y Scheduled"
- Tap marker to see session/schedule card
- "Check Schedule" button for businesses with upcoming events
- Auto-refresh every 30 seconds

**Marker Types:**
| Type | Style | Description |
|------|-------|-------------|
| Live | Solid colored circle with pulse | Currently broadcasting |
| Scheduled | White circle with colored border + calendar icon | Has upcoming events |

### 2. PlaceScheduleScreen (Schedule View)

**Path:** `screens/PlaceScheduleScreen.tsx`

**Features:**
- Shows all upcoming scheduled events for a business
- Place info card with current status (Live/Offline)
- Event cards with:
  - Date badge (Today, Tomorrow, In X days)
  - Time range
  - Location name and address
  - Get Directions button
- Empty state when no events scheduled
- Pull-to-refresh

**Navigation:**
- Accessed from OnTheGoScreen via "Check Schedule" button
- Route: `PlaceSchedule` with params `{ tavvyPlaceId, placeName }`

### 3. AppsScreen Tile

**Path:** `screens/AppsScreen.tsx`

The On The Go tile is in Row 3 with:
- Green gradient (#10B981 → #059669)
- Location icon
- "On The Go" label

---

## Pro Dashboard Features

### Go Live Flow

1. **Tap "Go Live"** → Opens Go Live modal
2. **GPS captured** → Address auto-populated via reverse geocoding
3. **Confirm address** → Pro can edit if needed
4. **Set duration** → 1-8 hours
5. **Add note** (optional) → "Today's special..."
6. **Go Live!** → Session created, appears on map

### Schedule Events Flow

1. **Tap "Schedule"** → Opens schedule modal
2. **Pick date/time** → When will you be there?
3. **Set location** → Search or pin on map
4. **Add details** (optional) → Title, description
5. **Save** → Event appears in schedule

### Dashboard Cards

| Card | Description |
|------|-------------|
| **Live Status** | Shows if currently live with session details |
| **Upcoming Events** | Next 3 scheduled events |
| **Session History** | Past sessions with duration and location |
| **Analytics** | Hours live this week, popular locations |

---

## Admin Portal Features

### Live Sessions Panel

| Feature | Description |
|---------|-------------|
| **View All Live** | See all currently live On The Go businesses |
| **Filter by Category** | Focus on Food Trucks, Mobile Services, etc. |
| **Filter by Status** | Active, Ended, Disabled |
| **Disable Session** | Remove abusive/inappropriate content |
| **View History** | Audit trail of all sessions |

### Scheduled Events Panel

| Feature | Description |
|---------|-------------|
| **View All Scheduled** | See all upcoming scheduled events |
| **Filter by Date** | Today, This Week, This Month |
| **Cancel Event** | Remove inappropriate scheduled events |

### Moderation Actions

```bash
# Disable a live session
POST /functions/v1/admin-disable-session
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "session_id": "uuid",
  "reason": "Inappropriate content"
}
```

---

## How It Works

### When Pro Goes Live

```
1. Pro taps "Go Live" in app
2. GPS coordinates captured from device
3. Edge function creates live_session record
4. Reverse geocode API returns address
5. Pro confirms/edits address
6. tavvy_places updated:
   - is_active_today = true
   - current_lat/lng = session coordinates
   - current_address = confirmed address
7. Business appears on map with pulsing marker
```

### When Pro Goes Offline

```
1. Pro taps "End Session" or duration expires
2. Edge function updates live_session:
   - status = 'ended'
   - ended_at = now()
3. tavvy_places updated:
   - is_active_today = false
   - current_lat/lng = NULL
   - current_address = "Business offline"
4. Business disappears from live map
5. If has_upcoming_events = true, shows on map with calendar marker
```

### When Pro Schedules Event

```
1. Pro taps "Schedule" in app
2. Selects date, time, and location
3. Edge function creates scheduled_event record
4. tavvy_places updated:
   - has_upcoming_events = true
   - next_event_at = event start time
5. Business appears on map with calendar marker (at scheduled location)
6. Users can tap to see full schedule
```

---

## Testing Guide

### Test Creating On The Go Place

```bash
# Create a test On The Go place
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/create-onthego-place" \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Food Truck",
    "tavvy_category": "Food Trucks",
    "service_area": "Austin, TX"
  }'
```

### Test Go Live

```bash
# Start a live session
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/go-live-start" \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tavvy_place_id": "<place_uuid>",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "duration_hours": 4,
    "today_note": "Testing!"
  }'
```

### Test Schedule Event

```bash
# Schedule a future event
curl -X POST "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/schedule-event" \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tavvy_place_id": "<place_uuid>",
    "location_name": "Downtown Austin",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "scheduled_start": "2026-01-26T11:00:00Z",
    "scheduled_end": "2026-01-26T15:00:00Z"
  }'
```

### Test Map Data

```bash
# Get all live and scheduled businesses
curl "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/live-onthego-map-data?include_scheduled=true"

# Filter by category
curl "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/live-onthego-map-data?category=Food%20Trucks"
```

### Test Get Schedule

```bash
# Get schedule for a specific place
curl "https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/get-place-schedule?tavvy_place_id=<place_uuid>&include_place=true"
```

---

## Summary

The On The Go feature is now complete with:

✅ **Database:** `tavvy_places`, `live_sessions`, `scheduled_events` tables  
✅ **Backend:** 14 edge functions deployed  
✅ **Mobile:** `OnTheGoScreen`, `PlaceScheduleScreen` implemented  
✅ **Navigation:** Apps tile and routes configured  
✅ **Features:** Go Live, Schedule Events, Check Schedule, Category Filtering  

### Files Changed

| File | Changes |
|------|---------|
| `screens/OnTheGoScreen.tsx` | Added scheduled places support, Check Schedule button |
| `screens/PlaceScheduleScreen.tsx` | New screen for viewing business schedule |
| `screens/AppsScreen.tsx` | Added On The Go tile |
| `App.tsx` | Added imports and navigation routes |
| `docs/ON_THE_GO_IMPLEMENTATION.md` | This documentation |

### Edge Functions Deployed

1. `create-onthego-place`
2. `go-live-start`
3. `go-live-confirm-address`
4. `go-live-update`
5. `go-live-end`
6. `my-active-session`
7. `live-sessions-nearby`
8. `live-session-details`
9. `live-onthego-map-data`
10. `schedule-event`
11. `get-place-schedule`
12. `cancel-scheduled-event`
13. `my-scheduled-events`
14. `admin-disable-session`
