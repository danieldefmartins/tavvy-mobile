# Tavvy Filter System Design

## Core Principles

1. **NO RATINGS** - Tavvy uses the Tap System, not star ratings
2. **Category-Specific Filters** - Different categories show different filter options
3. **Open Now** - Universal filter available for all categories
4. **Tap-Based Sorting** - Sort by Most Taps, Trending, etc.

---

## Universal Filters (All Categories)

### Sort By
- Distance (default)
- Most Taps (highest positive tap count)
- Trending (recent activity)
- Newest

### Hours
- Any
- Open Now
- Open 24h

### Distance
- 1 mi
- 5 mi
- 10 mi
- 25 mi
- Any

### Tap Quality (replaces Rating)
- Any
- Mostly Positive (majority "The Good" taps)
- Highly Rated (high positive tap count)
- Trending (recent activity)
- No "Heads Up" in last 3 months

---

## Category-Specific Filters

### 🍽️ Restaurants

**Cuisine Types** (Grid with icons like Google Maps)
| Icon | Cuisine |
|------|---------|
| 🍔 | American |
| 🍖 | Barbecue |
| 🥟 | Chinese |
| 🥖 | French |
| 🍔 | Hamburger |
| 🍛 | Indian |
| 🍝 | Italian |
| 🍜 | Japanese |
| 🌮 | Mexican |
| 🍕 | Pizza |
| 🐟 | Seafood |
| 🥩 | Steak |
| 🍣 | Sushi |
| 🍲 | Thai |
| 🥗 | Vegetarian |

**Price Range**
- $ (Budget)
- $$ (Moderate)
- $$$ (Upscale)
- $$$$ (Fine Dining)
- Any

**Dining Options**
- Dine-in
- Takeout
- Delivery
- Reservations

**Meal Type**
- Breakfast
- Brunch
- Lunch
- Dinner
- Late Night

**Amenities**
- WiFi
- Outdoor Seating
- Parking
- Wheelchair Accessible
- Good for Kids
- Good for Groups
- Pet Friendly

**Drinks**
- Beer
- Wine
- Full Bar
- Happy Hour

---

### ☕ Cafes / Coffee Shops

**Type**
- Coffee Shop
- Tea House
- Bakery
- Juice Bar

**Features**
- WiFi
- Outdoor Seating
- Drive-Through
- Work Friendly
- Study Friendly

**Amenities**
- Parking
- Wheelchair Accessible
- Pet Friendly

---

### 🍺 Bars

**Type**
- Bar
- Pub
- Nightclub
- Lounge
- Brewery
- Wine Bar
- Sports Bar

**Features**
- Live Music
- DJ
- Karaoke
- Pool Tables
- Darts
- Trivia Night
- Happy Hour

**Amenities**
- Outdoor Seating
- Parking
- Wheelchair Accessible

---

### ⛽ Gas Stations

**Fuel Types**
- Regular
- Midgrade
- Premium
- Diesel
- E85
- Electric Charging

**Amenities**
- Convenience Store
- Restrooms
- ATM
- Car Wash
- Air Pump
- Propane

**Payment**
- Cash
- Credit
- Mobile Pay

---

### 🛒 Shopping

**Type**
- Mall
- Boutique
- Department Store
- Grocery
- Pharmacy
- Electronics
- Clothing
- Home & Garden

**Features**
- Parking
- Wheelchair Accessible
- Returns Accepted

---

### 🏨 Hotels

**Type**
- Hotel
- Motel
- Resort
- Inn
- Hostel
- Vacation Rental

**Amenities**
- Pool
- Gym/Fitness
- Free WiFi
- Free Breakfast
- Parking
- Pet Friendly
- Room Service
- Spa

**Room Features**
- Kitchen
- Balcony
- Ocean View

---

### 🏕️ RV & Camping

**Type**
- RV Park
- Campground
- Boondocking
- Dump Station

**Hookups**
- Full Hookups (Water, Electric, Sewer)
- Partial Hookups
- Electric Only
- No Hookups (Dry Camping)

**Amenities**
- Restrooms
- Showers
- Laundry
- WiFi
- Pool
- Playground
- Pet Friendly
- Fire Pits
- Picnic Tables

**Services**
- Propane
- Dump Station
- Store

---

### 🎢 Theme Parks / Entertainment

**Type**
- Theme Park
- Water Park
- Amusement Park
- Zoo
- Aquarium
- Museum

**Features**
- Fast Pass Available
- Wheelchair Accessible
- Parking
- Food Available

---

### 🏥 Health / Medical

**Type**
- Hospital
- Urgent Care
- Clinic
- Pharmacy
- Dentist
- Eye Doctor
- Specialist

**Features**
- Walk-ins Welcome
- Accepts Insurance
- Wheelchair Accessible

---

### 💇 Beauty / Personal Care

**Type**
- Hair Salon
- Barber Shop
- Nail Salon
- Spa
- Massage

**Features**
- Walk-ins Welcome
- Appointments Required
- Wheelchair Accessible

---

## Filter Modal UI Structure

### Layout (Similar to Google Maps)

```
┌─────────────────────────────────────────┐
│ ✕                Filters                │
├─────────────────────────────────────────┤
│                                         │
│ Sort by                                 │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Distance ✓  │ │ Most Taps   │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│ Hours                                   │
│ ┌─────┐ ┌──────────┐ ┌─────────┐       │
│ │ Any │ │ Open Now │ │ Open 24h│       │
│ └─────┘ └──────────┘ └─────────┘       │
│                                         │
│ [Category-Specific Filters Here]        │
│                                         │
│ More Filters                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ WiFi     │ │ Parking  │ │ Takeout  │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                         │
├─────────────────────────────────────────┤
│     Clear              Apply            │
└─────────────────────────────────────────┘
```

### Filter Chip Bar (Below Search Results Title)

When a category is selected, show relevant quick filters:
- **Restaurants**: [Sort by ▼] [Open Now] [Cuisine ▼] [Price ▼] [More Filters]
- **Gas**: [Sort by ▼] [Open Now] [Fuel Type ▼] [Amenities ▼]
- **Hotels**: [Sort by ▼] [Amenities ▼] [Price ▼]
- **RV & Camping**: [Sort by ▼] [Hookups ▼] [Amenities ▼]

---

## Implementation Notes

1. **State Management**: Store selected filters in component state
2. **Filter Application**: Apply filters to the Supabase query
3. **Filter Persistence**: Consider saving user's preferred filters
4. **Filter Count Badge**: Show number of active filters on the Filter icon
5. **Clear All**: Reset all filters to defaults
6. **Category Detection**: Detect selected category to show relevant filters
