/**
 * Tavvy Category Field Configuration
 * 
 * This file defines the dynamic form fields for each category.
 * When a category is selected, the appropriate fields are displayed.
 * 
 * Path: lib/categoryFieldConfig.ts
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'multiselect' 
  | 'textarea' 
  | 'phone' 
  | 'url' 
  | 'email' 
  | 'price' 
  | 'hours'
  | 'address'
  | 'area'
  | 'coordinates'
  | 'image'
  | 'array';

export interface FieldOption {
  value: string;
  label: string;
}

export interface CategoryField {
  field: string;           // Database field name
  label: string;           // Display label
  type: FieldType;         // Field type
  required?: boolean;      // Is field required
  options?: FieldOption[]; // For select/multiselect
  placeholder?: string;    // Placeholder text
  helpText?: string;       // Help text below field
  defaultValue?: any;      // Default value
  min?: number;            // For number fields
  max?: number;            // For number fields
  step?: number;           // For number fields
  icon?: keyof typeof Ionicons.glyphMap; // Icon for field
  section?: string;        // Group fields into sections
  showIf?: {               // Conditional display
    field: string;
    value: any;
  };
}

export interface CategoryFieldConfig {
  primaryCategory: string;
  subcategories?: string[];  // If undefined, applies to all subcategories
  fields: CategoryField[];
}

// ============================================
// UNIVERSAL FIELDS (All Categories)
// ============================================

export const UNIVERSAL_FIELDS: CategoryField[] = [
  {
    field: 'name',
    label: 'Business Name',
    type: 'text',
    required: true,
    placeholder: 'Enter business name',
    icon: 'business',
    section: 'basic',
  },
  {
    field: 'address_line1',
    label: 'Street Address',
    type: 'address',
    required: true,
    placeholder: '123 Main Street',
    icon: 'location',
    section: 'location',
  },
  {
    field: 'city',
    label: 'City',
    type: 'text',
    required: true,
    placeholder: 'City',
    section: 'location',
  },
  {
    field: 'state_region',
    label: 'State',
    type: 'text',
    required: true,
    placeholder: 'State',
    section: 'location',
  },
  {
    field: 'postal_code',
    label: 'ZIP Code',
    type: 'text',
    required: true,
    placeholder: '12345',
    section: 'location',
  },
  {
    field: 'phone_e164',
    label: 'Phone Number',
    type: 'phone',
    placeholder: '(555) 123-4567',
    icon: 'call',
    section: 'contact',
  },
  {
    field: 'website_url',
    label: 'Website',
    type: 'url',
    placeholder: 'https://www.example.com',
    icon: 'globe',
    section: 'contact',
  },
  {
    field: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'contact@business.com',
    icon: 'mail',
    section: 'contact',
  },
];

// ============================================
// SOCIAL MEDIA FIELDS
// ============================================

export const SOCIAL_MEDIA_FIELDS: CategoryField[] = [
  {
    field: 'instagram_url',
    label: 'Instagram',
    type: 'url',
    placeholder: 'https://instagram.com/yourbusiness',
    icon: 'logo-instagram',
    section: 'social',
  },
  {
    field: 'facebook_url',
    label: 'Facebook',
    type: 'url',
    placeholder: 'https://facebook.com/yourbusiness',
    icon: 'logo-facebook',
    section: 'social',
  },
  {
    field: 'tiktok_url',
    label: 'TikTok',
    type: 'url',
    placeholder: 'https://tiktok.com/@yourbusiness',
    icon: 'logo-tiktok',
    section: 'social',
  },
  {
    field: 'youtube_url',
    label: 'YouTube',
    type: 'url',
    placeholder: 'https://youtube.com/yourbusiness',
    icon: 'logo-youtube',
    section: 'social',
  },
];

// ============================================
// CATEGORY-SPECIFIC FIELD CONFIGURATIONS
// ============================================

export const CATEGORY_FIELD_CONFIGS: CategoryFieldConfig[] = [
  // ----------------------------------------
  // RESTAURANTS & DINING
  // ----------------------------------------
  {
    primaryCategory: 'restaurants',
    fields: [
      {
        field: 'cuisine_type',
        label: 'Cuisine Type',
        type: 'select',
        options: [
          { value: 'american', label: 'American' },
          { value: 'italian', label: 'Italian' },
          { value: 'mexican', label: 'Mexican' },
          { value: 'chinese', label: 'Chinese' },
          { value: 'japanese', label: 'Japanese' },
          { value: 'thai', label: 'Thai' },
          { value: 'indian', label: 'Indian' },
          { value: 'mediterranean', label: 'Mediterranean' },
          { value: 'other', label: 'Other' },
        ],
        icon: 'restaurant',
        section: 'details',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Budget' },
          { value: '$$', label: '$$ - Moderate' },
          { value: '$$$', label: '$$$ - Upscale' },
          { value: '$$$$', label: '$$$$ - Fine Dining' },
        ],
        icon: 'cash',
        section: 'details',
      },
      {
        field: 'avg_meal_cost',
        label: 'Average Meal Cost',
        type: 'text',
        placeholder: '$15-25',
        helpText: 'Typical cost per person',
        section: 'details',
      },
      {
        field: 'reservations',
        label: 'Reservations',
        type: 'select',
        options: [
          { value: 'required', label: 'Required' },
          { value: 'recommended', label: 'Recommended' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'not_accepted', label: 'Not Accepted' },
        ],
        section: 'features',
      },
      {
        field: 'delivery',
        label: 'Delivery Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'takeout',
        label: 'Takeout Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'outdoor_seating',
        label: 'Outdoor Seating',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'alcohol',
        label: 'Alcohol',
        type: 'select',
        options: [
          { value: 'full_bar', label: 'Full Bar' },
          { value: 'beer_wine', label: 'Beer & Wine Only' },
          { value: 'byob', label: 'BYOB' },
          { value: 'none', label: 'No Alcohol' },
        ],
        section: 'features',
      },
      {
        field: 'dress_code',
        label: 'Dress Code',
        type: 'select',
        options: [
          { value: 'casual', label: 'Casual' },
          { value: 'smart_casual', label: 'Smart Casual' },
          { value: 'business_casual', label: 'Business Casual' },
          { value: 'formal', label: 'Formal' },
        ],
        section: 'features',
      },
    ],
  },

  // ----------------------------------------
  // CAFES & COFFEE
  // ----------------------------------------
  {
    primaryCategory: 'cafes',
    fields: [
      {
        field: 'wifi',
        label: 'Free WiFi',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'wifi_speed',
        label: 'WiFi Speed',
        type: 'select',
        options: [
          { value: 'fast', label: 'Fast (Good for video calls)' },
          { value: 'moderate', label: 'Moderate (Good for browsing)' },
          { value: 'slow', label: 'Slow (Basic use only)' },
        ],
        showIf: { field: 'wifi', value: true },
        section: 'features',
      },
      {
        field: 'workspace_friendly',
        label: 'Workspace Friendly',
        type: 'boolean',
        helpText: 'Good for working/studying',
        section: 'features',
      },
      {
        field: 'outdoor_seating',
        label: 'Outdoor Seating',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'drive_thru',
        label: 'Drive-Thru',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Budget' },
          { value: '$$', label: '$$ - Moderate' },
          { value: '$$$', label: '$$$ - Premium' },
        ],
        section: 'details',
      },
    ],
  },

  // ----------------------------------------
  // BARS & NIGHTLIFE
  // ----------------------------------------
  {
    primaryCategory: 'nightlife',
    fields: [
      {
        field: 'age_requirement',
        label: 'Age Requirement',
        type: 'select',
        options: [
          { value: '21+', label: '21+' },
          { value: '18+', label: '18+' },
          { value: 'all_ages', label: 'All Ages' },
        ],
        section: 'details',
      },
      {
        field: 'dress_code',
        label: 'Dress Code',
        type: 'select',
        options: [
          { value: 'casual', label: 'Casual' },
          { value: 'smart_casual', label: 'Smart Casual' },
          { value: 'upscale', label: 'Upscale' },
          { value: 'none', label: 'No Dress Code' },
        ],
        section: 'details',
      },
      {
        field: 'cover_charge',
        label: 'Cover Charge',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'cover_amount',
        label: 'Cover Amount',
        type: 'text',
        placeholder: '$10-20',
        showIf: { field: 'cover_charge', value: true },
        section: 'details',
      },
      {
        field: 'happy_hour',
        label: 'Happy Hour',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'live_music',
        label: 'Live Music',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'dj',
        label: 'DJ',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'outdoor_seating',
        label: 'Outdoor Seating',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Dive Bar' },
          { value: '$$', label: '$$ - Average' },
          { value: '$$$', label: '$$$ - Upscale' },
          { value: '$$$$', label: '$$$$ - Premium' },
        ],
        section: 'details',
      },
    ],
  },

  // ----------------------------------------
  // HOTELS & LODGING
  // ----------------------------------------
  {
    primaryCategory: 'lodging',
    fields: [
      {
        field: 'star_rating',
        label: 'Star Rating',
        type: 'select',
        options: [
          { value: '1', label: '1 Star' },
          { value: '2', label: '2 Stars' },
          { value: '3', label: '3 Stars' },
          { value: '4', label: '4 Stars' },
          { value: '5', label: '5 Stars' },
        ],
        section: 'details',
      },
      {
        field: 'check_in_time',
        label: 'Check-in Time',
        type: 'text',
        placeholder: '3:00 PM',
        section: 'details',
      },
      {
        field: 'check_out_time',
        label: 'Check-out Time',
        type: 'text',
        placeholder: '11:00 AM',
        section: 'details',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Budget' },
          { value: '$$', label: '$$ - Mid-Range' },
          { value: '$$$', label: '$$$ - Upscale' },
          { value: '$$$$', label: '$$$$ - Luxury' },
        ],
        section: 'details',
      },
      {
        field: 'pool',
        label: 'Pool',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'gym',
        label: 'Fitness Center',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'spa',
        label: 'Spa',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'breakfast_included',
        label: 'Breakfast Included',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'restaurant_on_site',
        label: 'Restaurant On-Site',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'free_parking',
        label: 'Free Parking',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'free_wifi',
        label: 'Free WiFi',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'pet_friendly',
        label: 'Pet Friendly',
        type: 'boolean',
        section: 'policies',
      },
      {
        field: 'pet_fee',
        label: 'Pet Fee',
        type: 'text',
        placeholder: '$25/night',
        showIf: { field: 'pet_friendly', value: true },
        section: 'policies',
      },
      {
        field: 'smoking_allowed',
        label: 'Smoking Rooms Available',
        type: 'boolean',
        section: 'policies',
      },
    ],
  },

  // ----------------------------------------
  // RV PARKS & CAMPGROUNDS (Subcategories of Lodging)
  // ----------------------------------------
  {
    primaryCategory: 'lodging',
    subcategories: ['rv_park', 'campground'],
    fields: [
      {
        field: 'total_sites',
        label: 'Total Sites',
        type: 'number',
        placeholder: '50',
        section: 'details',
      },
      {
        field: 'max_rv_length',
        label: 'Max RV Length (ft)',
        type: 'number',
        placeholder: '45',
        helpText: 'Maximum RV length in feet',
        section: 'details',
      },
      {
        field: 'hookup_types',
        label: 'Hookup Types',
        type: 'multiselect',
        options: [
          { value: 'full', label: 'Full Hookups (Water, Electric, Sewer)' },
          { value: 'water_electric', label: 'Water & Electric' },
          { value: 'electric_only', label: 'Electric Only' },
          { value: 'dry_camping', label: 'Dry Camping / No Hookups' },
        ],
        section: 'amenities',
      },
      {
        field: 'amp_service',
        label: 'Amp Service',
        type: 'multiselect',
        options: [
          { value: '20', label: '20 Amp' },
          { value: '30', label: '30 Amp' },
          { value: '50', label: '50 Amp' },
        ],
        section: 'amenities',
      },
      {
        field: 'pull_through',
        label: 'Pull-Through Sites',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'dump_station',
        label: 'Dump Station',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'laundry',
        label: 'Laundry Facilities',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'showers',
        label: 'Showers',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'wifi',
        label: 'WiFi Available',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'pet_friendly',
        label: 'Pet Friendly',
        type: 'boolean',
        section: 'policies',
      },
      {
        field: 'open_year_round',
        label: 'Open Year Round',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'seasonal_dates',
        label: 'Seasonal Dates',
        type: 'text',
        placeholder: 'April - October',
        showIf: { field: 'open_year_round', value: false },
        section: 'details',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Budget ($10-25/night)' },
          { value: '$$', label: '$$ - Average ($25-50/night)' },
          { value: '$$$', label: '$$$ - Premium ($50-100/night)' },
          { value: '$$$$', label: '$$$$ - Resort ($100+/night)' },
        ],
        section: 'details',
      },
    ],
  },

  // ----------------------------------------
  // HEALTH & MEDICAL
  // ----------------------------------------
  {
    primaryCategory: 'health',
    fields: [
      {
        field: 'insurance_accepted',
        label: 'Insurance Accepted',
        type: 'multiselect',
        options: [
          { value: 'medicare', label: 'Medicare' },
          { value: 'medicaid', label: 'Medicaid' },
          { value: 'private', label: 'Private Insurance' },
          { value: 'self_pay', label: 'Self Pay' },
        ],
        section: 'details',
      },
      {
        field: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'walk_ins_welcome',
        label: 'Walk-ins Welcome',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'telehealth',
        label: 'Telehealth Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'languages_spoken',
        label: 'Languages Spoken',
        type: 'multiselect',
        options: [
          { value: 'english', label: 'English' },
          { value: 'spanish', label: 'Spanish' },
          { value: 'chinese', label: 'Chinese' },
          { value: 'vietnamese', label: 'Vietnamese' },
          { value: 'korean', label: 'Korean' },
          { value: 'tagalog', label: 'Tagalog' },
          { value: 'other', label: 'Other' },
        ],
        section: 'details',
      },
      {
        field: 'wheelchair_accessible',
        label: 'Wheelchair Accessible',
        type: 'boolean',
        section: 'accessibility',
      },
    ],
  },

  // ----------------------------------------
  // HOSPITALS (Subcategory of Health)
  // ----------------------------------------
  {
    primaryCategory: 'health',
    subcategories: ['hospital', 'emergency_room'],
    fields: [
      {
        field: 'emergency_services',
        label: 'Emergency Services',
        type: 'boolean',
        section: 'services',
      },
      {
        field: 'trauma_level',
        label: 'Trauma Center Level',
        type: 'select',
        options: [
          { value: 'level_1', label: 'Level I' },
          { value: 'level_2', label: 'Level II' },
          { value: 'level_3', label: 'Level III' },
          { value: 'level_4', label: 'Level IV' },
          { value: 'none', label: 'Not a Trauma Center' },
        ],
        section: 'services',
      },
      {
        field: 'specialties',
        label: 'Specialties',
        type: 'multiselect',
        options: [
          { value: 'cardiology', label: 'Cardiology' },
          { value: 'oncology', label: 'Oncology' },
          { value: 'neurology', label: 'Neurology' },
          { value: 'orthopedics', label: 'Orthopedics' },
          { value: 'pediatrics', label: 'Pediatrics' },
          { value: 'maternity', label: 'Maternity' },
          { value: 'surgery', label: 'Surgery' },
        ],
        section: 'services',
      },
      {
        field: 'helipad',
        label: 'Helipad',
        type: 'boolean',
        section: 'facilities',
      },
    ],
  },

  // ----------------------------------------
  // HOME SERVICES (Service Businesses)
  // ----------------------------------------
  {
    primaryCategory: 'home_services',
    fields: [
      {
        field: 'service_area',
        label: 'Service Area',
        type: 'area',
        placeholder: 'Miami-Dade County, FL',
        helpText: 'Areas you serve',
        section: 'details',
      },
      {
        field: 'is_licensed',
        label: 'Licensed',
        type: 'boolean',
        section: 'credentials',
      },
      {
        field: 'license_number',
        label: 'License Number',
        type: 'text',
        showIf: { field: 'is_licensed', value: true },
        section: 'credentials',
      },
      {
        field: 'license_state',
        label: 'License State',
        type: 'text',
        showIf: { field: 'is_licensed', value: true },
        section: 'credentials',
      },
      {
        field: 'is_insured',
        label: 'Insured',
        type: 'boolean',
        section: 'credentials',
      },
      {
        field: 'insurance_provider',
        label: 'Insurance Provider',
        type: 'text',
        showIf: { field: 'is_insured', value: true },
        section: 'credentials',
      },
      {
        field: 'is_bonded',
        label: 'Bonded',
        type: 'boolean',
        section: 'credentials',
      },
      {
        field: 'free_estimates',
        label: 'Free Estimates',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'emergency_service',
        label: '24/7 Emergency Service',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'years_in_business',
        label: 'Years in Business',
        type: 'number',
        placeholder: '10',
        section: 'details',
      },
      {
        field: 'certifications',
        label: 'Certifications',
        type: 'array',
        placeholder: 'Add certification',
        section: 'credentials',
      },
    ],
  },

  // ----------------------------------------
  // AUTOMOTIVE
  // ----------------------------------------
  {
    primaryCategory: 'automotive',
    fields: [
      {
        field: 'brands_serviced',
        label: 'Brands Serviced',
        type: 'multiselect',
        options: [
          { value: 'all', label: 'All Brands' },
          { value: 'domestic', label: 'Domestic Only' },
          { value: 'foreign', label: 'Foreign Only' },
          { value: 'european', label: 'European' },
          { value: 'asian', label: 'Asian' },
        ],
        section: 'details',
      },
      {
        field: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'loaner_cars',
        label: 'Loaner Cars Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'shuttle_service',
        label: 'Shuttle Service',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'waiting_area',
        label: 'Waiting Area',
        type: 'boolean',
        section: 'features',
      },
    ],
  },

  // ----------------------------------------
  // GAS STATIONS
  // ----------------------------------------
  {
    primaryCategory: 'automotive',
    subcategories: ['gas_station', 'ev_charging'],
    fields: [
      {
        field: 'fuel_types',
        label: 'Fuel Types',
        type: 'multiselect',
        options: [
          { value: 'regular', label: 'Regular' },
          { value: 'midgrade', label: 'Mid-Grade' },
          { value: 'premium', label: 'Premium' },
          { value: 'diesel', label: 'Diesel' },
          { value: 'e85', label: 'E85' },
          { value: 'ev_charging', label: 'EV Charging' },
        ],
        section: 'details',
      },
      {
        field: 'is_24_7',
        label: 'Open 24/7',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'convenience_store',
        label: 'Convenience Store',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'car_wash',
        label: 'Car Wash',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'rv_accessible',
        label: 'RV Accessible',
        type: 'boolean',
        helpText: 'Can accommodate large RVs',
        section: 'features',
      },
      {
        field: 'truck_accessible',
        label: 'Truck Accessible',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'restrooms',
        label: 'Public Restrooms',
        type: 'boolean',
        section: 'features',
      },
    ],
  },

  // ----------------------------------------
  // BEAUTY & PERSONAL CARE
  // ----------------------------------------
  {
    primaryCategory: 'beauty',
    fields: [
      {
        field: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'walk_ins_welcome',
        label: 'Walk-ins Welcome',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'services_offered',
        label: 'Services Offered',
        type: 'multiselect',
        options: [
          { value: 'haircut', label: 'Haircut' },
          { value: 'color', label: 'Color' },
          { value: 'highlights', label: 'Highlights' },
          { value: 'blowout', label: 'Blowout' },
          { value: 'extensions', label: 'Extensions' },
          { value: 'treatments', label: 'Treatments' },
          { value: 'styling', label: 'Styling' },
        ],
        section: 'services',
      },
      {
        field: 'price_level',
        label: 'Price Range',
        type: 'select',
        options: [
          { value: '$', label: '$ - Budget' },
          { value: '$$', label: '$$ - Average' },
          { value: '$$$', label: '$$$ - Upscale' },
          { value: '$$$$', label: '$$$$ - Luxury' },
        ],
        section: 'details',
      },
      {
        field: 'wheelchair_accessible',
        label: 'Wheelchair Accessible',
        type: 'boolean',
        section: 'accessibility',
      },
    ],
  },

  // ----------------------------------------
  // FITNESS & RECREATION
  // ----------------------------------------
  {
    primaryCategory: 'fitness',
    fields: [
      {
        field: 'membership_required',
        label: 'Membership Required',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'day_pass_available',
        label: 'Day Pass Available',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'day_pass_price',
        label: 'Day Pass Price',
        type: 'text',
        placeholder: '$15',
        showIf: { field: 'day_pass_available', value: true },
        section: 'details',
      },
      {
        field: 'classes_offered',
        label: 'Classes Offered',
        type: 'multiselect',
        options: [
          { value: 'yoga', label: 'Yoga' },
          { value: 'pilates', label: 'Pilates' },
          { value: 'spin', label: 'Spin' },
          { value: 'hiit', label: 'HIIT' },
          { value: 'zumba', label: 'Zumba' },
          { value: 'crossfit', label: 'CrossFit' },
          { value: 'boxing', label: 'Boxing' },
          { value: 'swimming', label: 'Swimming' },
        ],
        section: 'features',
      },
      {
        field: 'personal_training',
        label: 'Personal Training',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'locker_rooms',
        label: 'Locker Rooms',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'showers',
        label: 'Showers',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'towel_service',
        label: 'Towel Service',
        type: 'boolean',
        section: 'amenities',
      },
      {
        field: 'is_24_7',
        label: 'Open 24/7',
        type: 'boolean',
        section: 'details',
      },
    ],
  },

  // ----------------------------------------
  // TRANSPORTATION (Airports, Stations)
  // ----------------------------------------
  {
    primaryCategory: 'transportation',
    subcategories: ['airport'],
    fields: [
      {
        field: 'airport_code',
        label: 'Airport Code',
        type: 'text',
        placeholder: 'MIA',
        section: 'details',
      },
      {
        field: 'airport_type',
        label: 'Airport Type',
        type: 'select',
        options: [
          { value: 'international', label: 'International' },
          { value: 'domestic', label: 'Domestic' },
          { value: 'regional', label: 'Regional' },
          { value: 'private', label: 'Private' },
        ],
        section: 'details',
      },
      {
        field: 'terminals',
        label: 'Number of Terminals',
        type: 'number',
        section: 'details',
      },
      {
        field: 'parking_available',
        label: 'Parking Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'rental_cars',
        label: 'Rental Cars On-Site',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'public_transit',
        label: 'Public Transit Access',
        type: 'boolean',
        section: 'features',
      },
    ],
  },

  // ----------------------------------------
  // PARKS & OUTDOORS
  // ----------------------------------------
  {
    primaryCategory: 'outdoors',
    fields: [
      {
        field: 'admission_fee',
        label: 'Admission Fee',
        type: 'boolean',
        section: 'details',
      },
      {
        field: 'admission_price',
        label: 'Admission Price',
        type: 'text',
        placeholder: '$10/vehicle',
        showIf: { field: 'admission_fee', value: true },
        section: 'details',
      },
      {
        field: 'activities',
        label: 'Activities',
        type: 'multiselect',
        options: [
          { value: 'hiking', label: 'Hiking' },
          { value: 'biking', label: 'Biking' },
          { value: 'camping', label: 'Camping' },
          { value: 'fishing', label: 'Fishing' },
          { value: 'swimming', label: 'Swimming' },
          { value: 'boating', label: 'Boating' },
          { value: 'picnicking', label: 'Picnicking' },
          { value: 'wildlife_viewing', label: 'Wildlife Viewing' },
        ],
        section: 'features',
      },
      {
        field: 'facilities',
        label: 'Facilities',
        type: 'multiselect',
        options: [
          { value: 'restrooms', label: 'Restrooms' },
          { value: 'visitor_center', label: 'Visitor Center' },
          { value: 'gift_shop', label: 'Gift Shop' },
          { value: 'food_service', label: 'Food Service' },
          { value: 'picnic_areas', label: 'Picnic Areas' },
          { value: 'playgrounds', label: 'Playgrounds' },
        ],
        section: 'features',
      },
      {
        field: 'pet_friendly',
        label: 'Pet Friendly',
        type: 'boolean',
        section: 'policies',
      },
      {
        field: 'wheelchair_accessible',
        label: 'Wheelchair Accessible Trails',
        type: 'boolean',
        section: 'accessibility',
      },
    ],
  },

  // ----------------------------------------
  // EVENTS & VENUES
  // ----------------------------------------
  {
    primaryCategory: 'events',
    fields: [
      {
        field: 'capacity',
        label: 'Maximum Capacity',
        type: 'number',
        placeholder: '200',
        section: 'details',
      },
      {
        field: 'venue_type',
        label: 'Venue Type',
        type: 'select',
        options: [
          { value: 'indoor', label: 'Indoor' },
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'both', label: 'Indoor & Outdoor' },
        ],
        section: 'details',
      },
      {
        field: 'catering',
        label: 'Catering',
        type: 'select',
        options: [
          { value: 'in_house', label: 'In-House Catering' },
          { value: 'preferred_vendors', label: 'Preferred Vendors' },
          { value: 'outside_allowed', label: 'Outside Catering Allowed' },
          { value: 'none', label: 'No Catering' },
        ],
        section: 'features',
      },
      {
        field: 'av_equipment',
        label: 'AV Equipment',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'parking',
        label: 'Parking Available',
        type: 'boolean',
        section: 'features',
      },
      {
        field: 'parking_capacity',
        label: 'Parking Capacity',
        type: 'number',
        showIf: { field: 'parking', value: true },
        section: 'features',
      },
      {
        field: 'wheelchair_accessible',
        label: 'Wheelchair Accessible',
        type: 'boolean',
        section: 'accessibility',
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get fields for a specific category
 */
export function getFieldsForCategory(
  primarySlug: string,
  subcategorySlug?: string
): CategoryField[] {
  const fields: CategoryField[] = [...UNIVERSAL_FIELDS];

  // Find matching configs
  for (const config of CATEGORY_FIELD_CONFIGS) {
    if (config.primaryCategory !== primarySlug) continue;

    // Check if this config applies to the subcategory
    if (config.subcategories) {
      if (subcategorySlug && config.subcategories.includes(subcategorySlug)) {
        fields.push(...config.fields);
      }
    } else {
      // No subcategory restriction, applies to all
      fields.push(...config.fields);
    }
  }

  // Add social media fields
  fields.push(...SOCIAL_MEDIA_FIELDS);

  return fields;
}

/**
 * Get fields grouped by section
 */
export function getFieldsBySection(
  primarySlug: string,
  subcategorySlug?: string
): Record<string, CategoryField[]> {
  const fields = getFieldsForCategory(primarySlug, subcategorySlug);
  const sections: Record<string, CategoryField[]> = {};

  for (const field of fields) {
    const section = field.section || 'other';
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(field);
  }

  return sections;
}

/**
 * Get section display names
 */
export const SECTION_NAMES: Record<string, string> = {
  basic: 'Basic Information',
  location: 'Location',
  contact: 'Contact Information',
  social: 'Social Media',
  details: 'Details',
  features: 'Features & Amenities',
  amenities: 'Amenities',
  services: 'Services',
  credentials: 'Credentials & Licensing',
  policies: 'Policies',
  accessibility: 'Accessibility',
  other: 'Other',
};

/**
 * Get section order for display
 */
export const SECTION_ORDER = [
  'basic',
  'location',
  'contact',
  'details',
  'features',
  'amenities',
  'services',
  'credentials',
  'policies',
  'accessibility',
  'social',
  'other',
];

export default {
  UNIVERSAL_FIELDS,
  SOCIAL_MEDIA_FIELDS,
  CATEGORY_FIELD_CONFIGS,
  getFieldsForCategory,
  getFieldsBySection,
  SECTION_NAMES,
  SECTION_ORDER,
};