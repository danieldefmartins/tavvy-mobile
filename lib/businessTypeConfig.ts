// Business Type Configuration System
// Central configuration for all business-type specific adaptations

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
  | 'default';

// Check-in type definition
export interface CheckInType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// Map Google Business Profile categories to our business types
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
  
  // Attraction categories
  if (category.includes('attraction') || category.includes('museum') || category.includes('park') || category.includes('zoo')) {
    return 'attraction';
  }
  
  return 'default';
}

// Get check-in types based on business type
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
    default: [
      { id: 'visited', label: 'Visited', icon: 'checkmark-circle', color: '#10b981' },
      { id: 'used_service', label: 'Used Service', icon: 'hand-right', color: '#3b82f6' },
      { id: 'passed_by', label: 'Passed By', icon: 'eye', color: '#6b7280' },
    ],
  };

  return checkInTypeMap[businessType] || checkInTypeMap.default;
}

// Get suggested signals based on business type
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
    default: {
      positive: ['Great Experience', 'Friendly Staff', 'Clean', 'Good Value', 'Recommended'],
      neutral: ['Busy', 'Basic', 'Casual', 'Family-Friendly', 'Convenient'],
      negative: ['Expensive', 'Crowded', 'Poor Service', 'Disappointing', 'Not Recommended'],
    },
  };

  return signalMap[businessType] || signalMap.default;
}

// Check if RV-specific entrance details should be shown
export function shouldShowRVEntranceDetails(businessType: BusinessType): boolean {
  return ['rv_park', 'campground', 'truck_stop'].includes(businessType);
}

// Get conditional fields based on business type
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
    retail: [],
    attraction: [],
    default: [],
  };

  return fieldMap[businessType] || fieldMap.default;
}