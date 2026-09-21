/**
 * Tavvy Category Display Configuration
 * 
 * This file provides display configurations for PlaceDetailsScreen
 * based on the category system. It determines which fields to show,
 * how to format them, and category-specific display logic.
 * 
 * Path: lib/categoryDisplayConfig.ts
 */

import { Ionicons } from '@expo/vector-icons';
import { getPrimaryCategory, getSubcategory, PRIMARY_CATEGORIES, shouldShowMultipleEntrances, ContentType } from './categoryConfig';
import { mapCategoryToBusinessType, BusinessType } from './businessTypeConfig';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DisplayField {
  field: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  format?: (value: any) => string;
  showIf?: (place: any) => boolean;
}

export interface CategoryDisplayConfig {
  primaryCategory: string;
  subcategories?: string[];
  // Header display
  headerFields: DisplayField[];
  // Quick info pills
  quickInfoFields: DisplayField[];
  // Detail sections
  detailSections: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    fields: DisplayField[];
  }[];
  // Show entrances tab
  showEntrancesTab: boolean;
  // Category-specific tabs
  additionalTabs?: {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[];
}

// ============================================
// CATEGORY EMOJI MAPPING (Extended)
// ============================================

export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Restaurants & Dining
  'restaurants': '🍽️',
  'american': '🍔',
  'italian': '🍝',
  'mexican': '🌮',
  'chinese': '🥡',
  'japanese': '🍣',
  'thai': '🍜',
  'indian': '🍛',
  'mediterranean': '🥙',
  'french': '🥐',
  'korean': '🍲',
  'vietnamese': '🍜',
  'greek': '🥗',
  'seafood': '🦞',
  'steakhouse': '🥩',
  'bbq': '🍖',
  'pizza': '🍕',
  'burgers': '🍔',
  'sandwiches': '🥪',
  'vegetarian_vegan': '🥬',
  'fine_dining': '🍷',
  'fast_food': '🍟',
  'brunch': '🥞',
  
  // Cafes & Coffee
  'cafes': '☕',
  'coffee_shop': '☕',
  'tea_house': '🍵',
  'bubble_tea': '🧋',
  'juice_bar': '🧃',
  'bakery_cafe': '🥐',
  'dessert_cafe': '🍰',
  
  // Bars & Nightlife
  'nightlife': '🍸',
  'bar': '🍺',
  'sports_bar': '🏈',
  'wine_bar': '🍷',
  'cocktail_bar': '🍹',
  'brewery': '🍺',
  'nightclub': '🎉',
  'lounge': '🛋️',
  'karaoke_bar': '🎤',
  'comedy_club': '😂',
  'jazz_club': '🎷',
  'live_music_venue': '🎸',
  
  // Hotels & Lodging
  'lodging': '🏨',
  'hotel': '🏨',
  'boutique_hotel': '🏩',
  'resort': '🏖️',
  'motel': '🏨',
  'bed_breakfast': '🛏️',
  'hostel': '🛏️',
  'vacation_rental': '🏠',
  'cabin': '🏕️',
  'campground': '⛺',
  'rv_park': '🚐',
  
  // RV & Camping
  'rv_camping': '🏕️',
  'established_campground': '⛺',
  'informal_campsite': '🏕️',
  'wild_camping': '🌲',
  'farm_camping': '🚜',
  'rv_park_camp': '🚐',
  'overnight_parking': '🅿️',
  'dump_station': '🚿',
  'propane_station': '🔥',
  'water_fill_station': '💧',
  'public_showers': '🚿',
  'laundromat': '🧺',
  'wifi_hotspot': '📶',
  'picnic_area_camp': '🧺',
  'restroom': '🚻',
  
  // Theme Park
  'theme_park_ride': '🎢',
  'theme_park_attraction': '🎪',
  'theme_park_food': '🍿',
  'theme_park_restroom': '🚻',
  
  // Government additions
  'border_crossing': '🛂',
  'checkpoint': '🛑',
  
  // Shopping & Retail
  'shopping': '🛍️',
  'department_store': '🏬',
  'clothing': '👗',
  'shoes': '👟',
  'jewelry': '💎',
  'electronics': '📱',
  'furniture': '🛋️',
  'hardware_store': '🔧',
  'sporting_goods': '⚽',
  'books': '📚',
  'gift_shop': '🎁',
  'florist': '💐',
  'pet_store': '🐾',
  'grocery_store': '🛒',
  'supermarket': '🏪',
  'farmers_market': '🥕',
  'pharmacy': '💊',
  'shopping_mall': '🛍️',
  
  // Beauty & Personal Care
  'beauty': '💇',
  'hair_salon': '💇',
  'barbershop': '💈',
  'nail_salon': '💅',
  'spa': '💆',
  'massage': '💆',
  'tattoo_parlor': '🎨',
  
  // Health & Medical
  'health': '🏥',
  'hospital': '🏥',
  'urgent_care': '🚑',
  'medical_clinic': '🏥',
  'dentist': '🦷',
  'optometrist': '👓',
  'pharmacy_health': '💊',
  'mental_health': '🧠',
  
  // Fitness & Recreation
  'fitness': '💪',
  'gym': '🏋️',
  'yoga_studio': '🧘',
  'martial_arts': '🥋',
  'dance_studio': '💃',
  'swimming_pool': '🏊',
  'golf_course': '⛳',
  'bowling_alley': '🎳',
  'rock_climbing': '🧗',
  
  // Automotive
  'automotive': '🚗',
  'car_dealer_new': '🚗',
  'auto_repair': '🔧',
  'car_wash': '🚿',
  'gas_station': '⛽',
  'ev_charging': '🔌',
  
  // Home Services
  'home_services': '🏠',
  'general_contractor': '🔨',
  'electrician': '⚡',
  'plumber': '🔧',
  'hvac': '❄️',
  'landscaping': '🌳',
  'cleaning_service': '🧹',
  
  // Professional Services
  'professional': '💼',
  'lawyer': '⚖️',
  'accountant': '📊',
  'real_estate_agent': '🏠',
  'architect': '📐',
  
  // Transportation
  'transportation': '🚌',
  'airport': '✈️',
  'train_station': '🚂',
  'bus_station': '🚌',
  'ferry_terminal': '⛴️',
  'cruise_port': '🚢',
  'truck_stop': '🚛',
  
  // Entertainment
  'entertainment': '🎬',
  'movie_theater': '🎬',
  'performing_arts': '🎭',
  'concert_hall': '🎵',
  'escape_room': '🔐',
  'arcade': '🕹️',
  'casino': '🎰',
  'water_park': '🌊',
  'theme_park': '🎢',
  'stadium': '🏟️',
  
  // Parks & Outdoors
  'outdoors': '🌲',
  'city_park': '🌳',
  'state_park': '🏞️',
  'national_park': '🏔️',
  'beach': '🏖️',
  'hiking_trail': '🥾',
  'dog_park': '🐕',
  'marina': '⛵',
  'ski_resort': '⛷️',
  
  // Arts & Culture
  'arts': '🎨',
  'art_museum': '🖼️',
  'history_museum': '🏛️',
  'science_museum': '🔬',
  'aquarium': '🐠',
  'zoo': '🦁',
  'botanical_garden': '🌺',
  
  // Pets
  'pets': '🐾',
  'veterinarian': '🩺',
  'pet_grooming': '🐩',
  'dog_training': '🐕',
  'pet_boarding': '🏠',
  
  // Education
  'education': '📚',
  'school': '🏫',
  'university': '🎓',
  'library': '📖',
  'tutoring': '✏️',
  
  // Government
  'government': '🏛️',
  'post_office': '📮',
  'dmv': '🚗',
  'courthouse': '⚖️',
  
  // Religious
  'religious': '⛪',
  'church': '⛪',
  'mosque': '🕌',
  'synagogue': '🕍',
  'temple': '🛕',
  
  // Other
  'other': '📍',
  'default': '📍',
};

/**
 * Get emoji for a category slug
 */
export function getCategoryEmoji(categorySlug: string): string {
  const slug = categorySlug.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_EMOJI_MAP[slug] || CATEGORY_EMOJI_MAP['default'];
}

// ============================================
// PRICE DISPLAY LOGIC
// ============================================

/**
 * Get price display based on category and place data
 */
export function getPriceDisplay(place: any, categorySlug: string): string | null {
  const slug = categorySlug.toLowerCase();
  
  // Restaurants, cafes, bars - show meal cost or price level
  if (['restaurants', 'cafes', 'nightlife'].includes(slug) || 
      slug.includes('restaurant') || slug.includes('cafe') || 
      slug.includes('coffee') || slug.includes('bar')) {
    if (place.avg_meal_cost) return `💰 ${place.avg_meal_cost}`;
    if (place.price_level) return `💰 ${place.price_level}`;
    return null;
  }
  
  // Hotels - show star rating
  if (['lodging'].includes(slug) || slug.includes('hotel') || slug.includes('resort')) {
    if (place.star_rating) return `⭐ ${place.star_rating}-star`;
    if (place.price_level) return `💰 ${place.price_level}`;
    return null;
  }
  
  // RV Parks - show site count
  if (slug.includes('rv') || slug.includes('campground')) {
    if (place.total_sites) return `🏕️ ${place.total_sites} sites`;
    return null;
  }
  
  // Hospitals, airports, parks - no price
  if (['health', 'transportation', 'outdoors', 'government', 'education'].includes(slug) ||
      slug.includes('hospital') || slug.includes('airport') || 
      slug.includes('park') || slug.includes('museum')) {
    return null;
  }
  
  // Default - show price level if available
  return place.price_level ? `💰 ${place.price_level}` : null;
}

// ============================================
// CATEGORY-SPECIFIC DISPLAY FIELDS
// ============================================

/**
 * Get display fields for a category
 */
export function getCategoryDisplayFields(categorySlug: string): DisplayField[] {
  const slug = categorySlug.toLowerCase();
  
  // Restaurant-specific fields
  if (slug.includes('restaurant') || slug === 'restaurants') {
    return [
      { field: 'cuisine_type', label: 'Cuisine', icon: 'restaurant' },
      { field: 'avg_meal_cost', label: 'Avg. Meal Cost', icon: 'cash' },
      { field: 'reservations', label: 'Reservations', icon: 'calendar', format: (v) => v ? 'Accepted' : 'Not Required' },
      { field: 'delivery', label: 'Delivery', icon: 'bicycle', format: (v) => v ? 'Available' : 'Not Available' },
      { field: 'outdoor_seating', label: 'Outdoor Seating', icon: 'sunny', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Cafe-specific fields
  if (slug.includes('cafe') || slug.includes('coffee') || slug === 'cafes') {
    return [
      { field: 'wifi', label: 'WiFi', icon: 'wifi', format: (v) => v ? 'Free WiFi' : 'No WiFi' },
      { field: 'outdoor_seating', label: 'Outdoor Seating', icon: 'sunny', format: (v) => v ? 'Yes' : 'No' },
      { field: 'takeout', label: 'Takeout', icon: 'bag-handle', format: (v) => v ? 'Available' : 'Not Available' },
    ];
  }
  
  // Hotel-specific fields
  if (slug.includes('hotel') || slug.includes('resort') || slug === 'lodging') {
    return [
      { field: 'star_rating', label: 'Star Rating', icon: 'star', format: (v) => `${v} Stars` },
      { field: 'pool', label: 'Pool', icon: 'water', format: (v) => v ? 'Yes' : 'No' },
      { field: 'gym', label: 'Gym', icon: 'fitness', format: (v) => v ? 'Yes' : 'No' },
      { field: 'breakfast', label: 'Breakfast', icon: 'cafe', format: (v) => v ? 'Included' : 'Not Included' },
      { field: 'parking', label: 'Parking', icon: 'car', format: (v) => v ? 'Free' : 'Paid/None' },
      { field: 'pet_friendly', label: 'Pet Friendly', icon: 'paw', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // RV Park-specific fields
  if (slug.includes('rv') || slug === 'rv_park') {
    return [
      { field: 'total_sites', label: 'Total Sites', icon: 'grid' },
      { field: 'max_rv_length', label: 'Max RV Length', icon: 'resize', format: (v) => `${v} ft` },
      { field: 'hookup_types', label: 'Hookups', icon: 'flash' },
      { field: 'dump_station', label: 'Dump Station', icon: 'water', format: (v) => v ? 'Yes' : 'No' },
      { field: 'pull_through', label: 'Pull-Through', icon: 'arrow-forward', format: (v) => v ? 'Yes' : 'No' },
      { field: 'wifi', label: 'WiFi', icon: 'wifi', format: (v) => v ? 'Available' : 'No' },
    ];
  }
  
  // Campground-specific fields
  if (slug.includes('campground') || slug === 'campground') {
    return [
      { field: 'tent_sites', label: 'Tent Sites', icon: 'bonfire', format: (v) => v ? 'Yes' : 'No' },
      { field: 'rv_sites', label: 'RV Sites', icon: 'car', format: (v) => v ? 'Yes' : 'No' },
      { field: 'hookups', label: 'Hookups', icon: 'flash', format: (v) => v ? 'Available' : 'No' },
      { field: 'fire_pits', label: 'Fire Pits', icon: 'flame', format: (v) => v ? 'Yes' : 'No' },
      { field: 'pet_friendly', label: 'Pet Friendly', icon: 'paw', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Gas Station-specific fields
  if (slug.includes('gas') || slug === 'gas_station') {
    return [
      { field: 'fuel_types', label: 'Fuel Types', icon: 'speedometer' },
      { field: 'diesel', label: 'Diesel', icon: 'car', format: (v) => v ? 'Available' : 'No' },
      { field: 'rv_access', label: 'RV/Truck Access', icon: 'bus', format: (v) => v ? 'Yes' : 'No' },
      { field: 'is_24_7', label: '24 Hours', icon: 'time', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Airport-specific fields
  if (slug.includes('airport') || slug === 'airport') {
    return [
      { field: 'terminals', label: 'Terminals', icon: 'business' },
      { field: 'airlines', label: 'Airlines', icon: 'airplane' },
      { field: 'parking', label: 'Parking', icon: 'car', format: (v) => v ? 'Available' : 'No' },
      { field: 'public_transit', label: 'Public Transit', icon: 'bus', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Hospital-specific fields
  if (slug.includes('hospital') || slug === 'hospital') {
    return [
      { field: 'beds', label: 'Beds', icon: 'bed' },
      { field: 'emergency_room', label: 'Emergency Room', icon: 'medkit', format: (v) => v ? 'Yes' : 'No' },
      { field: 'specialties', label: 'Specialties', icon: 'medical' },
      { field: 'helipad', label: 'Helipad', icon: 'airplane', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Theme Park-specific fields
  if (slug.includes('theme_park') || slug === 'theme_park') {
    return [
      { field: 'rides', label: 'Rides', icon: 'happy' },
      { field: 'water_park', label: 'Water Park', icon: 'water', format: (v) => v ? 'Yes' : 'No' },
      { field: 'shows', label: 'Shows', icon: 'videocam', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // National Park-specific fields
  if (slug.includes('national_park') || slug.includes('state_park')) {
    return [
      { field: 'trails', label: 'Trail Miles', icon: 'walk' },
      { field: 'camping', label: 'Camping', icon: 'bonfire', format: (v) => v ? 'Available' : 'No' },
      { field: 'visitor_center', label: 'Visitor Center', icon: 'information-circle', format: (v) => v ? 'Yes' : 'No' },
      { field: 'entrance_fee', label: 'Entrance Fee', icon: 'cash', format: (v) => v ? 'Required' : 'Free' },
    ];
  }
  
  // Gym-specific fields
  if (slug.includes('gym') || slug.includes('fitness') || slug === 'fitness') {
    return [
      { field: 'equipment', label: 'Equipment', icon: 'barbell' },
      { field: 'classes', label: 'Classes', icon: 'people', format: (v) => v ? 'Available' : 'No' },
      { field: 'personal_training', label: 'Personal Training', icon: 'person', format: (v) => v ? 'Available' : 'No' },
      { field: 'is_24_7', label: '24 Hours', icon: 'time', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Salon-specific fields
  if (slug.includes('salon') || slug.includes('spa') || slug === 'beauty') {
    return [
      { field: 'services', label: 'Services', icon: 'cut' },
      { field: 'walk_ins', label: 'Walk-ins', icon: 'walk', format: (v) => v ? 'Welcome' : 'Appointment Only' },
    ];
  }
  
  // Healthcare-specific fields
  if (slug.includes('doctor') || slug.includes('clinic') || slug.includes('dentist') || slug === 'health') {
    return [
      { field: 'specialties', label: 'Specialties', icon: 'medical' },
      { field: 'accepts_insurance', label: 'Insurance', icon: 'card', format: (v) => v ? 'Accepted' : 'Cash Only' },
      { field: 'telehealth', label: 'Telehealth', icon: 'videocam', format: (v) => v ? 'Available' : 'No' },
    ];
  }
  
  // Contractor-specific fields
  if (slug.includes('contractor') || slug.includes('plumber') || slug.includes('electrician') || slug === 'home_services') {
    return [
      { field: 'services', label: 'Services', icon: 'construct' },
      { field: 'licensed', label: 'Licensed', icon: 'ribbon', format: (v) => v ? 'Yes' : 'No' },
      { field: 'insured', label: 'Insured', icon: 'shield-checkmark', format: (v) => v ? 'Yes' : 'No' },
      { field: 'free_estimates', label: 'Free Estimates', icon: 'document', format: (v) => v ? 'Yes' : 'No' },
    ];
  }
  
  // Default fields for unknown categories
  return [
    { field: 'description', label: 'Description', icon: 'information-circle' },
  ];
}

// ============================================
// SHOULD SHOW ENTRANCES TAB
// ============================================

/**
 * Determine if entrances tab should be shown based on category
 * 
 * This function delegates to the canonical shouldShowMultipleEntrances
 * function in categoryConfig.ts to maintain a single source of truth.
 * 
 * For display purposes, we show the entrances tab if the category
 * has 'always' or 'optional' multi-entrance requirement.
 */
export function shouldShowEntrancesTab(
  categorySlug: string,
  contentType: ContentType = 'place_or_business'
): boolean {
  // Parse the category slug to extract primary and subcategory
  const parts = categorySlug.toLowerCase().split('/');
  const primarySlug = parts[0] || categorySlug;
  const subcategorySlug = parts[1];
  
  // Use the canonical function from categoryConfig.ts
  const requirement = shouldShowMultipleEntrances(contentType, primarySlug, subcategorySlug);
  
  // Show entrances tab for 'always' or 'optional' requirements
  return requirement !== 'never';
}

// ============================================
// GET TABS FOR CATEGORY
// ============================================

export interface TabConfig {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Get available tabs for a category
 */
export function getTabsForCategory(categorySlug: string, hasEntrances: boolean = false): TabConfig[] {
  const baseTabs: TabConfig[] = [
    { id: 'signals', label: 'Signals', icon: 'pulse' },
    { id: 'info', label: 'Info', icon: 'information-circle' },
    { id: 'photos', label: 'Photos', icon: 'images' },
  ];
  
  // Add entrances tab if applicable
  if (shouldShowEntrancesTab(categorySlug) || hasEntrances) {
    baseTabs.push({ id: 'entrances', label: 'Entrances', icon: 'enter' });
  }
  
  // Add category-specific tabs
  const slug = categorySlug.toLowerCase();
  
  if (slug.includes('restaurant') || slug === 'restaurants') {
    baseTabs.push({ id: 'menu', label: 'Menu', icon: 'reader' });
  }
  
  if (slug.includes('hotel') || slug === 'lodging') {
    baseTabs.push({ id: 'rooms', label: 'Rooms', icon: 'bed' });
  }
  
  if (slug.includes('rv') || slug.includes('campground')) {
    baseTabs.push({ id: 'sites', label: 'Sites', icon: 'grid' });
  }
  
  return baseTabs;
}

// ============================================
// QUICK INFO PILLS
// ============================================

export interface QuickInfoPill {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

/**
 * Get quick info pills for a place based on its category
 */
export function getQuickInfoPills(place: any, categorySlug: string): QuickInfoPill[] {
  const pills: QuickInfoPill[] = [];
  const slug = categorySlug.toLowerCase();
  
  // 24/7 status
  if (place.is_24_7) {
    pills.push({ label: '24/7', icon: 'time', color: '#10B981' });
  }
  
  // Open year round
  if (place.open_year_round) {
    pills.push({ label: 'Year Round', icon: 'calendar', color: '#3B82F6' });
  }
  
  // Pet friendly
  if (place.pet_friendly) {
    pills.push({ label: 'Pet Friendly', icon: 'paw', color: '#F59E0B' });
  }
  
  // WiFi
  if (place.wifi || place.wifi_available) {
    pills.push({ label: 'WiFi', icon: 'wifi', color: '#6366F1' });
  }
  
  // Category-specific pills
  if (slug.includes('restaurant')) {
    if (place.reservations) {
      pills.push({ label: 'Reservations', icon: 'calendar', color: '#8B5CF6' });
    }
    if (place.delivery) {
      pills.push({ label: 'Delivery', icon: 'bicycle', color: '#EC4899' });
    }
    if (place.outdoor_seating) {
      pills.push({ label: 'Outdoor', icon: 'sunny', color: '#F59E0B' });
    }
  }
  
  if (slug.includes('hotel') || slug === 'lodging') {
    if (place.pool) {
      pills.push({ label: 'Pool', icon: 'water', color: '#06B6D4' });
    }
    if (place.gym) {
      pills.push({ label: 'Gym', icon: 'fitness', color: '#EF4444' });
    }
    if (place.breakfast) {
      pills.push({ label: 'Breakfast', icon: 'cafe', color: '#F59E0B' });
    }
  }
  
  if (slug.includes('rv') || slug.includes('campground')) {
    if (place.dump_station) {
      pills.push({ label: 'Dump Station', icon: 'water', color: '#10B981' });
    }
    if (place.pull_through) {
      pills.push({ label: 'Pull-Through', icon: 'arrow-forward', color: '#3B82F6' });
    }
  }
  
  if (slug.includes('gas')) {
    if (place.diesel) {
      pills.push({ label: 'Diesel', icon: 'car', color: '#6B7280' });
    }
    if (place.rv_access) {
      pills.push({ label: 'RV Access', icon: 'bus', color: '#F59E0B' });
    }
  }
  
  // Contractor/Service specific
  if (slug.includes('contractor') || slug === 'home_services') {
    if (place.is_licensed) {
      pills.push({ label: 'Licensed', icon: 'ribbon', color: '#10B981' });
    }
    if (place.is_insured) {
      pills.push({ label: 'Insured', icon: 'shield-checkmark', color: '#3B82F6' });
    }
  }
  
  return pills;
}