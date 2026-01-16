/**
 * TavvY Business Type Configuration System (Updated)
 * 
 * This file provides backward compatibility with the old business type system
 * while bridging to the new comprehensive category system.
 * 
 * Path: lib/businessTypeConfig.ts
 */

import { getPrimaryCategory, getSubcategory, PRIMARY_CATEGORIES } from './categoryConfig';

// ============================================
// LEGACY BUSINESS TYPES (for backward compatibility)
// ============================================

export type BusinessType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'rv_park'
  | 'campground'
  | 'hotel'
  | 'motel'
  | 'retail'
  | 'gas_station'
  | 'truck_stop'
  | 'attraction'
  | 'salon'
  | 'gym'
  | 'healthcare'
  | 'automotive'
  | 'contractor'
  | 'professional'
  | 'airport'
  | 'theme_park'
  | 'national_park'
  | 'state_park'
  | 'shopping_mall'
  | 'stadium'
  | 'arena'
  | 'university'
  | 'convention_center'
  | 'resort'
  | 'zoo'
  | 'aquarium'
  | 'museum'
  | 'warehouse'
  | 'distribution_center'
  | 'marina'
  | 'botanical_garden'
  | 'hospital'
  | 'default';

// ============================================
// CHECK-IN TYPES
// ============================================

export interface CheckInType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// ============================================
// CATEGORY TO BUSINESS TYPE MAPPING
// ============================================

/**
 * Maps the new category system slugs to legacy business types.
 * This allows existing code to continue working while we transition.
 */
const CATEGORY_TO_BUSINESS_TYPE: Record<string, BusinessType> = {
  // Restaurants & Dining
  'restaurants': 'restaurant',
  'american': 'restaurant',
  'italian': 'restaurant',
  'mexican': 'restaurant',
  'chinese': 'restaurant',
  'japanese': 'restaurant',
  'thai': 'restaurant',
  'indian': 'restaurant',
  'mediterranean': 'restaurant',
  'french': 'restaurant',
  'korean': 'restaurant',
  'vietnamese': 'restaurant',
  'greek': 'restaurant',
  'spanish': 'restaurant',
  'middle_eastern': 'restaurant',
  'caribbean': 'restaurant',
  'african': 'restaurant',
  'soul_food': 'restaurant',
  'seafood': 'restaurant',
  'steakhouse': 'restaurant',
  'bbq': 'restaurant',
  'pizza': 'restaurant',
  'burgers': 'restaurant',
  'sandwiches': 'restaurant',
  'vegetarian_vegan': 'restaurant',
  'farm_to_table': 'restaurant',
  'food_truck': 'restaurant',
  'buffet': 'restaurant',
  'fine_dining': 'restaurant',
  'fast_food': 'restaurant',
  'fast_casual': 'restaurant',
  'brunch': 'restaurant',
  'breakfast': 'restaurant',
  
  // Cafes & Coffee
  'cafes': 'cafe',
  'coffee_shop': 'cafe',
  'espresso_bar': 'cafe',
  'tea_house': 'cafe',
  'bubble_tea': 'cafe',
  'juice_bar': 'cafe',
  'smoothie_shop': 'cafe',
  'bakery_cafe': 'cafe',
  'dessert_cafe': 'cafe',
  
  // Bars & Nightlife
  'nightlife': 'bar',
  'bar': 'bar',
  'sports_bar': 'bar',
  'wine_bar': 'bar',
  'cocktail_bar': 'bar',
  'beer_bar': 'bar',
  'brewery': 'bar',
  'distillery': 'bar',
  'nightclub': 'bar',
  'dance_club': 'bar',
  'lounge': 'bar',
  'karaoke_bar': 'bar',
  'comedy_club': 'bar',
  'jazz_club': 'bar',
  'live_music_venue': 'bar',
  
  // Hotels & Lodging
  'lodging': 'hotel',
  'hotel': 'hotel',
  'boutique_hotel': 'hotel',
  'resort': 'hotel',
  'motel': 'motel',
  'bed_breakfast': 'hotel',
  'inn': 'hotel',
  'hostel': 'hotel',
  'vacation_rental': 'hotel',
  'cabin': 'hotel',
  'campground': 'campground',
  'rv_park': 'rv_park',
  'extended_stay': 'hotel',
  
  // Shopping & Retail
  'shopping': 'retail',
  'department_store': 'retail',
  'clothing': 'retail',
  'shoes': 'retail',
  'jewelry': 'retail',
  'electronics': 'retail',
  'furniture': 'retail',
  'home_decor': 'retail',
  'hardware_store': 'retail',
  'sporting_goods': 'retail',
  'books': 'retail',
  'gift_shop': 'retail',
  'thrift_store': 'retail',
  'florist': 'retail',
  'pet_store': 'retail',
  'grocery_store': 'retail',
  'convenience_store': 'retail',
  'supermarket': 'retail',
  'farmers_market': 'retail',
  'liquor_store': 'retail',
  'pharmacy': 'retail',
  'shopping_mall': 'retail',
  
  // Beauty & Personal Care
  'beauty': 'salon',
  'hair_salon': 'salon',
  'barbershop': 'salon',
  'nail_salon': 'salon',
  'spa': 'salon',
  'day_spa': 'salon',
  'med_spa': 'salon',
  'massage': 'salon',
  'waxing': 'salon',
  'tanning': 'salon',
  'makeup_artist': 'salon',
  'skincare': 'salon',
  'tattoo_parlor': 'salon',
  'piercing_studio': 'salon',
  
  // Health & Medical
  'health': 'healthcare',
  'hospital': 'hospital',
  'urgent_care': 'healthcare',
  'emergency_room': 'hospital',
  'medical_clinic': 'healthcare',
  'doctors_office': 'healthcare',
  'family_practice': 'healthcare',
  'pediatrician': 'healthcare',
  'dentist': 'healthcare',
  'orthodontist': 'healthcare',
  'optometrist': 'healthcare',
  'chiropractor': 'healthcare',
  'physical_therapy': 'healthcare',
  'pharmacy_health': 'healthcare',
  'mental_health': 'healthcare',
  
  // Fitness & Recreation
  'fitness': 'gym',
  'gym': 'gym',
  'crossfit': 'gym',
  'yoga_studio': 'gym',
  'pilates_studio': 'gym',
  'martial_arts': 'gym',
  'boxing_mma': 'gym',
  'dance_studio': 'gym',
  'swimming_pool': 'gym',
  'tennis_club': 'gym',
  'golf_course': 'attraction',
  'bowling_alley': 'attraction',
  'rock_climbing': 'gym',
  'trampoline_park': 'attraction',
  'sports_complex': 'gym',
  'recreation_center': 'gym',
  
  // Automotive
  'automotive': 'automotive',
  'car_dealer_new': 'automotive',
  'car_dealer_used': 'automotive',
  'auto_repair': 'automotive',
  'auto_body': 'automotive',
  'oil_change': 'automotive',
  'tire_shop': 'automotive',
  'car_wash': 'automotive',
  'auto_detailing': 'automotive',
  'towing': 'automotive',
  'auto_parts': 'automotive',
  'car_rental': 'automotive',
  'parking': 'automotive',
  'gas_station': 'gas_station',
  'ev_charging': 'gas_station',
  
  // Home Services
  'home_services': 'contractor',
  'general_contractor': 'contractor',
  'electrician': 'contractor',
  'plumber': 'contractor',
  'hvac': 'contractor',
  'roofing': 'contractor',
  'flooring': 'contractor',
  'painting': 'contractor',
  'landscaping': 'contractor',
  'lawn_care': 'contractor',
  'pest_control': 'contractor',
  'cleaning_service': 'contractor',
  'handyman': 'contractor',
  'locksmith': 'contractor',
  'moving_company': 'contractor',
  'storage': 'contractor',
  
  // Professional Services
  'professional': 'professional',
  'lawyer': 'professional',
  'accountant': 'professional',
  'tax_preparer': 'professional',
  'financial_advisor': 'professional',
  'insurance_agent': 'professional',
  'real_estate_agent': 'professional',
  'notary': 'professional',
  'marketing_agency': 'professional',
  'web_design': 'professional',
  'graphic_design': 'professional',
  'it_services': 'professional',
  'consulting': 'professional',
  'printing': 'professional',
  'architect': 'professional',
  
  // Transportation
  'transportation': 'attraction',
  'airport': 'airport',
  'train_station': 'attraction',
  'bus_station': 'attraction',
  'subway_station': 'attraction',
  'ferry_terminal': 'attraction',
  'cruise_port': 'attraction',
  'parking_lot': 'automotive',
  'parking_garage': 'automotive',
  'rest_area': 'truck_stop',
  'truck_stop': 'truck_stop',
  
  // Entertainment
  'entertainment': 'attraction',
  'movie_theater': 'attraction',
  'performing_arts': 'attraction',
  'concert_hall': 'attraction',
  'escape_room': 'attraction',
  'arcade': 'attraction',
  'casino': 'attraction',
  'bowling_ent': 'attraction',
  'laser_tag_ent': 'attraction',
  'go_karts_ent': 'attraction',
  'mini_golf_ent': 'attraction',
  'water_park': 'theme_park',
  'theme_park': 'theme_park',
  'stadium': 'attraction',
  'arena': 'attraction',
  
  // Parks & Outdoors
  'outdoors': 'attraction',
  'city_park': 'attraction',
  'state_park': 'national_park',
  'national_park': 'national_park',
  'nature_preserve': 'national_park',
  'beach': 'attraction',
  'lake': 'attraction',
  'hiking_trail': 'attraction',
  'biking_trail': 'attraction',
  'campground_out': 'campground',
  'dog_park': 'attraction',
  'fishing_spot': 'attraction',
  'boat_launch': 'attraction',
  'marina': 'attraction',
  'ski_resort': 'attraction',
  'scenic_viewpoint': 'attraction',
  'vineyard': 'attraction',
  
  // Arts & Culture
  'arts': 'attraction',
  'art_museum': 'attraction',
  'history_museum': 'attraction',
  'science_museum': 'attraction',
  'natural_history': 'attraction',
  'childrens_museum': 'attraction',
  'cultural_center': 'attraction',
  'art_gallery': 'attraction',
  'aquarium': 'attraction',
  'zoo': 'attraction',
  'botanical_garden': 'attraction',
  'historic_site': 'attraction',
  'monument': 'attraction',
  'landmark': 'attraction',
};

// ============================================
// MAPPING FUNCTIONS
// ============================================

/**
 * Maps a new category slug to a legacy business type.
 * Used for backward compatibility with existing code.
 */
export function mapCategoryToBusinessType(categorySlug: string): BusinessType {
  return CATEGORY_TO_BUSINESS_TYPE[categorySlug] || 'default';
}

/**
 * Maps Google Business Profile categories to our business types.
 * Updated to work with both old and new category systems.
 */
export function mapGoogleCategoryToBusinessType(googleCategory: string): BusinessType {
  const category = googleCategory.toLowerCase();
  
  // Restaurant categories
  if (category.includes('restaurant') || category.includes('diner') || category.includes('bistro')) {
    return 'restaurant';
  }
  
  // Cafe categories
  if (category.includes('cafe') || category.includes('coffee')) {
    return 'cafe';
  }
  
  // Bar categories
  if (category.includes('bar') || category.includes('pub') || category.includes('brewery') || category.includes('nightclub')) {
    return 'bar';
  }
  
  // RV Park categories
  if (category.includes('rv park') || category.includes('rv resort')) {
    return 'rv_park';
  }
  
  // Campground categories
  if (category.includes('campground') || category.includes('camping')) {
    return 'campground';
  }
  
  // Hotel categories
  if (category.includes('hotel') || category.includes('resort') || category.includes('inn')) {
    return 'hotel';
  }
  
  // Motel categories
  if (category.includes('motel') || category.includes('motor lodge')) {
    return 'motel';
  }
  
  // Retail categories
  if (category.includes('store') || category.includes('shop') || category.includes('retail') || category.includes('market')) {
    return 'retail';
  }
  
  // Gas station categories
  if (category.includes('gas station') || category.includes('fuel') || category.includes('petrol')) {
    return 'gas_station';
  }
  
  // Truck stop categories
  if (category.includes('truck stop') || category.includes('travel center')) {
    return 'truck_stop';
  }
  
  // Airport categories
  if (category.includes('airport') || category.includes('terminal')) {
    return 'airport';
  }
  
  // Hospital categories
  if (category.includes('hospital') || category.includes('emergency room') || category.includes('medical center')) {
    return 'hospital';
  }
  
  // Theme park categories
  if (category.includes('theme park') || category.includes('amusement park') || category.includes('water park')) {
    return 'theme_park';
  }
  
  // National park categories
  if (category.includes('national park') || category.includes('state park') || category.includes('nature preserve')) {
    return 'national_park';
  }
  
  // Salon categories
  if (category.includes('salon') || category.includes('spa') || category.includes('barber')) {
    return 'salon';
  }
  
  // Gym categories
  if (category.includes('gym') || category.includes('fitness') || category.includes('yoga')) {
    return 'gym';
  }
  
  // Healthcare categories
  if (category.includes('doctor') || category.includes('clinic') || category.includes('dentist') || category.includes('medical')) {
    return 'healthcare';
  }
  
  // Automotive categories
  if (category.includes('auto') || category.includes('car') || category.includes('mechanic') || category.includes('tire')) {
    return 'automotive';
  }
  
  // Contractor categories
  if (category.includes('contractor') || category.includes('plumber') || category.includes('electrician') || category.includes('hvac')) {
    return 'contractor';
  }
  
  // Professional categories
  if (category.includes('lawyer') || category.includes('accountant') || category.includes('consultant')) {
    return 'professional';
  }
  
  // Attraction categories
  if (category.includes('attraction') || category.includes('museum') || category.includes('park') || category.includes('zoo')) {
    return 'attraction';
  }
  
  return 'default';
}

// ============================================
// CHECK-IN TYPES BY BUSINESS TYPE
// ============================================

export function getCheckInTypes(businessType: BusinessType): CheckInType[] {
  const checkInTypeMap: Record<BusinessType, CheckInType[]> = {
    restaurant: [
      { id: 'dined_here', label: 'Dined Here', icon: 'restaurant', color: '#10b981' },
      { id: 'takeout_delivery', label: 'Takeout/Delivery', icon: 'bag-handle', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    cafe: [
      { id: 'visited', label: 'Visited', icon: 'cafe', color: '#10b981' },
      { id: 'takeout', label: 'Takeout', icon: 'bag-handle', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    bar: [
      { id: 'visited', label: 'Visited', icon: 'beer', color: '#10b981' },
      { id: 'attended_event', label: 'Attended Event', icon: 'musical-notes', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    rv_park: [
      { id: 'stayed_here', label: 'Stayed Here', icon: 'home', color: '#10b981' },
      { id: 'used_dump_water', label: 'Used Dump/Water', icon: 'water', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    campground: [
      { id: 'camped_here', label: 'Camped Here', icon: 'bonfire', color: '#10b981' },
      { id: 'used_facilities', label: 'Used Facilities', icon: 'water', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    hotel: [
      { id: 'stayed_here', label: 'Stayed Here', icon: 'bed', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'fitness', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    motel: [
      { id: 'stayed_here', label: 'Stayed Here', icon: 'bed', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'car', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    retail: [
      { id: 'shopped_here', label: 'Shopped Here', icon: 'cart', color: '#10b981' },
      { id: 'browsed_only', label: 'Browsed Only', icon: 'eye', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'walk', color: '#6b7280' },
    ],
    gas_station: [
      { id: 'fueled_up', label: 'Fueled Up', icon: 'speedometer', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'fast-food', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    truck_stop: [
      { id: 'stopped_here', label: 'Stopped Here', icon: 'car', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'water', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    attraction: [
      { id: 'visited', label: 'Visited', icon: 'location', color: '#10b981' },
      { id: 'attended_event', label: 'Attended Event', icon: 'ticket', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    salon: [
      { id: 'got_service', label: 'Got Service', icon: 'cut', color: '#10b981' },
      { id: 'consulted', label: 'Consulted', icon: 'chatbubble', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    gym: [
      { id: 'worked_out', label: 'Worked Out', icon: 'fitness', color: '#10b981' },
      { id: 'took_class', label: 'Took Class', icon: 'people', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    healthcare: [
      { id: 'had_appointment', label: 'Had Appointment', icon: 'medkit', color: '#10b981' },
      { id: 'visited_patient', label: 'Visited Patient', icon: 'people', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    automotive: [
      { id: 'got_service', label: 'Got Service', icon: 'car', color: '#10b981' },
      { id: 'bought_parts', label: 'Bought Parts', icon: 'cart', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    contractor: [
      { id: 'hired_service', label: 'Hired Service', icon: 'construct', color: '#10b981' },
      { id: 'got_quote', label: 'Got Quote', icon: 'document', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    professional: [
      { id: 'had_meeting', label: 'Had Meeting', icon: 'briefcase', color: '#10b981' },
      { id: 'consulted', label: 'Consulted', icon: 'chatbubble', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    airport: [
      { id: 'flew_from', label: 'Flew From', icon: 'airplane', color: '#10b981' },
      { id: 'flew_to', label: 'Flew To', icon: 'airplane', color: '#3b82f6' },
      { id: 'picked_up', label: 'Picked Up/Dropped Off', icon: 'car', color: '#6b7280' },
    ],
    theme_park: [
      { id: 'visited', label: 'Visited', icon: 'happy', color: '#10b981' },
      { id: 'season_pass', label: 'Season Pass Holder', icon: 'ticket', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    national_park: [
      { id: 'hiked', label: 'Hiked', icon: 'walk', color: '#10b981' },
      { id: 'camped', label: 'Camped', icon: 'bonfire', color: '#3b82f6' },
      { id: 'drove_through', label: 'Drove Through', icon: 'car', color: '#6b7280' },
    ],
    hospital: [
      { id: 'was_patient', label: 'Was Patient', icon: 'medkit', color: '#10b981' },
      { id: 'visited_patient', label: 'Visited Patient', icon: 'people', color: '#3b82f6' },
      { id: 'emergency_visit', label: 'Emergency Visit', icon: 'alert', color: '#ef4444' },
    ],
    state_park: [
      { id: 'hiked', label: 'Hiked', icon: 'walk', color: '#10b981' },
      { id: 'camped', label: 'Camped', icon: 'bonfire', color: '#3b82f6' },
      { id: 'drove_through', label: 'Drove Through', icon: 'car', color: '#6b7280' },
    ],
    shopping_mall: [
      { id: 'shopped_here', label: 'Shopped Here', icon: 'cart', color: '#10b981' },
      { id: 'browsed_only', label: 'Browsed Only', icon: 'eye', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'walk', color: '#6b7280' },
    ],
    stadium: [
      { id: 'attended_event', label: 'Attended Event', icon: 'ticket', color: '#10b981' },
      { id: 'toured', label: 'Toured', icon: 'walk', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    arena: [
      { id: 'attended_event', label: 'Attended Event', icon: 'ticket', color: '#10b981' },
      { id: 'toured', label: 'Toured', icon: 'walk', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    university: [
      { id: 'attended', label: 'Attended', icon: 'school', color: '#10b981' },
      { id: 'visited', label: 'Visited', icon: 'walk', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    convention_center: [
      { id: 'attended_event', label: 'Attended Event', icon: 'ticket', color: '#10b981' },
      { id: 'exhibited', label: 'Exhibited', icon: 'briefcase', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    resort: [
      { id: 'stayed_here', label: 'Stayed Here', icon: 'bed', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'fitness', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    zoo: [
      { id: 'visited', label: 'Visited', icon: 'paw', color: '#10b981' },
      { id: 'member', label: 'Member', icon: 'card', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    aquarium: [
      { id: 'visited', label: 'Visited', icon: 'fish', color: '#10b981' },
      { id: 'member', label: 'Member', icon: 'card', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    museum: [
      { id: 'visited', label: 'Visited', icon: 'location', color: '#10b981' },
      { id: 'member', label: 'Member', icon: 'card', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    warehouse: [
      { id: 'shopped_here', label: 'Shopped Here', icon: 'cart', color: '#10b981' },
      { id: 'picked_up', label: 'Picked Up', icon: 'cube', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    distribution_center: [
      { id: 'picked_up', label: 'Picked Up', icon: 'cube', color: '#10b981' },
      { id: 'delivered', label: 'Delivered', icon: 'car', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    marina: [
      { id: 'docked', label: 'Docked', icon: 'boat', color: '#10b981' },
      { id: 'used_amenities', label: 'Used Amenities', icon: 'water', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    botanical_garden: [
      { id: 'visited', label: 'Visited', icon: 'leaf', color: '#10b981' },
      { id: 'member', label: 'Member', icon: 'card', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
    default: [
      { id: 'visited', label: 'Visited', icon: 'checkmark-circle', color: '#10b981' },
      { id: 'used_service', label: 'Used Service', icon: 'hand-right', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
  };

  return checkInTypeMap[businessType] || checkInTypeMap.default;
}

// ============================================
// SUGGESTED SIGNALS BY BUSINESS TYPE
// ============================================

export function getSuggestedSignals(businessType: BusinessType) {
  const signalMap: Record<BusinessType, { positive: string[]; neutral: string[]; negative: string[] }> = {
    restaurant: {
      positive: ['Great Food', 'Excellent Service', 'Cozy Atmosphere', 'Good Value', 'Fresh Ingredients'],
      neutral: ['Casual', 'Family-Friendly', 'Busy', 'Quiet', 'Romantic'],
      negative: ['Pricey', 'Slow Service', 'Noisy', 'Small Portions', 'Limited Menu'],
    },
    cafe: {
      positive: ['Great Coffee', 'Friendly Staff', 'Cozy', 'Good WiFi', 'Tasty Pastries'],
      neutral: ['Casual', 'Busy', 'Quiet', 'Small Space', 'Outdoor Seating'],
      negative: ['Expensive', 'Crowded', 'Slow Service', 'Limited Seating', 'Weak WiFi'],
    },
    bar: {
      positive: ['Great Drinks', 'Fun Atmosphere', 'Live Music', 'Friendly Staff', 'Good Prices'],
      neutral: ['Loud', 'Casual', 'Busy', 'Dive Bar', 'Sports Bar'],
      negative: ['Expensive', 'Crowded', 'Slow Service', 'Dirty', 'Bad Music'],
    },
    rv_park: {
      positive: ['Spacious Sites', 'Clean Facilities', 'Friendly Staff', 'Good Hookups', 'Quiet'],
      neutral: ['Rustic', 'Pet-Friendly', 'Family-Friendly', 'Basic Amenities', 'Seasonal'],
      negative: ['Sites Crowded', 'Poor WiFi', 'Expensive', 'Noisy', 'Bad Roads'],
    },
    campground: {
      positive: ['Beautiful Views', 'Clean Facilities', 'Friendly Staff', 'Quiet', 'Good Hiking'],
      neutral: ['Rustic', 'Pet-Friendly', 'Family-Friendly', 'Basic Amenities', 'Remote'],
      negative: ['Crowded', 'Poor Facilities', 'Expensive', 'Noisy', 'Bugs'],
    },
    hotel: {
      positive: ['Clean Rooms', 'Friendly Staff', 'Great Location', 'Good Breakfast', 'Comfortable Beds'],
      neutral: ['Business Hotel', 'Family-Friendly', 'Pet-Friendly', 'Basic Amenities', 'Quiet'],
      negative: ['Expensive', 'Noisy', 'Small Rooms', 'Poor WiFi', 'Bad Location'],
    },
    motel: {
      positive: ['Clean Rooms', 'Good Value', 'Friendly Staff', 'Convenient Location', 'Easy Parking'],
      neutral: ['Basic', 'Roadside', 'Pet-Friendly', 'Quiet', 'Simple'],
      negative: ['Dated', 'Noisy', 'Small Rooms', 'Poor WiFi', 'Sketchy Area'],
    },
    retail: {
      positive: ['Great Selection', 'Helpful Staff', 'Good Prices', 'Clean Store', 'Well Organized'],
      neutral: ['Busy', 'Small Store', 'Local', 'Chain Store', 'Seasonal Items'],
      negative: ['Expensive', 'Poor Selection', 'Rude Staff', 'Messy', 'Long Lines'],
    },
    gas_station: {
      positive: ['Clean', 'Good Prices', 'Friendly Staff', 'Well Lit', 'Good Convenience Store'],
      neutral: ['Busy', 'Small', 'Basic', '24 Hours', 'Truck Friendly'],
      negative: ['Expensive', 'Dirty', 'Sketchy', 'Slow Pumps', 'Poor Lighting'],
    },
    truck_stop: {
      positive: ['Clean Facilities', 'Good Parking', 'Friendly Staff', 'Good Food', 'Safe'],
      neutral: ['Busy', 'Large', '24 Hours', 'Basic Amenities', 'Truck Wash'],
      negative: ['Expensive', 'Crowded', 'Dirty', 'Poor Parking', 'Slow Service'],
    },
    attraction: {
      positive: ['Fun', 'Educational', 'Beautiful', 'Well Maintained', 'Good Value'],
      neutral: ['Busy', 'Family-Friendly', 'Seasonal', 'Outdoor', 'Historical'],
      negative: ['Expensive', 'Crowded', 'Overrated', 'Poor Facilities', 'Not Worth It'],
    },
    salon: {
      positive: ['Great Results', 'Skilled Staff', 'Clean', 'Relaxing', 'Good Value'],
      neutral: ['Trendy', 'Busy', 'Appointment Only', 'Walk-ins Welcome', 'Modern'],
      negative: ['Expensive', 'Long Wait', 'Inconsistent', 'Rushed', 'Unprofessional'],
    },
    gym: {
      positive: ['Great Equipment', 'Clean', 'Friendly Staff', 'Good Classes', 'Motivating'],
      neutral: ['Busy', '24 Hours', 'Basic', 'Specialized', 'Community Focused'],
      negative: ['Crowded', 'Dirty', 'Expensive', 'Limited Equipment', 'Pushy Sales'],
    },
    healthcare: {
      positive: ['Caring Staff', 'Short Wait', 'Clean', 'Thorough', 'Good Communication'],
      neutral: ['Busy', 'Specialist', 'General Practice', 'Accepts Insurance', 'Modern'],
      negative: ['Long Wait', 'Rushed', 'Poor Communication', 'Expensive', 'Hard to Schedule'],
    },
    automotive: {
      positive: ['Honest', 'Fair Prices', 'Quick Service', 'Skilled Mechanics', 'Clean'],
      neutral: ['Busy', 'Appointment Only', 'Walk-ins Welcome', 'Specialized', 'Chain'],
      negative: ['Expensive', 'Slow', 'Pushy Upsells', 'Poor Communication', 'Unreliable'],
    },
    contractor: {
      positive: ['Professional', 'On Time', 'Quality Work', 'Fair Prices', 'Clean'],
      neutral: ['Licensed', 'Insured', 'Family Owned', 'Large Company', 'Specialized'],
      negative: ['Expensive', 'Late', 'Poor Communication', 'Messy', 'Unreliable'],
    },
    professional: {
      positive: ['Knowledgeable', 'Responsive', 'Professional', 'Fair Fees', 'Thorough'],
      neutral: ['Busy', 'Specialized', 'General Practice', 'Large Firm', 'Solo Practice'],
      negative: ['Expensive', 'Slow Response', 'Poor Communication', 'Impersonal', 'Inexperienced'],
    },
    airport: {
      positive: ['Efficient', 'Clean', 'Good Amenities', 'Easy Navigation', 'Friendly Staff'],
      neutral: ['Busy', 'Large', 'Small', 'International', 'Regional'],
      negative: ['Crowded', 'Long Lines', 'Poor Signage', 'Limited Food', 'Expensive Parking'],
    },
    theme_park: {
      positive: ['Fun Rides', 'Clean', 'Great Shows', 'Good Food', 'Friendly Staff'],
      neutral: ['Busy', 'Family-Friendly', 'Thrill Rides', 'Kid-Friendly', 'Seasonal'],
      negative: ['Expensive', 'Long Lines', 'Crowded', 'Hot', 'Overpriced Food'],
    },
    national_park: {
      positive: ['Beautiful', 'Well Maintained', 'Great Trails', 'Wildlife', 'Peaceful'],
      neutral: ['Remote', 'Seasonal', 'Popular', 'Wilderness', 'Developed'],
      negative: ['Crowded', 'Limited Facilities', 'Difficult Access', 'Expensive Fees', 'Poor Cell Service'],
    },
    hospital: {
      positive: ['Caring Staff', 'Clean', 'Modern', 'Short Wait', 'Good Communication'],
      neutral: ['Busy', 'Teaching Hospital', 'Specialized', 'General', 'Large'],
      negative: ['Long Wait', 'Poor Communication', 'Understaffed', 'Confusing Layout', 'Expensive'],
    },
    state_park: {
      positive: ['Beautiful', 'Well Maintained', 'Great Trails', 'Wildlife', 'Peaceful'],
      neutral: ['Remote', 'Seasonal', 'Popular', 'Wilderness', 'Developed'],
      negative: ['Crowded', 'Limited Facilities', 'Difficult Access', 'Expensive Fees', 'Poor Cell Service'],
    },
    shopping_mall: {
      positive: ['Great Selection', 'Clean', 'Good Food Court', 'Easy Parking', 'Family-Friendly'],
      neutral: ['Busy', 'Large', 'Indoor', 'Chain Stores', 'Modern'],
      negative: ['Crowded', 'Expensive', 'Hard to Navigate', 'Limited Parking', 'Noisy'],
    },
    stadium: {
      positive: ['Great Views', 'Clean', 'Good Food', 'Easy Access', 'Fun Atmosphere'],
      neutral: ['Large', 'Outdoor', 'Indoor', 'Historic', 'Modern'],
      negative: ['Expensive', 'Crowded', 'Long Lines', 'Bad Seats', 'Poor Parking'],
    },
    arena: {
      positive: ['Great Views', 'Clean', 'Good Food', 'Easy Access', 'Fun Atmosphere'],
      neutral: ['Large', 'Indoor', 'Multi-Purpose', 'Historic', 'Modern'],
      negative: ['Expensive', 'Crowded', 'Long Lines', 'Bad Seats', 'Poor Parking'],
    },
    university: {
      positive: ['Beautiful Campus', 'Good Facilities', 'Friendly', 'Well Maintained', 'Historic'],
      neutral: ['Large', 'Small', 'Urban', 'Rural', 'Research Focused'],
      negative: ['Hard to Navigate', 'Limited Parking', 'Crowded', 'Expensive', 'Poor Signage'],
    },
    convention_center: {
      positive: ['Spacious', 'Clean', 'Good Facilities', 'Easy Access', 'Modern'],
      neutral: ['Large', 'Downtown', 'Multi-Purpose', 'Busy', 'Corporate'],
      negative: ['Expensive', 'Crowded', 'Poor Food', 'Hard to Navigate', 'Limited Parking'],
    },
    resort: {
      positive: ['Beautiful', 'Great Amenities', 'Relaxing', 'Friendly Staff', 'Good Food'],
      neutral: ['All-Inclusive', 'Family-Friendly', 'Adults Only', 'Beachfront', 'Mountain'],
      negative: ['Expensive', 'Crowded', 'Overrated', 'Poor Service', 'Dated'],
    },
    zoo: {
      positive: ['Great Animals', 'Clean', 'Educational', 'Family-Friendly', 'Well Maintained'],
      neutral: ['Large', 'Small', 'Outdoor', 'Seasonal', 'Conservation Focused'],
      negative: ['Expensive', 'Crowded', 'Hot', 'Long Walks', 'Poor Animal Care'],
    },
    aquarium: {
      positive: ['Amazing Exhibits', 'Clean', 'Educational', 'Family-Friendly', 'Interactive'],
      neutral: ['Large', 'Small', 'Indoor', 'Conservation Focused', 'Modern'],
      negative: ['Expensive', 'Crowded', 'Small Tanks', 'Long Lines', 'Overrated'],
    },
    museum: {
      positive: ['Fascinating Exhibits', 'Clean', 'Educational', 'Well Curated', 'Interactive'],
      neutral: ['Large', 'Small', 'Art', 'History', 'Science'],
      negative: ['Expensive', 'Crowded', 'Boring', 'Poor Layout', 'Limited Exhibits'],
    },
    warehouse: {
      positive: ['Great Selection', 'Good Prices', 'Clean', 'Well Organized', 'Bulk Options'],
      neutral: ['Large', 'Membership Required', 'Busy', 'Basic', 'Industrial'],
      negative: ['Crowded', 'Long Lines', 'Hard to Navigate', 'Limited Selection', 'Overwhelming'],
    },
    distribution_center: {
      positive: ['Efficient', 'Clean', 'Well Organized', 'Friendly Staff', 'Fast Service'],
      neutral: ['Large', 'Industrial', 'Busy', 'Appointment Only', 'Commercial'],
      negative: ['Confusing', 'Long Wait', 'Poor Signage', 'Limited Hours', 'Hard to Find'],
    },
    marina: {
      positive: ['Beautiful', 'Clean', 'Good Facilities', 'Friendly Staff', 'Safe'],
      neutral: ['Large', 'Small', 'Full Service', 'Basic', 'Seasonal'],
      negative: ['Expensive', 'Crowded', 'Poor Facilities', 'Limited Space', 'Rough Water'],
    },
    botanical_garden: {
      positive: ['Beautiful', 'Peaceful', 'Well Maintained', 'Educational', 'Great Photos'],
      neutral: ['Large', 'Small', 'Seasonal', 'Indoor', 'Outdoor'],
      negative: ['Expensive', 'Crowded', 'Hot', 'Limited Shade', 'Poor Signage'],
    },
    default: {
      positive: ['Great Experience', 'Friendly Staff', 'Clean', 'Good Value', 'Recommended'],
      neutral: ['Busy', 'Basic', 'Casual', 'Family-Friendly', 'Convenient'],
      negative: ['Expensive', 'Crowded', 'Poor Service', 'Disappointing', 'Not Recommended'],
    },
  };

  return signalMap[businessType] || signalMap.default;
}

// ============================================
// RV ENTRANCE DETAILS
// ============================================

export function shouldShowRVEntranceDetails(businessType: BusinessType): boolean {
  return ['rv_park', 'campground', 'truck_stop'].includes(businessType);
}

// ============================================
// MULTI-ENTRANCE LOGIC
// ============================================

/**
 * Determines if a business type should show multiple entrances.
 * 
 * Only includes categories that CLEARLY have multiple distinct entrances:
 * - Hospitals: Emergency, Main, Outpatient, Delivery
 * - Airports: Different terminals, Arrivals/Departures
 * - National/State Parks: East/West/North/South entrances
 * - Theme Parks: Main gate, VIP, Hotel guest entrances
 * - Shopping Malls: Multiple anchor store entrances
 * - Stadiums/Arenas: Multiple gates (North, South, East, West)
 * - Universities: Multiple campus gates
 * - Convention Centers: Multiple halls
 * - Large Hotels/Resorts: Lobby, Valet, Pool, Conference
 * - RV Parks/Campgrounds: Main office, RV entrance, Tent area
 * - Zoos/Aquariums: Main, Member, Group entrances
 * - Large Museums: Multiple wings
 * - Warehouses/Distribution Centers: Office, Shipping, Receiving
 * - Truck Stops: Car entrance, Truck entrance, RV entrance
 * 
 * NOT included: Restaurants, cafes, bars, retail stores, salons, etc.
 * (These typically have a single customer entrance)
 */
export function shouldShowMultipleEntrances(businessType: BusinessType): boolean {
  const multiEntranceTypes: BusinessType[] = [
    // TIER 1: Critical - Always have multiple entrances
    'hospital',
    'airport',
    'national_park',
    'state_park',
    'theme_park',
    'shopping_mall',
    
    // TIER 2: Common - Frequently have multiple entrances  
    'stadium',
    'arena',
    'university',
    'convention_center',
    'resort',
    
    // TIER 3: Specialized - Often have multiple entrances
    'rv_park',
    'campground',
    'zoo',
    'aquarium',
    'museum',
    'warehouse',
    'distribution_center',
    'truck_stop',
    'marina',
    'botanical_garden',
  ];
  
  return multiEntranceTypes.includes(businessType);
}

// ============================================
// CONDITIONAL FIELDS BY BUSINESS TYPE
// ============================================

export function getConditionalFields(businessType: BusinessType) {
  const fieldMap: Record<BusinessType, Array<{ field: string; label: string; type: string }>> = {
    rv_park: [
      { field: 'maxRvLength', label: 'Max RV Length (ft)', type: 'number' },
      { field: 'hookupTypes', label: 'Hookup Types', type: 'multiselect' },
      { field: 'dumpStation', label: 'Dump Station', type: 'boolean' },
      { field: 'pullThrough', label: 'Pull-Through Sites', type: 'boolean' },
      { field: 'petFriendly', label: 'Pet Friendly', type: 'boolean' },
      { field: 'wifiAvailable', label: 'WiFi Available', type: 'boolean' },
    ],
    campground: [
      { field: 'tentSites', label: 'Tent Sites', type: 'boolean' },
      { field: 'rvSites', label: 'RV Sites', type: 'boolean' },
      { field: 'hookups', label: 'Hookups Available', type: 'boolean' },
      { field: 'petFriendly', label: 'Pet Friendly', type: 'boolean' },
      { field: 'firePits', label: 'Fire Pits', type: 'boolean' },
    ],
    hotel: [
      { field: 'roomTypes', label: 'Room Types', type: 'multiselect' },
      { field: 'pool', label: 'Pool', type: 'boolean' },
      { field: 'gym', label: 'Gym', type: 'boolean' },
      { field: 'breakfast', label: 'Breakfast Included', type: 'boolean' },
      { field: 'parking', label: 'Free Parking', type: 'boolean' },
      { field: 'wifi', label: 'Free WiFi', type: 'boolean' },
      { field: 'petFriendly', label: 'Pet Friendly', type: 'boolean' },
    ],
    motel: [
      { field: 'parking', label: 'Free Parking', type: 'boolean' },
      { field: 'wifi', label: 'Free WiFi', type: 'boolean' },
      { field: 'petFriendly', label: 'Pet Friendly', type: 'boolean' },
    ],
    restaurant: [
      { field: 'cuisineType', label: 'Cuisine Type', type: 'select' },
      { field: 'reservations', label: 'Reservations', type: 'boolean' },
      { field: 'delivery', label: 'Delivery Available', type: 'boolean' },
      { field: 'outdoorSeating', label: 'Outdoor Seating', type: 'boolean' },
    ],
    cafe: [
      { field: 'wifi', label: 'Free WiFi', type: 'boolean' },
      { field: 'outdoorSeating', label: 'Outdoor Seating', type: 'boolean' },
      { field: 'takeout', label: 'Takeout Available', type: 'boolean' },
    ],
    bar: [
      { field: 'liveMusic', label: 'Live Music', type: 'boolean' },
      { field: 'happyHour', label: 'Happy Hour', type: 'boolean' },
      { field: 'outdoorSeating', label: 'Outdoor Seating', type: 'boolean' },
    ],
    gas_station: [
      { field: 'fuelTypes', label: 'Fuel Types', type: 'multiselect' },
      { field: 'diesel', label: 'Diesel Available', type: 'boolean' },
      { field: 'rvAccess', label: 'RV/Truck Access', type: 'boolean' },
      { field: 'twentyFourHours', label: '24 Hours', type: 'boolean' },
    ],
    truck_stop: [
      { field: 'diesel', label: 'Diesel Available', type: 'boolean' },
      { field: 'truckParking', label: 'Truck Parking', type: 'boolean' },
      { field: 'showers', label: 'Showers', type: 'boolean' },
      { field: 'twentyFourHours', label: '24 Hours', type: 'boolean' },
    ],
    salon: [
      { field: 'services', label: 'Services Offered', type: 'multiselect' },
      { field: 'walkIns', label: 'Walk-ins Welcome', type: 'boolean' },
      { field: 'appointmentOnly', label: 'Appointment Only', type: 'boolean' },
    ],
    gym: [
      { field: 'equipment', label: 'Equipment Types', type: 'multiselect' },
      { field: 'classes', label: 'Classes Available', type: 'boolean' },
      { field: 'personalTraining', label: 'Personal Training', type: 'boolean' },
      { field: 'twentyFourHours', label: '24 Hours', type: 'boolean' },
    ],
    healthcare: [
      { field: 'specialties', label: 'Specialties', type: 'multiselect' },
      { field: 'acceptsInsurance', label: 'Accepts Insurance', type: 'boolean' },
      { field: 'telehealth', label: 'Telehealth Available', type: 'boolean' },
    ],
    automotive: [
      { field: 'services', label: 'Services Offered', type: 'multiselect' },
      { field: 'certified', label: 'Certified Mechanics', type: 'boolean' },
      { field: 'loaner', label: 'Loaner Vehicles', type: 'boolean' },
    ],
    contractor: [
      { field: 'services', label: 'Services Offered', type: 'multiselect' },
      { field: 'licensed', label: 'Licensed', type: 'boolean' },
      { field: 'insured', label: 'Insured', type: 'boolean' },
      { field: 'freeEstimates', label: 'Free Estimates', type: 'boolean' },
    ],
    professional: [
      { field: 'services', label: 'Services Offered', type: 'multiselect' },
      { field: 'freeConsultation', label: 'Free Consultation', type: 'boolean' },
      { field: 'virtualMeetings', label: 'Virtual Meetings', type: 'boolean' },
    ],
    airport: [
      { field: 'terminals', label: 'Number of Terminals', type: 'number' },
      { field: 'airlines', label: 'Airlines', type: 'multiselect' },
      { field: 'parking', label: 'Parking Available', type: 'boolean' },
      { field: 'publicTransit', label: 'Public Transit Access', type: 'boolean' },
    ],
    theme_park: [
      { field: 'rides', label: 'Number of Rides', type: 'number' },
      { field: 'waterPark', label: 'Water Park', type: 'boolean' },
      { field: 'shows', label: 'Shows/Entertainment', type: 'boolean' },
      { field: 'dining', label: 'Dining Options', type: 'multiselect' },
    ],
    national_park: [
      { field: 'trails', label: 'Trail Miles', type: 'number' },
      { field: 'camping', label: 'Camping Available', type: 'boolean' },
      { field: 'visitorCenter', label: 'Visitor Center', type: 'boolean' },
      { field: 'entranceFee', label: 'Entrance Fee Required', type: 'boolean' },
    ],
    hospital: [
      { field: 'beds', label: 'Number of Beds', type: 'number' },
      { field: 'emergencyRoom', label: 'Emergency Room', type: 'boolean' },
      { field: 'specialties', label: 'Specialties', type: 'multiselect' },
      { field: 'helipad', label: 'Helipad', type: 'boolean' },
    ],
    retail: [],
    attraction: [],
    state_park: [
      { field: 'trails', label: 'Trail Miles', type: 'number' },
      { field: 'camping', label: 'Camping Available', type: 'boolean' },
      { field: 'visitorCenter', label: 'Visitor Center', type: 'boolean' },
      { field: 'entranceFee', label: 'Entrance Fee Required', type: 'boolean' },
    ],
    shopping_mall: [
      { field: 'stores', label: 'Number of Stores', type: 'number' },
      { field: 'foodCourt', label: 'Food Court', type: 'boolean' },
      { field: 'parking', label: 'Free Parking', type: 'boolean' },
    ],
    stadium: [
      { field: 'capacity', label: 'Seating Capacity', type: 'number' },
      { field: 'parking', label: 'Parking Available', type: 'boolean' },
      { field: 'concessions', label: 'Concessions', type: 'boolean' },
    ],
    arena: [
      { field: 'capacity', label: 'Seating Capacity', type: 'number' },
      { field: 'parking', label: 'Parking Available', type: 'boolean' },
      { field: 'concessions', label: 'Concessions', type: 'boolean' },
    ],
    university: [
      { field: 'enrollment', label: 'Enrollment', type: 'number' },
      { field: 'publicPrivate', label: 'Public/Private', type: 'select' },
      { field: 'housing', label: 'On-Campus Housing', type: 'boolean' },
    ],
    convention_center: [
      { field: 'sqft', label: 'Square Footage', type: 'number' },
      { field: 'meetingRooms', label: 'Meeting Rooms', type: 'number' },
      { field: 'parking', label: 'Parking Available', type: 'boolean' },
    ],
    resort: [
      { field: 'rooms', label: 'Number of Rooms', type: 'number' },
      { field: 'pool', label: 'Pool', type: 'boolean' },
      { field: 'spa', label: 'Spa', type: 'boolean' },
      { field: 'allInclusive', label: 'All-Inclusive', type: 'boolean' },
    ],
    zoo: [
      { field: 'animals', label: 'Number of Species', type: 'number' },
      { field: 'exhibits', label: 'Exhibits', type: 'multiselect' },
      { field: 'pettingZoo', label: 'Petting Zoo', type: 'boolean' },
    ],
    aquarium: [
      { field: 'tanks', label: 'Number of Tanks', type: 'number' },
      { field: 'touchTank', label: 'Touch Tank', type: 'boolean' },
      { field: 'shows', label: 'Shows/Presentations', type: 'boolean' },
    ],
    museum: [
      { field: 'type', label: 'Museum Type', type: 'select' },
      { field: 'exhibits', label: 'Current Exhibits', type: 'multiselect' },
      { field: 'guidedTours', label: 'Guided Tours', type: 'boolean' },
    ],
    warehouse: [
      { field: 'membershipRequired', label: 'Membership Required', type: 'boolean' },
      { field: 'bulkItems', label: 'Bulk Items', type: 'boolean' },
    ],
    distribution_center: [
      { field: 'appointmentRequired', label: 'Appointment Required', type: 'boolean' },
      { field: 'publicAccess', label: 'Public Access', type: 'boolean' },
    ],
    marina: [
      { field: 'slips', label: 'Number of Slips', type: 'number' },
      { field: 'fuel', label: 'Fuel Available', type: 'boolean' },
      { field: 'boatRamp', label: 'Boat Ramp', type: 'boolean' },
    ],
    botanical_garden: [
      { field: 'acres', label: 'Acres', type: 'number' },
      { field: 'greenhouse', label: 'Greenhouse', type: 'boolean' },
      { field: 'guidedTours', label: 'Guided Tours', type: 'boolean' },
    ],
    default: [],
  };

  return fieldMap[businessType] || fieldMap.default;
}