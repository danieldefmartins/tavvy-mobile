/**
 * TavvY Category Configuration System
 * 
 * This file defines the complete category taxonomy for the TavvY app.
 * It includes:
 * - Content types (Place, Service Business, City, Universe)
 * - Primary categories with subcategories
 * - Category-specific field configurations
 * - Multi-entrance logic per category
 * - Signal mappings per category
 * 
 * Path: lib/categoryConfig.ts
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ContentType = 'place' | 'service_business' | 'city' | 'universe';

export type MultiEntranceRequirement = 'always' | 'optional' | 'never';

export interface ContentTypeConfig {
  id: ContentType;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  allowedCategories: string[]; // Primary category slugs
}

export interface SubCategory {
  slug: string;
  name: string;
  iconKey: keyof typeof Ionicons.glyphMap;
  sortOrder: number;
}

export interface PrimaryCategory {
  slug: string;
  name: string;
  iconKey: keyof typeof Ionicons.glyphMap;
  sortOrder: number;
  subcategories: SubCategory[];
  multiEntrance: MultiEntranceRequirement;
  // Categories that always require multi-entrance within this primary
  alwaysMultiEntranceSubcategories?: string[];
  // Categories that optionally support multi-entrance
  optionalMultiEntranceSubcategories?: string[];
}

export interface CategoryFieldConfig {
  field: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'phone' | 'url' | 'email' | 'price' | 'hours';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

// ============================================
// CONTENT TYPES
// ============================================

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    id: 'place',
    label: 'Place',
    description: 'A physical location with a single address',
    icon: 'location',
    allowedCategories: [
      'restaurants', 'cafes', 'nightlife', 'lodging', 'shopping', 'beauty',
      'health', 'fitness', 'automotive', 'professional', 'financial', 'pets',
      'education', 'arts', 'entertainment', 'outdoors', 'government', 'religious',
      'events', 'other'
    ],
  },
  {
    id: 'service_business',
    label: 'Service Business',
    description: 'Mobile or service-area business (e.g., plumber, landscaper)',
    icon: 'construct',
    allowedCategories: [
      'home_services', 'professional', 'automotive', 'beauty', 'pets', 'other'
    ],
  },
  {
    id: 'city',
    label: 'City',
    description: 'A city as a rateable destination',
    icon: 'business',
    allowedCategories: [], // Cities don't have categories
  },
  {
    id: 'universe',
    label: 'Universe',
    description: 'Large location with multiple places inside (airport, theme park)',
    icon: 'globe',
    allowedCategories: [
      'transportation', 'entertainment', 'outdoors', 'education', 'health',
      'shopping', 'events', 'other'
    ],
  },
];

// ============================================
// PRIMARY CATEGORIES
// ============================================

export const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  // ----------------------------------------
  // RESTAURANTS & DINING
  // ----------------------------------------
  {
    slug: 'restaurants',
    name: 'Restaurants & Dining',
    iconKey: 'restaurant',
    sortOrder: 1,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'american', name: 'American', iconKey: 'restaurant', sortOrder: 1 },
      { slug: 'italian', name: 'Italian', iconKey: 'pizza', sortOrder: 2 },
      { slug: 'mexican', name: 'Mexican', iconKey: 'restaurant', sortOrder: 3 },
      { slug: 'chinese', name: 'Chinese', iconKey: 'restaurant', sortOrder: 4 },
      { slug: 'japanese', name: 'Japanese / Sushi', iconKey: 'restaurant', sortOrder: 5 },
      { slug: 'thai', name: 'Thai', iconKey: 'restaurant', sortOrder: 6 },
      { slug: 'indian', name: 'Indian', iconKey: 'restaurant', sortOrder: 7 },
      { slug: 'mediterranean', name: 'Mediterranean', iconKey: 'restaurant', sortOrder: 8 },
      { slug: 'french', name: 'French', iconKey: 'restaurant', sortOrder: 9 },
      { slug: 'korean', name: 'Korean', iconKey: 'restaurant', sortOrder: 10 },
      { slug: 'vietnamese', name: 'Vietnamese', iconKey: 'restaurant', sortOrder: 11 },
      { slug: 'greek', name: 'Greek', iconKey: 'restaurant', sortOrder: 12 },
      { slug: 'spanish', name: 'Spanish', iconKey: 'restaurant', sortOrder: 13 },
      { slug: 'middle_eastern', name: 'Middle Eastern', iconKey: 'restaurant', sortOrder: 14 },
      { slug: 'caribbean', name: 'Caribbean', iconKey: 'restaurant', sortOrder: 15 },
      { slug: 'african', name: 'African', iconKey: 'restaurant', sortOrder: 16 },
      { slug: 'soul_food', name: 'Soul Food', iconKey: 'restaurant', sortOrder: 17 },
      { slug: 'seafood', name: 'Seafood', iconKey: 'fish', sortOrder: 18 },
      { slug: 'steakhouse', name: 'Steakhouse', iconKey: 'restaurant', sortOrder: 19 },
      { slug: 'bbq', name: 'BBQ / Grill', iconKey: 'flame', sortOrder: 20 },
      { slug: 'pizza', name: 'Pizza', iconKey: 'pizza', sortOrder: 21 },
      { slug: 'burgers', name: 'Burgers', iconKey: 'fast-food', sortOrder: 22 },
      { slug: 'sandwiches', name: 'Sandwiches / Deli', iconKey: 'restaurant', sortOrder: 23 },
      { slug: 'vegetarian_vegan', name: 'Vegetarian / Vegan', iconKey: 'leaf', sortOrder: 24 },
      { slug: 'farm_to_table', name: 'Farm-to-Table', iconKey: 'leaf', sortOrder: 25 },
      { slug: 'food_truck', name: 'Food Truck', iconKey: 'car', sortOrder: 26 },
      { slug: 'buffet', name: 'Buffet', iconKey: 'restaurant', sortOrder: 27 },
      { slug: 'fine_dining', name: 'Fine Dining', iconKey: 'restaurant', sortOrder: 28 },
      { slug: 'fast_food', name: 'Fast Food', iconKey: 'fast-food', sortOrder: 29 },
      { slug: 'fast_casual', name: 'Fast Casual', iconKey: 'restaurant', sortOrder: 30 },
      { slug: 'brunch', name: 'Brunch', iconKey: 'sunny', sortOrder: 31 },
      { slug: 'breakfast', name: 'Breakfast', iconKey: 'sunny', sortOrder: 32 },
      { slug: 'bakery_restaurant', name: 'Bakery Restaurant', iconKey: 'restaurant', sortOrder: 33 },
      { slug: 'dessert_restaurant', name: 'Dessert Restaurant', iconKey: 'ice-cream', sortOrder: 34 },
      { slug: 'fusion', name: 'Fusion', iconKey: 'restaurant', sortOrder: 35 },
      { slug: 'other_cuisine', name: 'Other Cuisine', iconKey: 'restaurant', sortOrder: 99 },
    ],
  },

  // ----------------------------------------
  // CAFES & COFFEE
  // ----------------------------------------
  {
    slug: 'cafes',
    name: 'Cafes & Coffee',
    iconKey: 'cafe',
    sortOrder: 2,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'coffee_shop', name: 'Coffee Shop', iconKey: 'cafe', sortOrder: 1 },
      { slug: 'espresso_bar', name: 'Espresso Bar', iconKey: 'cafe', sortOrder: 2 },
      { slug: 'tea_house', name: 'Tea House', iconKey: 'cafe', sortOrder: 3 },
      { slug: 'bubble_tea', name: 'Bubble Tea', iconKey: 'cafe', sortOrder: 4 },
      { slug: 'juice_bar', name: 'Juice Bar', iconKey: 'nutrition', sortOrder: 5 },
      { slug: 'smoothie_shop', name: 'Smoothie Shop', iconKey: 'nutrition', sortOrder: 6 },
      { slug: 'bakery_cafe', name: 'Bakery Cafe', iconKey: 'cafe', sortOrder: 7 },
      { slug: 'dessert_cafe', name: 'Dessert Cafe', iconKey: 'ice-cream', sortOrder: 8 },
      { slug: 'internet_cafe', name: 'Internet Cafe', iconKey: 'wifi', sortOrder: 9 },
      { slug: 'pet_cafe', name: 'Cat / Dog Cafe', iconKey: 'paw', sortOrder: 10 },
      { slug: 'book_cafe', name: 'Book Cafe', iconKey: 'book', sortOrder: 11 },
      { slug: 'roastery', name: 'Coffee Roastery', iconKey: 'cafe', sortOrder: 12 },
    ],
  },

  // ----------------------------------------
  // BARS & NIGHTLIFE
  // ----------------------------------------
  {
    slug: 'nightlife',
    name: 'Bars & Nightlife',
    iconKey: 'wine',
    sortOrder: 3,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'bar', name: 'Bar', iconKey: 'beer', sortOrder: 1 },
      { slug: 'sports_bar', name: 'Sports Bar', iconKey: 'football', sortOrder: 2 },
      { slug: 'wine_bar', name: 'Wine Bar', iconKey: 'wine', sortOrder: 3 },
      { slug: 'cocktail_bar', name: 'Cocktail Bar', iconKey: 'wine', sortOrder: 4 },
      { slug: 'beer_bar', name: 'Beer Bar / Pub', iconKey: 'beer', sortOrder: 5 },
      { slug: 'brewery', name: 'Brewery / Taproom', iconKey: 'beer', sortOrder: 6 },
      { slug: 'distillery', name: 'Distillery', iconKey: 'wine', sortOrder: 7 },
      { slug: 'nightclub', name: 'Nightclub', iconKey: 'musical-notes', sortOrder: 8 },
      { slug: 'dance_club', name: 'Dance Club', iconKey: 'musical-notes', sortOrder: 9 },
      { slug: 'lounge', name: 'Lounge', iconKey: 'wine', sortOrder: 10 },
      { slug: 'karaoke_bar', name: 'Karaoke Bar', iconKey: 'mic', sortOrder: 11 },
      { slug: 'comedy_club', name: 'Comedy Club', iconKey: 'happy', sortOrder: 12 },
      { slug: 'jazz_club', name: 'Jazz Club', iconKey: 'musical-notes', sortOrder: 13 },
      { slug: 'live_music_venue', name: 'Live Music Venue', iconKey: 'musical-notes', sortOrder: 14 },
      { slug: 'pool_hall', name: 'Pool Hall', iconKey: 'ellipse', sortOrder: 15 },
      { slug: 'hookah_bar', name: 'Hookah Bar', iconKey: 'cloud', sortOrder: 16 },
      { slug: 'gay_bar', name: 'LGBTQ+ Bar', iconKey: 'heart', sortOrder: 17 },
      { slug: 'dive_bar', name: 'Dive Bar', iconKey: 'beer', sortOrder: 18 },
      { slug: 'rooftop_bar', name: 'Rooftop Bar', iconKey: 'sunny', sortOrder: 19 },
    ],
  },

  // ----------------------------------------
  // HOTELS & LODGING
  // ----------------------------------------
  {
    slug: 'lodging',
    name: 'Hotels & Lodging',
    iconKey: 'bed',
    sortOrder: 4,
    multiEntrance: 'optional',
    optionalMultiEntranceSubcategories: ['hotel', 'resort', 'rv_park', 'campground'],
    subcategories: [
      { slug: 'hotel', name: 'Hotel', iconKey: 'bed', sortOrder: 1 },
      { slug: 'boutique_hotel', name: 'Boutique Hotel', iconKey: 'bed', sortOrder: 2 },
      { slug: 'resort', name: 'Resort', iconKey: 'umbrella', sortOrder: 3 },
      { slug: 'motel', name: 'Motel', iconKey: 'bed', sortOrder: 4 },
      { slug: 'bed_breakfast', name: 'Bed & Breakfast', iconKey: 'bed', sortOrder: 5 },
      { slug: 'inn', name: 'Inn', iconKey: 'bed', sortOrder: 6 },
      { slug: 'hostel', name: 'Hostel', iconKey: 'bed', sortOrder: 7 },
      { slug: 'vacation_rental', name: 'Vacation Rental', iconKey: 'home', sortOrder: 8 },
      { slug: 'cabin', name: 'Cabin / Cottage', iconKey: 'home', sortOrder: 9 },
      { slug: 'campground', name: 'Campground', iconKey: 'bonfire', sortOrder: 10 },
      { slug: 'rv_park', name: 'RV Park', iconKey: 'car', sortOrder: 11 },
      { slug: 'extended_stay', name: 'Extended Stay', iconKey: 'bed', sortOrder: 12 },
      { slug: 'aparthotel', name: 'Aparthotel', iconKey: 'bed', sortOrder: 13 },
      { slug: 'guest_house', name: 'Guest House', iconKey: 'home', sortOrder: 14 },
      { slug: 'lodge', name: 'Lodge', iconKey: 'bed', sortOrder: 15 },
      { slug: 'capsule_hotel', name: 'Capsule Hotel', iconKey: 'bed', sortOrder: 16 },
    ],
  },

  // ----------------------------------------
  // SHOPPING & RETAIL
  // ----------------------------------------
  {
    slug: 'shopping',
    name: 'Shopping & Retail',
    iconKey: 'cart',
    sortOrder: 5,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['shopping_mall'],
    optionalMultiEntranceSubcategories: ['department_store', 'warehouse_club'],
    subcategories: [
      { slug: 'department_store', name: 'Department Store', iconKey: 'storefront', sortOrder: 1 },
      { slug: 'clothing', name: 'Clothing / Apparel', iconKey: 'shirt', sortOrder: 2 },
      { slug: 'shoes', name: 'Shoes', iconKey: 'footsteps', sortOrder: 3 },
      { slug: 'jewelry', name: 'Jewelry', iconKey: 'diamond', sortOrder: 4 },
      { slug: 'accessories', name: 'Accessories', iconKey: 'glasses', sortOrder: 5 },
      { slug: 'electronics', name: 'Electronics', iconKey: 'phone-portrait', sortOrder: 6 },
      { slug: 'furniture', name: 'Furniture', iconKey: 'bed', sortOrder: 7 },
      { slug: 'home_decor', name: 'Home Decor', iconKey: 'home', sortOrder: 8 },
      { slug: 'hardware_store', name: 'Hardware Store', iconKey: 'hammer', sortOrder: 9 },
      { slug: 'sporting_goods', name: 'Sporting Goods', iconKey: 'football', sortOrder: 10 },
      { slug: 'outdoor_camping', name: 'Outdoor / Camping', iconKey: 'bonfire', sortOrder: 11 },
      { slug: 'books', name: 'Books', iconKey: 'book', sortOrder: 12 },
      { slug: 'music_records', name: 'Music / Records', iconKey: 'musical-notes', sortOrder: 13 },
      { slug: 'toys_games', name: 'Toys & Games', iconKey: 'game-controller', sortOrder: 14 },
      { slug: 'arts_crafts', name: 'Arts & Crafts', iconKey: 'color-palette', sortOrder: 15 },
      { slug: 'gift_shop', name: 'Gift Shop', iconKey: 'gift', sortOrder: 16 },
      { slug: 'antiques', name: 'Antiques', iconKey: 'time', sortOrder: 17 },
      { slug: 'thrift_store', name: 'Thrift / Consignment', iconKey: 'pricetag', sortOrder: 18 },
      { slug: 'vintage', name: 'Vintage', iconKey: 'time', sortOrder: 19 },
      { slug: 'florist', name: 'Florist', iconKey: 'flower', sortOrder: 20 },
      { slug: 'garden_center', name: 'Garden Center', iconKey: 'leaf', sortOrder: 21 },
      { slug: 'pet_store', name: 'Pet Store', iconKey: 'paw', sortOrder: 22 },
      { slug: 'grocery_store', name: 'Grocery Store', iconKey: 'cart', sortOrder: 23 },
      { slug: 'convenience_store', name: 'Convenience Store', iconKey: 'storefront', sortOrder: 24 },
      { slug: 'supermarket', name: 'Supermarket', iconKey: 'cart', sortOrder: 25 },
      { slug: 'specialty_food', name: 'Specialty Food', iconKey: 'nutrition', sortOrder: 26 },
      { slug: 'farmers_market', name: 'Farmers Market', iconKey: 'leaf', sortOrder: 27 },
      { slug: 'liquor_store', name: 'Liquor Store', iconKey: 'wine', sortOrder: 28 },
      { slug: 'smoke_shop', name: 'Smoke Shop / Vape', iconKey: 'cloud', sortOrder: 29 },
      { slug: 'cannabis_dispensary', name: 'Cannabis Dispensary', iconKey: 'leaf', sortOrder: 30 },
      { slug: 'pharmacy', name: 'Pharmacy', iconKey: 'medkit', sortOrder: 31 },
      { slug: 'optical', name: 'Optical', iconKey: 'eye', sortOrder: 32 },
      { slug: 'bridal', name: 'Bridal', iconKey: 'heart', sortOrder: 33 },
      { slug: 'baby_kids', name: 'Baby / Kids', iconKey: 'happy', sortOrder: 34 },
      { slug: 'plus_size', name: 'Plus Size', iconKey: 'shirt', sortOrder: 35 },
      { slug: 'outlet_store', name: 'Outlet Store', iconKey: 'pricetag', sortOrder: 36 },
      { slug: 'warehouse_club', name: 'Warehouse Club', iconKey: 'storefront', sortOrder: 37 },
      { slug: 'shopping_mall', name: 'Shopping Mall', iconKey: 'storefront', sortOrder: 38 },
    ],
  },

  // ----------------------------------------
  // BEAUTY & PERSONAL CARE
  // ----------------------------------------
  {
    slug: 'beauty',
    name: 'Beauty & Personal Care',
    iconKey: 'cut',
    sortOrder: 6,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'hair_salon', name: 'Hair Salon', iconKey: 'cut', sortOrder: 1 },
      { slug: 'barbershop', name: 'Barbershop', iconKey: 'cut', sortOrder: 2 },
      { slug: 'nail_salon', name: 'Nail Salon', iconKey: 'color-palette', sortOrder: 3 },
      { slug: 'spa', name: 'Spa', iconKey: 'water', sortOrder: 4 },
      { slug: 'day_spa', name: 'Day Spa', iconKey: 'water', sortOrder: 5 },
      { slug: 'med_spa', name: 'Med Spa', iconKey: 'medkit', sortOrder: 6 },
      { slug: 'massage', name: 'Massage', iconKey: 'hand-left', sortOrder: 7 },
      { slug: 'waxing', name: 'Waxing', iconKey: 'cut', sortOrder: 8 },
      { slug: 'threading', name: 'Threading', iconKey: 'cut', sortOrder: 9 },
      { slug: 'tanning', name: 'Tanning', iconKey: 'sunny', sortOrder: 10 },
      { slug: 'makeup_artist', name: 'Makeup Artist', iconKey: 'color-palette', sortOrder: 11 },
      { slug: 'eyelash_extensions', name: 'Eyelash Extensions', iconKey: 'eye', sortOrder: 12 },
      { slug: 'eyebrow_services', name: 'Eyebrow Services', iconKey: 'eye', sortOrder: 13 },
      { slug: 'skincare', name: 'Skincare / Facial', iconKey: 'sparkles', sortOrder: 14 },
      { slug: 'tattoo_parlor', name: 'Tattoo Parlor', iconKey: 'color-palette', sortOrder: 15 },
      { slug: 'piercing_studio', name: 'Piercing Studio', iconKey: 'ellipse', sortOrder: 16 },
      { slug: 'beauty_supply', name: 'Beauty Supply Store', iconKey: 'storefront', sortOrder: 17 },
    ],
  },

  // ----------------------------------------
  // HEALTH & MEDICAL
  // ----------------------------------------
  {
    slug: 'health',
    name: 'Health & Medical',
    iconKey: 'medkit',
    sortOrder: 7,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['hospital'],
    optionalMultiEntranceSubcategories: ['medical_clinic', 'rehabilitation'],
    subcategories: [
      { slug: 'hospital', name: 'Hospital', iconKey: 'medkit', sortOrder: 1 },
      { slug: 'urgent_care', name: 'Urgent Care', iconKey: 'medkit', sortOrder: 2 },
      { slug: 'emergency_room', name: 'Emergency Room', iconKey: 'medkit', sortOrder: 3 },
      { slug: 'medical_clinic', name: 'Medical Clinic', iconKey: 'medkit', sortOrder: 4 },
      { slug: 'doctors_office', name: "Doctor's Office", iconKey: 'medkit', sortOrder: 5 },
      { slug: 'family_practice', name: 'Family Practice', iconKey: 'people', sortOrder: 6 },
      { slug: 'internal_medicine', name: 'Internal Medicine', iconKey: 'medkit', sortOrder: 7 },
      { slug: 'pediatrician', name: 'Pediatrician', iconKey: 'happy', sortOrder: 8 },
      { slug: 'obgyn', name: 'OB/GYN', iconKey: 'medkit', sortOrder: 9 },
      { slug: 'dermatologist', name: 'Dermatologist', iconKey: 'body', sortOrder: 10 },
      { slug: 'cardiologist', name: 'Cardiologist', iconKey: 'heart', sortOrder: 11 },
      { slug: 'orthopedic', name: 'Orthopedic', iconKey: 'body', sortOrder: 12 },
      { slug: 'neurologist', name: 'Neurologist', iconKey: 'body', sortOrder: 13 },
      { slug: 'psychiatrist', name: 'Psychiatrist', iconKey: 'happy', sortOrder: 14 },
      { slug: 'psychologist', name: 'Psychologist / Therapist', iconKey: 'happy', sortOrder: 15 },
      { slug: 'dentist', name: 'Dentist', iconKey: 'happy', sortOrder: 16 },
      { slug: 'orthodontist', name: 'Orthodontist', iconKey: 'happy', sortOrder: 17 },
      { slug: 'oral_surgeon', name: 'Oral Surgeon', iconKey: 'medkit', sortOrder: 18 },
      { slug: 'optometrist', name: 'Optometrist', iconKey: 'eye', sortOrder: 19 },
      { slug: 'ophthalmologist', name: 'Ophthalmologist', iconKey: 'eye', sortOrder: 20 },
      { slug: 'chiropractor', name: 'Chiropractor', iconKey: 'body', sortOrder: 21 },
      { slug: 'physical_therapy', name: 'Physical Therapy', iconKey: 'fitness', sortOrder: 22 },
      { slug: 'acupuncture', name: 'Acupuncture', iconKey: 'medkit', sortOrder: 23 },
      { slug: 'pharmacy_health', name: 'Pharmacy', iconKey: 'medkit', sortOrder: 24 },
      { slug: 'lab_diagnostic', name: 'Lab / Diagnostic', iconKey: 'flask', sortOrder: 25 },
      { slug: 'imaging_center', name: 'Imaging Center', iconKey: 'scan', sortOrder: 26 },
      { slug: 'dialysis_center', name: 'Dialysis Center', iconKey: 'medkit', sortOrder: 27 },
      { slug: 'rehabilitation', name: 'Rehabilitation Center', iconKey: 'fitness', sortOrder: 28 },
      { slug: 'nursing_home', name: 'Nursing Home', iconKey: 'home', sortOrder: 29 },
      { slug: 'assisted_living', name: 'Assisted Living', iconKey: 'home', sortOrder: 30 },
      { slug: 'home_health', name: 'Home Health Care', iconKey: 'home', sortOrder: 31 },
      { slug: 'mental_health', name: 'Mental Health Center', iconKey: 'happy', sortOrder: 32 },
      { slug: 'addiction_treatment', name: 'Addiction Treatment', iconKey: 'medkit', sortOrder: 33 },
      { slug: 'womens_health', name: "Women's Health", iconKey: 'female', sortOrder: 34 },
      { slug: 'mens_health', name: "Men's Health", iconKey: 'male', sortOrder: 35 },
      { slug: 'fertility_clinic', name: 'Fertility Clinic', iconKey: 'medkit', sortOrder: 36 },
      { slug: 'plastic_surgery', name: 'Plastic Surgery', iconKey: 'medkit', sortOrder: 37 },
      { slug: 'weight_loss', name: 'Weight Loss Clinic', iconKey: 'fitness', sortOrder: 38 },
      { slug: 'sleep_clinic', name: 'Sleep Clinic', iconKey: 'moon', sortOrder: 39 },
      { slug: 'allergy_clinic', name: 'Allergy Clinic', iconKey: 'medkit', sortOrder: 40 },
      { slug: 'pain_management', name: 'Pain Management', iconKey: 'medkit', sortOrder: 41 },
      { slug: 'podiatrist', name: 'Podiatrist', iconKey: 'footsteps', sortOrder: 42 },
      { slug: 'audiologist', name: 'Audiologist', iconKey: 'ear', sortOrder: 43 },
      { slug: 'speech_therapy', name: 'Speech Therapy', iconKey: 'chatbubble', sortOrder: 44 },
      { slug: 'occupational_therapy', name: 'Occupational Therapy', iconKey: 'hand-left', sortOrder: 45 },
    ],
  },

  // ----------------------------------------
  // FITNESS & RECREATION
  // ----------------------------------------
  {
    slug: 'fitness',
    name: 'Fitness & Recreation',
    iconKey: 'fitness',
    sortOrder: 8,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['sports_complex'],
    optionalMultiEntranceSubcategories: ['gym', 'golf_course', 'country_club'],
    subcategories: [
      { slug: 'gym', name: 'Gym / Fitness Center', iconKey: 'fitness', sortOrder: 1 },
      { slug: 'crossfit', name: 'CrossFit', iconKey: 'fitness', sortOrder: 2 },
      { slug: 'yoga_studio', name: 'Yoga Studio', iconKey: 'body', sortOrder: 3 },
      { slug: 'pilates_studio', name: 'Pilates Studio', iconKey: 'body', sortOrder: 4 },
      { slug: 'martial_arts', name: 'Martial Arts', iconKey: 'fitness', sortOrder: 5 },
      { slug: 'boxing_mma', name: 'Boxing / MMA', iconKey: 'fitness', sortOrder: 6 },
      { slug: 'dance_studio', name: 'Dance Studio', iconKey: 'musical-notes', sortOrder: 7 },
      { slug: 'spin_cycling', name: 'Spin / Cycling', iconKey: 'bicycle', sortOrder: 8 },
      { slug: 'swimming_pool', name: 'Swimming Pool', iconKey: 'water', sortOrder: 9 },
      { slug: 'tennis_club', name: 'Tennis Club', iconKey: 'tennisball', sortOrder: 10 },
      { slug: 'golf_course', name: 'Golf Course', iconKey: 'golf', sortOrder: 11 },
      { slug: 'bowling_alley', name: 'Bowling Alley', iconKey: 'ellipse', sortOrder: 12 },
      { slug: 'skating_rink', name: 'Skating Rink', iconKey: 'snow', sortOrder: 13 },
      { slug: 'rock_climbing', name: 'Rock Climbing Gym', iconKey: 'trending-up', sortOrder: 14 },
      { slug: 'trampoline_park', name: 'Trampoline Park', iconKey: 'arrow-up', sortOrder: 15 },
      { slug: 'laser_tag', name: 'Laser Tag', iconKey: 'flash', sortOrder: 16 },
      { slug: 'go_kart', name: 'Go-Kart Track', iconKey: 'car', sortOrder: 17 },
      { slug: 'mini_golf', name: 'Mini Golf', iconKey: 'golf', sortOrder: 18 },
      { slug: 'batting_cages', name: 'Batting Cages', iconKey: 'baseball', sortOrder: 19 },
      { slug: 'driving_range', name: 'Driving Range', iconKey: 'golf', sortOrder: 20 },
      { slug: 'sports_complex', name: 'Sports Complex', iconKey: 'football', sortOrder: 21 },
      { slug: 'recreation_center', name: 'Recreation Center', iconKey: 'fitness', sortOrder: 22 },
      { slug: 'community_center', name: 'Community Center', iconKey: 'people', sortOrder: 23 },
      { slug: 'country_club', name: 'Country Club', iconKey: 'golf', sortOrder: 24 },
      { slug: 'athletic_field', name: 'Athletic Field', iconKey: 'football', sortOrder: 25 },
      { slug: 'basketball_court', name: 'Basketball Court', iconKey: 'basketball', sortOrder: 26 },
      { slug: 'soccer_field', name: 'Soccer Field', iconKey: 'football', sortOrder: 27 },
      { slug: 'running_track', name: 'Running Track', iconKey: 'walk', sortOrder: 28 },
      { slug: 'playground', name: 'Playground', iconKey: 'happy', sortOrder: 29 },
      { slug: 'skate_park', name: 'Skate Park', iconKey: 'bicycle', sortOrder: 30 },
    ],
  },

  // ----------------------------------------
  // AUTOMOTIVE
  // ----------------------------------------
  {
    slug: 'automotive',
    name: 'Automotive',
    iconKey: 'car-sport',
    sortOrder: 9,
    multiEntrance: 'optional',
    optionalMultiEntranceSubcategories: ['car_dealer_new', 'car_dealer_used'],
    subcategories: [
      { slug: 'car_dealer_new', name: 'Car Dealership (New)', iconKey: 'car', sortOrder: 1 },
      { slug: 'car_dealer_used', name: 'Car Dealership (Used)', iconKey: 'car', sortOrder: 2 },
      { slug: 'motorcycle_dealer', name: 'Motorcycle Dealer', iconKey: 'bicycle', sortOrder: 3 },
      { slug: 'rv_dealer', name: 'RV Dealer', iconKey: 'car', sortOrder: 4 },
      { slug: 'boat_dealer', name: 'Boat Dealer', iconKey: 'boat', sortOrder: 5 },
      { slug: 'auto_repair', name: 'Auto Repair Shop', iconKey: 'build', sortOrder: 6 },
      { slug: 'auto_body', name: 'Auto Body Shop', iconKey: 'car', sortOrder: 7 },
      { slug: 'oil_change', name: 'Oil Change / Lube', iconKey: 'water', sortOrder: 8 },
      { slug: 'tire_shop', name: 'Tire Shop', iconKey: 'ellipse', sortOrder: 9 },
      { slug: 'brake_shop', name: 'Brake Shop', iconKey: 'car', sortOrder: 10 },
      { slug: 'transmission_shop', name: 'Transmission Shop', iconKey: 'cog', sortOrder: 11 },
      { slug: 'auto_glass', name: 'Auto Glass', iconKey: 'car', sortOrder: 12 },
      { slug: 'auto_electric', name: 'Auto Electric', iconKey: 'flash', sortOrder: 13 },
      { slug: 'auto_ac', name: 'Auto AC / Heating', iconKey: 'thermometer', sortOrder: 14 },
      { slug: 'car_wash', name: 'Car Wash', iconKey: 'water', sortOrder: 15 },
      { slug: 'auto_detailing', name: 'Auto Detailing', iconKey: 'sparkles', sortOrder: 16 },
      { slug: 'towing', name: 'Towing Service', iconKey: 'car', sortOrder: 17 },
      { slug: 'roadside_assistance', name: 'Roadside Assistance', iconKey: 'warning', sortOrder: 18 },
      { slug: 'smog_check', name: 'Smog Check', iconKey: 'cloud', sortOrder: 19 },
      { slug: 'auto_parts', name: 'Auto Parts Store', iconKey: 'cog', sortOrder: 20 },
      { slug: 'car_rental', name: 'Car Rental', iconKey: 'car', sortOrder: 21 },
      { slug: 'truck_rental', name: 'Truck Rental', iconKey: 'car', sortOrder: 22 },
      { slug: 'motorcycle_rental', name: 'Motorcycle Rental', iconKey: 'bicycle', sortOrder: 23 },
      { slug: 'parking', name: 'Parking Lot / Garage', iconKey: 'car', sortOrder: 24 },
      { slug: 'gas_station', name: 'Gas Station', iconKey: 'flash', sortOrder: 25 },
      { slug: 'ev_charging', name: 'EV Charging Station', iconKey: 'flash', sortOrder: 26 },
      { slug: 'auto_auction', name: 'Auto Auction', iconKey: 'car', sortOrder: 27 },
      { slug: 'dmv', name: 'DMV / Registration', iconKey: 'document', sortOrder: 28 },
    ],
  },

  // ----------------------------------------
  // HOME SERVICES
  // ----------------------------------------
  {
    slug: 'home_services',
    name: 'Home Services',
    iconKey: 'home',
    sortOrder: 10,
    multiEntrance: 'never', // Service businesses don't have entrances
    subcategories: [
      { slug: 'general_contractor', name: 'General Contractor', iconKey: 'hammer', sortOrder: 1 },
      { slug: 'electrician', name: 'Electrician', iconKey: 'flash', sortOrder: 2 },
      { slug: 'plumber', name: 'Plumber', iconKey: 'water', sortOrder: 3 },
      { slug: 'hvac', name: 'HVAC', iconKey: 'thermometer', sortOrder: 4 },
      { slug: 'roofing', name: 'Roofing', iconKey: 'home', sortOrder: 5 },
      { slug: 'siding', name: 'Siding', iconKey: 'home', sortOrder: 6 },
      { slug: 'windows_doors', name: 'Windows / Doors', iconKey: 'home', sortOrder: 7 },
      { slug: 'flooring', name: 'Flooring', iconKey: 'grid', sortOrder: 8 },
      { slug: 'painting', name: 'Painting', iconKey: 'color-palette', sortOrder: 9 },
      { slug: 'drywall', name: 'Drywall', iconKey: 'home', sortOrder: 10 },
      { slug: 'carpentry', name: 'Carpentry', iconKey: 'hammer', sortOrder: 11 },
      { slug: 'masonry', name: 'Masonry', iconKey: 'cube', sortOrder: 12 },
      { slug: 'concrete', name: 'Concrete', iconKey: 'cube', sortOrder: 13 },
      { slug: 'landscaping', name: 'Landscaping', iconKey: 'leaf', sortOrder: 14 },
      { slug: 'lawn_care', name: 'Lawn Care', iconKey: 'leaf', sortOrder: 15 },
      { slug: 'tree_service', name: 'Tree Service', iconKey: 'leaf', sortOrder: 16 },
      { slug: 'pool_service', name: 'Pool Service', iconKey: 'water', sortOrder: 17 },
      { slug: 'pest_control', name: 'Pest Control', iconKey: 'bug', sortOrder: 18 },
      { slug: 'cleaning_service', name: 'Cleaning Service', iconKey: 'sparkles', sortOrder: 19 },
      { slug: 'maid_service', name: 'Maid Service', iconKey: 'sparkles', sortOrder: 20 },
      { slug: 'carpet_cleaning', name: 'Carpet Cleaning', iconKey: 'sparkles', sortOrder: 21 },
      { slug: 'pressure_washing', name: 'Pressure Washing', iconKey: 'water', sortOrder: 22 },
      { slug: 'window_cleaning', name: 'Window Cleaning', iconKey: 'sparkles', sortOrder: 23 },
      { slug: 'gutter_cleaning', name: 'Gutter Cleaning', iconKey: 'water', sortOrder: 24 },
      { slug: 'handyman', name: 'Handyman', iconKey: 'hammer', sortOrder: 25 },
      { slug: 'appliance_repair', name: 'Appliance Repair', iconKey: 'build', sortOrder: 26 },
      { slug: 'garage_door', name: 'Garage Door', iconKey: 'home', sortOrder: 27 },
      { slug: 'locksmith', name: 'Locksmith', iconKey: 'key', sortOrder: 28 },
      { slug: 'moving_company', name: 'Moving Company', iconKey: 'cube', sortOrder: 29 },
      { slug: 'storage', name: 'Storage Facility', iconKey: 'cube', sortOrder: 30 },
      { slug: 'junk_removal', name: 'Junk Removal', iconKey: 'trash', sortOrder: 31 },
      { slug: 'home_security', name: 'Home Security', iconKey: 'shield', sortOrder: 32 },
      { slug: 'home_inspection', name: 'Home Inspection', iconKey: 'search', sortOrder: 33 },
      { slug: 'interior_design', name: 'Interior Design', iconKey: 'color-palette', sortOrder: 34 },
      { slug: 'kitchen_bath', name: 'Kitchen / Bath Remodel', iconKey: 'home', sortOrder: 35 },
      { slug: 'fence', name: 'Fence Company', iconKey: 'home', sortOrder: 36 },
      { slug: 'deck_patio', name: 'Deck / Patio', iconKey: 'home', sortOrder: 37 },
      { slug: 'solar', name: 'Solar Installation', iconKey: 'sunny', sortOrder: 38 },
      { slug: 'septic', name: 'Septic Service', iconKey: 'water', sortOrder: 39 },
      { slug: 'well_service', name: 'Well Service', iconKey: 'water', sortOrder: 40 },
    ],
  },

  // ----------------------------------------
  // PROFESSIONAL SERVICES
  // ----------------------------------------
  {
    slug: 'professional',
    name: 'Professional Services',
    iconKey: 'briefcase',
    sortOrder: 11,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'lawyer', name: 'Lawyer / Attorney', iconKey: 'briefcase', sortOrder: 1 },
      { slug: 'accountant', name: 'Accountant / CPA', iconKey: 'calculator', sortOrder: 2 },
      { slug: 'tax_preparer', name: 'Tax Preparer', iconKey: 'document', sortOrder: 3 },
      { slug: 'financial_advisor', name: 'Financial Advisor', iconKey: 'cash', sortOrder: 4 },
      { slug: 'insurance_agent', name: 'Insurance Agent', iconKey: 'shield', sortOrder: 5 },
      { slug: 'real_estate_agent', name: 'Real Estate Agent', iconKey: 'home', sortOrder: 6 },
      { slug: 'mortgage_broker', name: 'Mortgage Broker', iconKey: 'home', sortOrder: 7 },
      { slug: 'notary', name: 'Notary Public', iconKey: 'document', sortOrder: 8 },
      { slug: 'translator', name: 'Translator / Interpreter', iconKey: 'language', sortOrder: 9 },
      { slug: 'marketing_agency', name: 'Marketing Agency', iconKey: 'megaphone', sortOrder: 10 },
      { slug: 'advertising_agency', name: 'Advertising Agency', iconKey: 'megaphone', sortOrder: 11 },
      { slug: 'pr_firm', name: 'PR Firm', iconKey: 'megaphone', sortOrder: 12 },
      { slug: 'web_design', name: 'Web Design', iconKey: 'globe', sortOrder: 13 },
      { slug: 'graphic_design', name: 'Graphic Design', iconKey: 'color-palette', sortOrder: 14 },
      { slug: 'it_services', name: 'IT Services', iconKey: 'desktop', sortOrder: 15 },
      { slug: 'consulting', name: 'Consulting', iconKey: 'briefcase', sortOrder: 16 },
      { slug: 'business_coach', name: 'Business Coach', iconKey: 'trending-up', sortOrder: 17 },
      { slug: 'career_coach', name: 'Career Coach', iconKey: 'briefcase', sortOrder: 18 },
      { slug: 'life_coach', name: 'Life Coach', iconKey: 'happy', sortOrder: 19 },
      { slug: 'staffing_agency', name: 'Staffing Agency', iconKey: 'people', sortOrder: 20 },
      { slug: 'hr_services', name: 'HR Services', iconKey: 'people', sortOrder: 21 },
      { slug: 'payroll_services', name: 'Payroll Services', iconKey: 'cash', sortOrder: 22 },
      { slug: 'bookkeeping', name: 'Bookkeeping', iconKey: 'calculator', sortOrder: 23 },
      { slug: 'virtual_assistant', name: 'Virtual Assistant', iconKey: 'person', sortOrder: 24 },
      { slug: 'answering_service', name: 'Answering Service', iconKey: 'call', sortOrder: 25 },
      { slug: 'printing', name: 'Printing / Copy', iconKey: 'print', sortOrder: 26 },
      { slug: 'shipping', name: 'Shipping / Mailing', iconKey: 'mail', sortOrder: 27 },
      { slug: 'private_investigator', name: 'Private Investigator', iconKey: 'search', sortOrder: 28 },
      { slug: 'security_services', name: 'Security Services', iconKey: 'shield', sortOrder: 29 },
      { slug: 'architect', name: 'Architect', iconKey: 'home', sortOrder: 30 },
      { slug: 'engineer', name: 'Engineer', iconKey: 'build', sortOrder: 31 },
      { slug: 'surveyor', name: 'Surveyor', iconKey: 'map', sortOrder: 32 },
      { slug: 'appraiser', name: 'Appraiser', iconKey: 'home', sortOrder: 33 },
    ],
  },

  // ----------------------------------------
  // FINANCIAL SERVICES
  // ----------------------------------------
  {
    slug: 'financial',
    name: 'Financial Services',
    iconKey: 'cash',
    sortOrder: 12,
    multiEntrance: 'optional',
    optionalMultiEntranceSubcategories: ['bank'],
    subcategories: [
      { slug: 'bank', name: 'Bank', iconKey: 'cash', sortOrder: 1 },
      { slug: 'credit_union', name: 'Credit Union', iconKey: 'cash', sortOrder: 2 },
      { slug: 'atm', name: 'ATM', iconKey: 'card', sortOrder: 3 },
      { slug: 'check_cashing', name: 'Check Cashing', iconKey: 'cash', sortOrder: 4 },
      { slug: 'money_transfer', name: 'Money Transfer', iconKey: 'cash', sortOrder: 5 },
      { slug: 'currency_exchange', name: 'Currency Exchange', iconKey: 'cash', sortOrder: 6 },
      { slug: 'payday_loans', name: 'Payday Loans', iconKey: 'cash', sortOrder: 7 },
      { slug: 'title_loans', name: 'Title Loans', iconKey: 'car', sortOrder: 8 },
      { slug: 'pawn_shop', name: 'Pawn Shop', iconKey: 'cash', sortOrder: 9 },
      { slug: 'investment_firm', name: 'Investment Firm', iconKey: 'trending-up', sortOrder: 10 },
      { slug: 'stock_broker', name: 'Stock Broker', iconKey: 'trending-up', sortOrder: 11 },
      { slug: 'wealth_management', name: 'Wealth Management', iconKey: 'cash', sortOrder: 12 },
      { slug: 'financial_planning', name: 'Financial Planning', iconKey: 'calculator', sortOrder: 13 },
      { slug: 'mortgage_lender', name: 'Mortgage Lender', iconKey: 'home', sortOrder: 14 },
      { slug: 'auto_loans', name: 'Auto Loans', iconKey: 'car', sortOrder: 15 },
      { slug: 'personal_loans', name: 'Personal Loans', iconKey: 'cash', sortOrder: 16 },
      { slug: 'business_loans', name: 'Business Loans', iconKey: 'briefcase', sortOrder: 17 },
      { slug: 'insurance_company', name: 'Insurance Company', iconKey: 'shield', sortOrder: 18 },
      { slug: 'life_insurance', name: 'Life Insurance', iconKey: 'shield', sortOrder: 19 },
      { slug: 'health_insurance', name: 'Health Insurance', iconKey: 'medkit', sortOrder: 20 },
      { slug: 'auto_insurance', name: 'Auto Insurance', iconKey: 'car', sortOrder: 21 },
      { slug: 'home_insurance', name: 'Home Insurance', iconKey: 'home', sortOrder: 22 },
      { slug: 'crypto_exchange', name: 'Crypto Exchange', iconKey: 'logo-bitcoin', sortOrder: 23 },
    ],
  },

  // ----------------------------------------
  // PET SERVICES
  // ----------------------------------------
  {
    slug: 'pets',
    name: 'Pet Services',
    iconKey: 'paw',
    sortOrder: 13,
    multiEntrance: 'never',
    subcategories: [
      { slug: 'veterinarian', name: 'Veterinarian', iconKey: 'medkit', sortOrder: 1 },
      { slug: 'emergency_vet', name: 'Emergency Vet', iconKey: 'medkit', sortOrder: 2 },
      { slug: 'animal_hospital', name: 'Animal Hospital', iconKey: 'medkit', sortOrder: 3 },
      { slug: 'pet_store_pets', name: 'Pet Store', iconKey: 'paw', sortOrder: 4 },
      { slug: 'pet_grooming', name: 'Pet Grooming', iconKey: 'cut', sortOrder: 5 },
      { slug: 'pet_boarding', name: 'Pet Boarding / Kennel', iconKey: 'home', sortOrder: 6 },
      { slug: 'doggy_daycare', name: 'Doggy Daycare', iconKey: 'paw', sortOrder: 7 },
      { slug: 'dog_training', name: 'Dog Training', iconKey: 'paw', sortOrder: 8 },
      { slug: 'dog_walking', name: 'Dog Walking', iconKey: 'walk', sortOrder: 9 },
      { slug: 'pet_sitting', name: 'Pet Sitting', iconKey: 'home', sortOrder: 10 },
      { slug: 'pet_adoption', name: 'Pet Adoption / Rescue', iconKey: 'heart', sortOrder: 11 },
      { slug: 'animal_shelter', name: 'Animal Shelter', iconKey: 'home', sortOrder: 12 },
      { slug: 'pet_cemetery', name: 'Pet Cemetery', iconKey: 'flower', sortOrder: 13 },
      { slug: 'pet_cremation', name: 'Pet Cremation', iconKey: 'flame', sortOrder: 14 },
      { slug: 'aquarium_store', name: 'Aquarium Store', iconKey: 'fish', sortOrder: 15 },
      { slug: 'bird_store', name: 'Bird Store', iconKey: 'paw', sortOrder: 16 },
      { slug: 'reptile_store', name: 'Reptile Store', iconKey: 'paw', sortOrder: 17 },
      { slug: 'pet_photography', name: 'Pet Photography', iconKey: 'camera', sortOrder: 18 },
      { slug: 'mobile_vet', name: 'Mobile Vet', iconKey: 'car', sortOrder: 19 },
      { slug: 'holistic_pet', name: 'Holistic Pet Care', iconKey: 'leaf', sortOrder: 20 },
    ],
  },

  // ----------------------------------------
  // EDUCATION
  // ----------------------------------------
  {
    slug: 'education',
    name: 'Education',
    iconKey: 'school',
    sortOrder: 14,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['university', 'community_college'],
    optionalMultiEntranceSubcategories: ['high_school', 'private_school'],
    subcategories: [
      { slug: 'preschool', name: 'Preschool / Daycare', iconKey: 'happy', sortOrder: 1 },
      { slug: 'elementary_school', name: 'Elementary School', iconKey: 'school', sortOrder: 2 },
      { slug: 'middle_school', name: 'Middle School', iconKey: 'school', sortOrder: 3 },
      { slug: 'high_school', name: 'High School', iconKey: 'school', sortOrder: 4 },
      { slug: 'charter_school', name: 'Charter School', iconKey: 'school', sortOrder: 5 },
      { slug: 'private_school', name: 'Private School', iconKey: 'school', sortOrder: 6 },
      { slug: 'boarding_school', name: 'Boarding School', iconKey: 'school', sortOrder: 7 },
      { slug: 'montessori', name: 'Montessori School', iconKey: 'school', sortOrder: 8 },
      { slug: 'waldorf', name: 'Waldorf School', iconKey: 'school', sortOrder: 9 },
      { slug: 'special_education', name: 'Special Education', iconKey: 'school', sortOrder: 10 },
      { slug: 'vocational_school', name: 'Vocational School', iconKey: 'build', sortOrder: 11 },
      { slug: 'trade_school', name: 'Trade School', iconKey: 'hammer', sortOrder: 12 },
      { slug: 'community_college', name: 'Community College', iconKey: 'school', sortOrder: 13 },
      { slug: 'university', name: 'University', iconKey: 'school', sortOrder: 14 },
      { slug: 'graduate_school', name: 'Graduate School', iconKey: 'school', sortOrder: 15 },
      { slug: 'law_school', name: 'Law School', iconKey: 'briefcase', sortOrder: 16 },
      { slug: 'medical_school', name: 'Medical School', iconKey: 'medkit', sortOrder: 17 },
      { slug: 'business_school', name: 'Business School', iconKey: 'briefcase', sortOrder: 18 },
      { slug: 'art_school', name: 'Art School', iconKey: 'color-palette', sortOrder: 19 },
      { slug: 'music_school', name: 'Music School', iconKey: 'musical-notes', sortOrder: 20 },
      { slug: 'culinary_school', name: 'Culinary School', iconKey: 'restaurant', sortOrder: 21 },
      { slug: 'cosmetology_school', name: 'Cosmetology School', iconKey: 'cut', sortOrder: 22 },
      { slug: 'driving_school', name: 'Driving School', iconKey: 'car', sortOrder: 23 },
      { slug: 'flight_school', name: 'Flight School', iconKey: 'airplane', sortOrder: 24 },
      { slug: 'language_school', name: 'Language School', iconKey: 'language', sortOrder: 25 },
      { slug: 'test_prep', name: 'Test Prep', iconKey: 'document', sortOrder: 26 },
      { slug: 'tutoring', name: 'Tutoring Center', iconKey: 'book', sortOrder: 27 },
      { slug: 'learning_center', name: 'Learning Center', iconKey: 'book', sortOrder: 28 },
      { slug: 'coding_bootcamp', name: 'Coding Bootcamp', iconKey: 'code', sortOrder: 29 },
      { slug: 'online_school', name: 'Online School', iconKey: 'globe', sortOrder: 30 },
      { slug: 'adult_education', name: 'Adult Education', iconKey: 'school', sortOrder: 31 },
      { slug: 'library', name: 'Library', iconKey: 'library', sortOrder: 32 },
    ],
  },

  // ----------------------------------------
  // ARTS & CULTURE
  // ----------------------------------------
  {
    slug: 'arts',
    name: 'Arts & Culture',
    iconKey: 'color-palette',
    sortOrder: 15,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['zoo', 'aquarium'],
    optionalMultiEntranceSubcategories: ['art_museum', 'history_museum', 'science_museum', 'botanical_garden'],
    subcategories: [
      { slug: 'art_museum', name: 'Art Museum', iconKey: 'color-palette', sortOrder: 1 },
      { slug: 'history_museum', name: 'History Museum', iconKey: 'time', sortOrder: 2 },
      { slug: 'science_museum', name: 'Science Museum', iconKey: 'flask', sortOrder: 3 },
      { slug: 'natural_history', name: 'Natural History Museum', iconKey: 'leaf', sortOrder: 4 },
      { slug: 'childrens_museum', name: "Children's Museum", iconKey: 'happy', sortOrder: 5 },
      { slug: 'technology_museum', name: 'Technology Museum', iconKey: 'hardware-chip', sortOrder: 6 },
      { slug: 'military_museum', name: 'Military Museum', iconKey: 'shield', sortOrder: 7 },
      { slug: 'maritime_museum', name: 'Maritime Museum', iconKey: 'boat', sortOrder: 8 },
      { slug: 'aviation_museum', name: 'Aviation Museum', iconKey: 'airplane', sortOrder: 9 },
      { slug: 'sports_museum', name: 'Sports Museum', iconKey: 'football', sortOrder: 10 },
      { slug: 'cultural_center', name: 'Cultural Center', iconKey: 'people', sortOrder: 11 },
      { slug: 'art_gallery', name: 'Art Gallery', iconKey: 'image', sortOrder: 12 },
      { slug: 'photography_gallery', name: 'Photography Gallery', iconKey: 'camera', sortOrder: 13 },
      { slug: 'sculpture_garden', name: 'Sculpture Garden', iconKey: 'color-palette', sortOrder: 14 },
      { slug: 'planetarium', name: 'Planetarium', iconKey: 'planet', sortOrder: 15 },
      { slug: 'observatory', name: 'Observatory', iconKey: 'telescope', sortOrder: 16 },
      { slug: 'aquarium', name: 'Aquarium', iconKey: 'fish', sortOrder: 17 },
      { slug: 'zoo', name: 'Zoo', iconKey: 'paw', sortOrder: 18 },
      { slug: 'botanical_garden', name: 'Botanical Garden', iconKey: 'flower', sortOrder: 19 },
      { slug: 'arboretum', name: 'Arboretum', iconKey: 'leaf', sortOrder: 20 },
      { slug: 'historic_site', name: 'Historic Site', iconKey: 'time', sortOrder: 21 },
      { slug: 'monument', name: 'Monument', iconKey: 'flag', sortOrder: 22 },
      { slug: 'memorial', name: 'Memorial', iconKey: 'flower', sortOrder: 23 },
      { slug: 'landmark', name: 'Landmark', iconKey: 'location', sortOrder: 24 },
      { slug: 'heritage_site', name: 'Heritage Site', iconKey: 'time', sortOrder: 25 },
      { slug: 'archaeological_site', name: 'Archaeological Site', iconKey: 'search', sortOrder: 26 },
      { slug: 'castle_palace', name: 'Castle / Palace', iconKey: 'home', sortOrder: 27 },
      { slug: 'library_arts', name: 'Library', iconKey: 'library', sortOrder: 28 },
      { slug: 'archive', name: 'Archive', iconKey: 'folder', sortOrder: 29 },
      { slug: 'artist_studio', name: 'Artist Studio', iconKey: 'color-palette', sortOrder: 30 },
    ],
  },

  // ----------------------------------------
  // ENTERTAINMENT
  // ----------------------------------------
  {
    slug: 'entertainment',
    name: 'Entertainment',
    iconKey: 'game-controller',
    sortOrder: 16,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['theme_park', 'water_park', 'stadium', 'arena'],
    optionalMultiEntranceSubcategories: ['casino', 'amusement_center'],
    subcategories: [
      { slug: 'movie_theater', name: 'Movie Theater', iconKey: 'film', sortOrder: 1 },
      { slug: 'drive_in', name: 'Drive-In Theater', iconKey: 'car', sortOrder: 2 },
      { slug: 'performing_arts', name: 'Performing Arts Theater', iconKey: 'mic', sortOrder: 3 },
      { slug: 'concert_hall', name: 'Concert Hall', iconKey: 'musical-notes', sortOrder: 4 },
      { slug: 'opera_house', name: 'Opera House', iconKey: 'musical-notes', sortOrder: 5 },
      { slug: 'comedy_club_ent', name: 'Comedy Club', iconKey: 'happy', sortOrder: 6 },
      { slug: 'magic_show', name: 'Magic Show', iconKey: 'sparkles', sortOrder: 7 },
      { slug: 'dinner_theater', name: 'Dinner Theater', iconKey: 'restaurant', sortOrder: 8 },
      { slug: 'escape_room', name: 'Escape Room', iconKey: 'key', sortOrder: 9 },
      { slug: 'vr_experience', name: 'VR / AR Experience', iconKey: 'glasses', sortOrder: 10 },
      { slug: 'arcade', name: 'Arcade', iconKey: 'game-controller', sortOrder: 11 },
      { slug: 'gaming_center', name: 'Gaming Center', iconKey: 'game-controller', sortOrder: 12 },
      { slug: 'casino', name: 'Casino', iconKey: 'dice', sortOrder: 13 },
      { slug: 'bingo_hall', name: 'Bingo Hall', iconKey: 'grid', sortOrder: 14 },
      { slug: 'bowling_ent', name: 'Bowling Alley', iconKey: 'ellipse', sortOrder: 15 },
      { slug: 'pool_hall_ent', name: 'Pool Hall', iconKey: 'ellipse', sortOrder: 16 },
      { slug: 'laser_tag_ent', name: 'Laser Tag', iconKey: 'flash', sortOrder: 17 },
      { slug: 'paintball', name: 'Paintball', iconKey: 'color-fill', sortOrder: 18 },
      { slug: 'go_karts_ent', name: 'Go-Karts', iconKey: 'car', sortOrder: 19 },
      { slug: 'mini_golf_ent', name: 'Mini Golf', iconKey: 'golf', sortOrder: 20 },
      { slug: 'batting_cages_ent', name: 'Batting Cages', iconKey: 'baseball', sortOrder: 21 },
      { slug: 'trampoline_ent', name: 'Trampoline Park', iconKey: 'arrow-up', sortOrder: 22 },
      { slug: 'indoor_playground', name: 'Indoor Playground', iconKey: 'happy', sortOrder: 23 },
      { slug: 'amusement_center', name: 'Amusement Center', iconKey: 'happy', sortOrder: 24 },
      { slug: 'water_park', name: 'Water Park', iconKey: 'water', sortOrder: 25 },
      { slug: 'theme_park', name: 'Theme Park', iconKey: 'happy', sortOrder: 26 },
      { slug: 'haunted_house', name: 'Haunted House', iconKey: 'skull', sortOrder: 27 },
      { slug: 'axe_throwing', name: 'Axe Throwing', iconKey: 'flash', sortOrder: 28 },
      { slug: 'shooting_range', name: 'Shooting Range', iconKey: 'locate', sortOrder: 29 },
      { slug: 'racing_track', name: 'Racing Track', iconKey: 'car', sortOrder: 30 },
      { slug: 'stadium', name: 'Stadium', iconKey: 'football', sortOrder: 31 },
      { slug: 'arena', name: 'Arena', iconKey: 'people', sortOrder: 32 },
    ],
  },

  // ----------------------------------------
  // PARKS & OUTDOORS
  // ----------------------------------------
  {
    slug: 'outdoors',
    name: 'Parks & Outdoors',
    iconKey: 'leaf',
    sortOrder: 17,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['national_park', 'state_park'],
    optionalMultiEntranceSubcategories: ['city_park', 'nature_preserve', 'beach', 'ski_resort'],
    subcategories: [
      { slug: 'city_park', name: 'City Park', iconKey: 'leaf', sortOrder: 1 },
      { slug: 'state_park', name: 'State Park', iconKey: 'leaf', sortOrder: 2 },
      { slug: 'national_park', name: 'National Park', iconKey: 'leaf', sortOrder: 3 },
      { slug: 'nature_preserve', name: 'Nature Preserve', iconKey: 'leaf', sortOrder: 4 },
      { slug: 'wildlife_refuge', name: 'Wildlife Refuge', iconKey: 'paw', sortOrder: 5 },
      { slug: 'forest', name: 'Forest', iconKey: 'leaf', sortOrder: 6 },
      { slug: 'beach', name: 'Beach', iconKey: 'umbrella', sortOrder: 7 },
      { slug: 'lake', name: 'Lake', iconKey: 'water', sortOrder: 8 },
      { slug: 'river_access', name: 'River Access', iconKey: 'water', sortOrder: 9 },
      { slug: 'hiking_trail', name: 'Hiking Trail', iconKey: 'walk', sortOrder: 10 },
      { slug: 'biking_trail', name: 'Biking Trail', iconKey: 'bicycle', sortOrder: 11 },
      { slug: 'campground_out', name: 'Campground', iconKey: 'bonfire', sortOrder: 12 },
      { slug: 'picnic_area', name: 'Picnic Area', iconKey: 'restaurant', sortOrder: 13 },
      { slug: 'dog_park', name: 'Dog Park', iconKey: 'paw', sortOrder: 14 },
      { slug: 'playground_out', name: 'Playground', iconKey: 'happy', sortOrder: 15 },
      { slug: 'sports_field', name: 'Sports Field', iconKey: 'football', sortOrder: 16 },
      { slug: 'golf_course_out', name: 'Golf Course', iconKey: 'golf', sortOrder: 17 },
      { slug: 'disc_golf', name: 'Disc Golf', iconKey: 'disc', sortOrder: 18 },
      { slug: 'skate_park_out', name: 'Skate Park', iconKey: 'bicycle', sortOrder: 19 },
      { slug: 'bmx_park', name: 'BMX Park', iconKey: 'bicycle', sortOrder: 20 },
      { slug: 'fishing_spot', name: 'Fishing Spot', iconKey: 'fish', sortOrder: 21 },
      { slug: 'boat_launch', name: 'Boat Launch', iconKey: 'boat', sortOrder: 22 },
      { slug: 'marina', name: 'Marina', iconKey: 'boat', sortOrder: 23 },
      { slug: 'kayak_launch', name: 'Kayak / Canoe Launch', iconKey: 'boat', sortOrder: 24 },
      { slug: 'surf_spot', name: 'Surf Spot', iconKey: 'water', sortOrder: 25 },
      { slug: 'dive_site', name: 'Dive Site', iconKey: 'water', sortOrder: 26 },
      { slug: 'rock_climbing_out', name: 'Rock Climbing Area', iconKey: 'trending-up', sortOrder: 27 },
      { slug: 'ski_resort', name: 'Ski Resort', iconKey: 'snow', sortOrder: 28 },
      { slug: 'mountain', name: 'Mountain', iconKey: 'trending-up', sortOrder: 29 },
      { slug: 'scenic_viewpoint', name: 'Scenic Viewpoint', iconKey: 'eye', sortOrder: 30 },
      { slug: 'waterfall', name: 'Waterfall', iconKey: 'water', sortOrder: 31 },
      { slug: 'cave', name: 'Cave', iconKey: 'flashlight', sortOrder: 32 },
      { slug: 'hot_springs', name: 'Hot Springs', iconKey: 'water', sortOrder: 33 },
      { slug: 'garden', name: 'Garden', iconKey: 'flower', sortOrder: 34 },
      { slug: 'farm_ranch', name: 'Farm / Ranch', iconKey: 'leaf', sortOrder: 35 },
      { slug: 'vineyard', name: 'Vineyard / Winery', iconKey: 'wine', sortOrder: 36 },
      { slug: 'orchard', name: 'Orchard', iconKey: 'leaf', sortOrder: 37 },
    ],
  },

  // ----------------------------------------
  // TRANSPORTATION
  // ----------------------------------------
  {
    slug: 'transportation',
    name: 'Transportation',
    iconKey: 'car',
    sortOrder: 18,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['airport', 'train_station', 'bus_station', 'cruise_port'],
    optionalMultiEntranceSubcategories: ['subway_station', 'ferry_terminal', 'parking_garage'],
    subcategories: [
      { slug: 'airport', name: 'Airport', iconKey: 'airplane', sortOrder: 1 },
      { slug: 'train_station', name: 'Train Station', iconKey: 'train', sortOrder: 2 },
      { slug: 'bus_station', name: 'Bus Station', iconKey: 'bus', sortOrder: 3 },
      { slug: 'subway_station', name: 'Subway / Metro Station', iconKey: 'subway', sortOrder: 4 },
      { slug: 'ferry_terminal', name: 'Ferry Terminal', iconKey: 'boat', sortOrder: 5 },
      { slug: 'cruise_port', name: 'Cruise Port', iconKey: 'boat', sortOrder: 6 },
      { slug: 'taxi_stand', name: 'Taxi Stand', iconKey: 'car', sortOrder: 7 },
      { slug: 'rideshare_pickup', name: 'Rideshare Pickup', iconKey: 'car', sortOrder: 8 },
      { slug: 'car_rental_trans', name: 'Car Rental', iconKey: 'car', sortOrder: 9 },
      { slug: 'truck_rental_trans', name: 'Truck Rental', iconKey: 'car', sortOrder: 10 },
      { slug: 'bike_rental', name: 'Bike Rental', iconKey: 'bicycle', sortOrder: 11 },
      { slug: 'scooter_rental', name: 'Scooter Rental', iconKey: 'bicycle', sortOrder: 12 },
      { slug: 'limo_service', name: 'Limousine Service', iconKey: 'car', sortOrder: 13 },
      { slug: 'shuttle_service', name: 'Shuttle Service', iconKey: 'bus', sortOrder: 14 },
      { slug: 'charter_bus', name: 'Charter Bus', iconKey: 'bus', sortOrder: 15 },
      { slug: 'private_jet', name: 'Private Jet', iconKey: 'airplane', sortOrder: 16 },
      { slug: 'helicopter', name: 'Helicopter Service', iconKey: 'airplane', sortOrder: 17 },
      { slug: 'parking_lot', name: 'Parking Lot', iconKey: 'car', sortOrder: 18 },
      { slug: 'parking_garage', name: 'Parking Garage', iconKey: 'car', sortOrder: 19 },
      { slug: 'valet', name: 'Valet Parking', iconKey: 'car', sortOrder: 20 },
      { slug: 'toll_plaza', name: 'Toll Plaza', iconKey: 'cash', sortOrder: 21 },
      { slug: 'rest_area', name: 'Rest Area', iconKey: 'bed', sortOrder: 22 },
      { slug: 'truck_stop', name: 'Truck Stop', iconKey: 'car', sortOrder: 23 },
      { slug: 'weigh_station', name: 'Weigh Station', iconKey: 'scale', sortOrder: 24 },
      { slug: 'port_harbor', name: 'Port / Harbor', iconKey: 'boat', sortOrder: 25 },
      { slug: 'helipad', name: 'Helipad', iconKey: 'airplane', sortOrder: 26 },
    ],
  },

  // ----------------------------------------
  // GOVERNMENT & PUBLIC SERVICES
  // ----------------------------------------
  {
    slug: 'government',
    name: 'Government & Public Services',
    iconKey: 'business',
    sortOrder: 19,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['military_base'],
    optionalMultiEntranceSubcategories: ['city_hall', 'courthouse'],
    subcategories: [
      { slug: 'city_hall', name: 'City Hall', iconKey: 'business', sortOrder: 1 },
      { slug: 'county_office', name: 'County Office', iconKey: 'business', sortOrder: 2 },
      { slug: 'state_office', name: 'State Office', iconKey: 'business', sortOrder: 3 },
      { slug: 'federal_office', name: 'Federal Office', iconKey: 'business', sortOrder: 4 },
      { slug: 'dmv_gov', name: 'DMV', iconKey: 'car', sortOrder: 5 },
      { slug: 'post_office', name: 'Post Office', iconKey: 'mail', sortOrder: 6 },
      { slug: 'courthouse', name: 'Courthouse', iconKey: 'briefcase', sortOrder: 7 },
      { slug: 'police_station', name: 'Police Station', iconKey: 'shield', sortOrder: 8 },
      { slug: 'fire_station', name: 'Fire Station', iconKey: 'flame', sortOrder: 9 },
      { slug: 'sheriff', name: "Sheriff's Office", iconKey: 'shield', sortOrder: 10 },
      { slug: 'prison', name: 'Prison / Jail', iconKey: 'lock-closed', sortOrder: 11 },
      { slug: 'probation', name: 'Probation Office', iconKey: 'document', sortOrder: 12 },
      { slug: 'social_services', name: 'Social Services', iconKey: 'people', sortOrder: 13 },
      { slug: 'unemployment', name: 'Unemployment Office', iconKey: 'briefcase', sortOrder: 14 },
      { slug: 'tax_office', name: 'Tax Office', iconKey: 'cash', sortOrder: 15 },
      { slug: 'passport_office', name: 'Passport Office', iconKey: 'document', sortOrder: 16 },
      { slug: 'immigration', name: 'Immigration Office', iconKey: 'globe', sortOrder: 17 },
      { slug: 'military_base', name: 'Military Base', iconKey: 'shield', sortOrder: 18 },
      { slug: 'recruiting', name: 'Recruiting Office', iconKey: 'people', sortOrder: 19 },
      { slug: 'veterans_affairs', name: 'Veterans Affairs', iconKey: 'shield', sortOrder: 20 },
      { slug: 'public_health', name: 'Public Health', iconKey: 'medkit', sortOrder: 21 },
      { slug: 'water_dept', name: 'Water Department', iconKey: 'water', sortOrder: 22 },
      { slug: 'utility', name: 'Utility Company', iconKey: 'flash', sortOrder: 23 },
      { slug: 'waste_management', name: 'Waste Management', iconKey: 'trash', sortOrder: 24 },
      { slug: 'parks_dept', name: 'Parks Department', iconKey: 'leaf', sortOrder: 25 },
      { slug: 'planning_zoning', name: 'Planning / Zoning', iconKey: 'map', sortOrder: 26 },
      { slug: 'building_permits', name: 'Building Permits', iconKey: 'document', sortOrder: 27 },
      { slug: 'marriage_license', name: 'Marriage License', iconKey: 'heart', sortOrder: 28 },
      { slug: 'vital_records', name: 'Birth / Death Records', iconKey: 'document', sortOrder: 29 },
      { slug: 'voter_registration', name: 'Voter Registration', iconKey: 'checkbox', sortOrder: 30 },
      { slug: 'embassy', name: 'Embassy / Consulate', iconKey: 'flag', sortOrder: 31 },
    ],
  },

  // ----------------------------------------
  // RELIGIOUS ORGANIZATIONS
  // ----------------------------------------
  {
    slug: 'religious',
    name: 'Religious Organizations',
    iconKey: 'heart',
    sortOrder: 20,
    multiEntrance: 'optional',
    optionalMultiEntranceSubcategories: ['megachurch'],
    subcategories: [
      { slug: 'church', name: 'Church', iconKey: 'heart', sortOrder: 1 },
      { slug: 'catholic_church', name: 'Catholic Church', iconKey: 'heart', sortOrder: 2 },
      { slug: 'protestant_church', name: 'Protestant Church', iconKey: 'heart', sortOrder: 3 },
      { slug: 'orthodox_church', name: 'Orthodox Church', iconKey: 'heart', sortOrder: 4 },
      { slug: 'baptist_church', name: 'Baptist Church', iconKey: 'heart', sortOrder: 5 },
      { slug: 'methodist_church', name: 'Methodist Church', iconKey: 'heart', sortOrder: 6 },
      { slug: 'lutheran_church', name: 'Lutheran Church', iconKey: 'heart', sortOrder: 7 },
      { slug: 'presbyterian_church', name: 'Presbyterian Church', iconKey: 'heart', sortOrder: 8 },
      { slug: 'episcopal_church', name: 'Episcopal Church', iconKey: 'heart', sortOrder: 9 },
      { slug: 'pentecostal_church', name: 'Pentecostal Church', iconKey: 'heart', sortOrder: 10 },
      { slug: 'non_denominational', name: 'Non-Denominational Church', iconKey: 'heart', sortOrder: 11 },
      { slug: 'megachurch', name: 'Megachurch', iconKey: 'people', sortOrder: 12 },
      { slug: 'synagogue', name: 'Synagogue', iconKey: 'star', sortOrder: 13 },
      { slug: 'mosque', name: 'Mosque', iconKey: 'moon', sortOrder: 14 },
      { slug: 'islamic_center', name: 'Islamic Center', iconKey: 'moon', sortOrder: 15 },
      { slug: 'hindu_temple', name: 'Hindu Temple', iconKey: 'flower', sortOrder: 16 },
      { slug: 'buddhist_temple', name: 'Buddhist Temple', iconKey: 'flower', sortOrder: 17 },
      { slug: 'sikh_gurdwara', name: 'Sikh Gurdwara', iconKey: 'heart', sortOrder: 18 },
      { slug: 'jain_temple', name: 'Jain Temple', iconKey: 'heart', sortOrder: 19 },
      { slug: 'shinto_shrine', name: 'Shinto Shrine', iconKey: 'flower', sortOrder: 20 },
      { slug: 'taoist_temple', name: 'Taoist Temple', iconKey: 'flower', sortOrder: 21 },
      { slug: 'bahai_center', name: "Baha'i Center", iconKey: 'star', sortOrder: 22 },
      { slug: 'quaker_meeting', name: 'Quaker Meeting', iconKey: 'heart', sortOrder: 23 },
      { slug: 'unitarian_church', name: 'Unitarian Church', iconKey: 'heart', sortOrder: 24 },
      { slug: 'scientology', name: 'Scientology Church', iconKey: 'heart', sortOrder: 25 },
      { slug: 'lds_mormon', name: 'LDS / Mormon Church', iconKey: 'heart', sortOrder: 26 },
      { slug: 'jehovah_witness', name: "Jehovah's Witness", iconKey: 'heart', sortOrder: 27 },
      { slug: 'seventh_day', name: 'Seventh-day Adventist', iconKey: 'heart', sortOrder: 28 },
      { slug: 'meditation_center', name: 'Meditation Center', iconKey: 'body', sortOrder: 29 },
      { slug: 'spiritual_center', name: 'Spiritual Center', iconKey: 'sparkles', sortOrder: 30 },
      { slug: 'cemetery', name: 'Cemetery', iconKey: 'flower', sortOrder: 31 },
      { slug: 'funeral_home', name: 'Funeral Home', iconKey: 'flower', sortOrder: 32 },
      { slug: 'crematorium', name: 'Crematorium', iconKey: 'flame', sortOrder: 33 },
    ],
  },

  // ----------------------------------------
  // EVENTS & VENUES
  // ----------------------------------------
  {
    slug: 'events',
    name: 'Events & Venues',
    iconKey: 'calendar',
    sortOrder: 21,
    multiEntrance: 'optional',
    alwaysMultiEntranceSubcategories: ['convention_center', 'expo_center', 'fairgrounds'],
    optionalMultiEntranceSubcategories: ['conference_center', 'outdoor_venue'],
    subcategories: [
      { slug: 'wedding_venue', name: 'Wedding Venue', iconKey: 'heart', sortOrder: 1 },
      { slug: 'banquet_hall', name: 'Banquet Hall', iconKey: 'restaurant', sortOrder: 2 },
      { slug: 'conference_center', name: 'Conference Center', iconKey: 'people', sortOrder: 3 },
      { slug: 'convention_center', name: 'Convention Center', iconKey: 'people', sortOrder: 4 },
      { slug: 'expo_center', name: 'Expo Center', iconKey: 'storefront', sortOrder: 5 },
      { slug: 'event_space', name: 'Event Space', iconKey: 'calendar', sortOrder: 6 },
      { slug: 'party_venue', name: 'Party Venue', iconKey: 'happy', sortOrder: 7 },
      { slug: 'meeting_room', name: 'Meeting Room', iconKey: 'people', sortOrder: 8 },
      { slug: 'coworking', name: 'Coworking Space', iconKey: 'desktop', sortOrder: 9 },
      { slug: 'hotel_ballroom', name: 'Hotel Ballroom', iconKey: 'bed', sortOrder: 10 },
      { slug: 'restaurant_private', name: 'Restaurant Private Room', iconKey: 'restaurant', sortOrder: 11 },
      { slug: 'outdoor_venue', name: 'Outdoor Venue', iconKey: 'sunny', sortOrder: 12 },
      { slug: 'garden_venue', name: 'Garden Venue', iconKey: 'flower', sortOrder: 13 },
      { slug: 'barn_venue', name: 'Barn Venue', iconKey: 'home', sortOrder: 14 },
      { slug: 'winery_venue', name: 'Winery Venue', iconKey: 'wine', sortOrder: 15 },
      { slug: 'beach_venue', name: 'Beach Venue', iconKey: 'umbrella', sortOrder: 16 },
      { slug: 'rooftop_venue', name: 'Rooftop Venue', iconKey: 'sunny', sortOrder: 17 },
      { slug: 'loft_space', name: 'Loft Space', iconKey: 'home', sortOrder: 18 },
      { slug: 'gallery_venue', name: 'Art Gallery Venue', iconKey: 'image', sortOrder: 19 },
      { slug: 'museum_venue', name: 'Museum Venue', iconKey: 'business', sortOrder: 20 },
      { slug: 'historic_venue', name: 'Historic Venue', iconKey: 'time', sortOrder: 21 },
      { slug: 'country_club_venue', name: 'Country Club', iconKey: 'golf', sortOrder: 22 },
      { slug: 'golf_club_venue', name: 'Golf Club', iconKey: 'golf', sortOrder: 23 },
      { slug: 'yacht_club', name: 'Yacht Club', iconKey: 'boat', sortOrder: 24 },
      { slug: 'community_hall', name: 'Community Hall', iconKey: 'people', sortOrder: 25 },
      { slug: 'vfw_hall', name: 'VFW / Legion Hall', iconKey: 'shield', sortOrder: 26 },
      { slug: 'fairgrounds', name: 'Fairgrounds', iconKey: 'ribbon', sortOrder: 27 },
      { slug: 'amphitheater', name: 'Amphitheater', iconKey: 'mic', sortOrder: 28 },
    ],
  },

  // ----------------------------------------
  // OTHER
  // ----------------------------------------
  {
    slug: 'other',
    name: 'Other',
    iconKey: 'ellipsis-horizontal',
    sortOrder: 99,
    multiEntrance: 'optional',
    subcategories: [
      { slug: 'custom_category', name: 'Custom Category', iconKey: 'create', sortOrder: 1 },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a primary category by slug
 */
export function getPrimaryCategory(slug: string): PrimaryCategory | undefined {
  return PRIMARY_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Get a subcategory by slug (searches all primary categories)
 */
export function getSubcategory(slug: string): { primary: PrimaryCategory; subcategory: SubCategory } | undefined {
  for (const primary of PRIMARY_CATEGORIES) {
    const subcategory = primary.subcategories.find(sub => sub.slug === slug);
    if (subcategory) {
      return { primary, subcategory };
    }
  }
  return undefined;
}

/**
 * Get all subcategories for a primary category
 */
export function getSubcategories(primarySlug: string): SubCategory[] {
  const primary = getPrimaryCategory(primarySlug);
  return primary?.subcategories || [];
}

/**
 * Determine if multi-entrance should be shown for a category
 */
export function shouldShowMultipleEntrances(
  contentType: ContentType,
  primarySlug: string,
  subcategorySlug?: string
): MultiEntranceRequirement {
  // Universe content type always requires multi-entrance
  if (contentType === 'universe') {
    return 'always';
  }

  // Service businesses never have entrances
  if (contentType === 'service_business') {
    return 'never';
  }

  // Cities don't have entrances
  if (contentType === 'city') {
    return 'never';
  }

  const primary = getPrimaryCategory(primarySlug);
  if (!primary) {
    return 'never';
  }

  // Check if subcategory always requires multi-entrance
  if (subcategorySlug && primary.alwaysMultiEntranceSubcategories?.includes(subcategorySlug)) {
    return 'always';
  }

  // Check if subcategory optionally supports multi-entrance
  if (subcategorySlug && primary.optionalMultiEntranceSubcategories?.includes(subcategorySlug)) {
    return 'optional';
  }

  // Return the primary category's default
  return primary.multiEntrance;
}

/**
 * Get content types that are allowed for a category
 */
export function getAllowedContentTypes(primarySlug: string): ContentType[] {
  return CONTENT_TYPES.filter(ct => 
    ct.allowedCategories.length === 0 || ct.allowedCategories.includes(primarySlug)
  ).map(ct => ct.id);
}

/**
 * Get categories allowed for a content type
 */
export function getCategoriesForContentType(contentType: ContentType): PrimaryCategory[] {
  const config = CONTENT_TYPES.find(ct => ct.id === contentType);
  if (!config || config.allowedCategories.length === 0) {
    return contentType === 'city' ? [] : PRIMARY_CATEGORIES;
  }
  return PRIMARY_CATEGORIES.filter(cat => config.allowedCategories.includes(cat.slug));
}

/**
 * Search categories by name (for autocomplete)
 */
export function searchCategories(query: string): Array<{ primary: PrimaryCategory; subcategory?: SubCategory }> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: Array<{ primary: PrimaryCategory; subcategory?: SubCategory }> = [];

  for (const primary of PRIMARY_CATEGORIES) {
    // Check primary category name
    if (primary.name.toLowerCase().includes(normalizedQuery)) {
      results.push({ primary });
    }

    // Check subcategories
    for (const sub of primary.subcategories) {
      if (sub.name.toLowerCase().includes(normalizedQuery)) {
        results.push({ primary, subcategory: sub });
      }
    }
  }

  return results.slice(0, 20); // Limit results
}

// Export default for convenience
export default {
  CONTENT_TYPES,
  PRIMARY_CATEGORIES,
  getPrimaryCategory,
  getSubcategory,
  getSubcategories,
  shouldShowMultipleEntrances,
  getAllowedContentTypes,
  getCategoriesForContentType,
  searchCategories,
};