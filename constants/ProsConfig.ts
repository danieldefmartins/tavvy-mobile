/**
 * Pros Configuration
 * Install path: constants/ProsConfig.ts
 */

// Update this URL to your deployed TavvY Pro Services backend
export const PROS_API_URL = 'https://your-tavvy-pro-services.manus.space';

// Service categories with Ionicons icon names
export const PROS_CATEGORIES = [
  { id: 1, name: 'Electrician', slug: 'electrician', icon: 'flash', color: '#F59E0B' },
  { id: 2, name: 'Plumber', slug: 'plumber', icon: 'water', color: '#3B82F6' },
  { id: 3, name: 'Pool Cleaning', slug: 'pool-cleaning', icon: 'water-outline', color: '#06B6D4' },
  { id: 4, name: 'Floor Installation', slug: 'floor-installation', icon: 'grid', color: '#8B5CF6' },
  { id: 5, name: 'Kitchen Remodeling', slug: 'kitchen-remodeling', icon: 'restaurant', color: '#EC4899' },
  { id: 6, name: 'House Cleaning', slug: 'house-cleaning', icon: 'sparkles', color: '#10B981' },
  { id: 7, name: 'HVAC', slug: 'hvac', icon: 'thermometer', color: '#EF4444' },
  { id: 8, name: 'Roofing', slug: 'roofing', icon: 'home', color: '#78716C' },
  { id: 9, name: 'Painting', slug: 'painting', icon: 'color-palette', color: '#F97316' },
  { id: 10, name: 'Landscaping', slug: 'landscaping', icon: 'leaf', color: '#22C55E' },
  { id: 11, name: 'Handyman', slug: 'handyman', icon: 'construct', color: '#6366F1' },
  { id: 12, name: 'Pest Control', slug: 'pest-control', icon: 'bug', color: '#84CC16' },
  { id: 13, name: 'Bathroom Remodeling', slug: 'bathroom-remodeling', icon: 'water', color: '#14B8A6' },
  { id: 14, name: 'Garage Door', slug: 'garage-door', icon: 'car', color: '#64748B' },
  { id: 15, name: 'Drywall', slug: 'drywall', icon: 'square', color: '#A3A3A3' },
  { id: 16, name: 'Fencing', slug: 'fencing', icon: 'apps', color: '#92400E' },
] as const;

// Pros theme colors (add to your Colors.ts)
export const ProsColors = {
  primary: '#0D9668',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  secondary: '#F59E0B',
  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Backgrounds
  cardBg: '#FFFFFF',
  sectionBg: '#F9FAFB',
  heroBg: '#F0FDF4',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// Subscription pricing
export const PROS_SUBSCRIPTION_TIERS = {
  earlyAdopter: {
    price: 99,
    label: 'Early Adopter',
    description: 'First 1,000 pros only',
    features: [
      'Professional profile page',
      'Unlimited lead requests',
      'Direct messaging',
      'Portfolio gallery',
      'Verified badge',
      'No per-lead fees',
    ],
  },
  standard: {
    price: 499,
    label: 'Standard',
    description: 'Full access for all professionals',
    features: [
      'Professional profile page',
      'Unlimited lead requests',
      'Direct messaging',
      'Portfolio gallery',
      'Verified badge',
      'No per-lead fees',
    ],
  },
};

// Lead status options
export const PROS_LEAD_STATUSES = [
  { value: 'new', label: 'New', color: '#3B82F6' },
  { value: 'contacted', label: 'Contacted', color: '#F59E0B' },
  { value: 'quoted', label: 'Quoted', color: '#8B5CF6' },
  { value: 'hired', label: 'Hired', color: '#10B981' },
  { value: 'completed', label: 'Completed', color: '#22C55E' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
] as const;

// Days of week for availability
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;
