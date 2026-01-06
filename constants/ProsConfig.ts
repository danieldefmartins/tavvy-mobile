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
export const EARLY_ADOPTER_PRICE = 99;
export const STANDARD_PRICE = 499;
export const EARLY_ADOPTER_SPOTS_LEFT = 487; // Less than 500 remaining
export const EARLY_ADOPTER_SAVINGS = STANDARD_PRICE - EARLY_ADOPTER_PRICE; // $400 savings

export const PROS_SUBSCRIPTION_TIERS = {
  earlyAdopter: {
    price: EARLY_ADOPTER_PRICE,
    label: 'Early Adopter',
    description: `Only ${EARLY_ADOPTER_SPOTS_LEFT} spots left!`,
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

// ============================================================================
// SAMPLE DATA FOR TESTING
// ============================================================================

export interface SamplePro {
  id: number;
  slug: string;
  businessName: string;
  ownerName: string;
  categoryId: number;
  categoryName: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  zipCode: string;
  serviceRadius: number;
  rating: number;
  reviewCount: number;
  yearsInBusiness: number;
  isVerified: boolean;
  isFeatured: boolean;
  profileImage: string;
  photos: string[];
}

export const SAMPLE_PROS: SamplePro[] = []; /* Empty - real data from Supabase */

const _SAMPLE_PROS_REMOVED = [
  {
    id: 1,
    slug: 'ace-electric-miami',
    businessName: 'Ace Electric Services',
    ownerName: 'Mike Johnson',
    categoryId: 1,
    categoryName: 'Electrician',
    description: 'Licensed electrician with 15+ years of experience. Specializing in residential and commercial electrical work, panel upgrades, EV charger installation, and smart home wiring. Available 24/7 for emergencies.',
    phone: '(305) 555-0101',
    email: 'mike@aceelectric.com',
    website: 'www.aceelectricmiami.com',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    serviceRadius: 30,
    rating: 4.9,
    reviewCount: 127,
    yearsInBusiness: 15,
    isVerified: true,
    isFeatured: true,
    profileImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ],
  },
  {
    id: 2,
    slug: 'blue-wave-plumbing',
    businessName: 'Blue Wave Plumbing',
    ownerName: 'Carlos Rodriguez',
    categoryId: 2,
    categoryName: 'Plumber',
    description: 'Family-owned plumbing company serving South Florida since 2008. We handle everything from leaky faucets to complete bathroom remodels. Free estimates, fair pricing, and guaranteed satisfaction.',
    phone: '(305) 555-0202',
    email: 'carlos@bluewaveplumbing.com',
    website: 'www.bluewaveplumbing.com',
    city: 'Fort Lauderdale',
    state: 'FL',
    zipCode: '33301',
    serviceRadius: 25,
    rating: 4.8,
    reviewCount: 89,
    yearsInBusiness: 16,
    isVerified: true,
    isFeatured: true,
    profileImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    photos: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
    ],
  },
  {
    id: 3,
    slug: 'crystal-clear-pools',
    businessName: 'Crystal Clear Pool Service',
    ownerName: 'David Thompson',
    categoryId: 3,
    categoryName: 'Pool Cleaning',
    description: 'Premium pool maintenance and cleaning services. Weekly cleaning, chemical balancing, equipment repair, and pool renovations. Keeping your pool sparkling clean all year round.',
    phone: '(305) 555-0303',
    email: 'david@crystalclearpools.com',
    website: 'www.crystalclearpools.com',
    city: 'Coral Gables',
    state: 'FL',
    zipCode: '33134',
    serviceRadius: 20,
    rating: 4.7,
    reviewCount: 64,
    yearsInBusiness: 8,
    isVerified: true,
    isFeatured: false,
    profileImage: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400',
    photos: [
      'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800',
    ],
  },
  {
    id: 4,
    slug: 'pristine-floors-inc',
    businessName: 'Pristine Floors Inc',
    ownerName: 'James Wilson',
    categoryId: 4,
    categoryName: 'Floor Installation',
    description: 'Expert floor installation services including hardwood, tile, laminate, and vinyl. We transform spaces with beautiful, durable flooring. Free in-home consultations.',
    phone: '(305) 555-0404',
    email: 'james@pristinefloors.com',
    website: 'www.pristinefloors.com',
    city: 'Boca Raton',
    state: 'FL',
    zipCode: '33432',
    serviceRadius: 35,
    rating: 4.9,
    reviewCount: 156,
    yearsInBusiness: 12,
    isVerified: true,
    isFeatured: true,
    profileImage: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800',
    ],
  },
  {
    id: 5,
    slug: 'dream-kitchens-fl',
    businessName: 'Dream Kitchens Florida',
    ownerName: 'Sarah Martinez',
    categoryId: 5,
    categoryName: 'Kitchen Remodeling',
    description: 'Full-service kitchen remodeling from design to completion. Custom cabinets, countertops, appliances, and more. Award-winning designs that fit your budget.',
    phone: '(305) 555-0505',
    email: 'sarah@dreamkitchensfl.com',
    website: 'www.dreamkitchensfl.com',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    serviceRadius: 40,
    rating: 4.8,
    reviewCount: 78,
    yearsInBusiness: 10,
    isVerified: true,
    isFeatured: true,
    profileImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    photos: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    ],
  },
  {
    id: 6,
    slug: 'sparkle-clean-services',
    businessName: 'Sparkle Clean Services',
    ownerName: 'Maria Garcia',
    categoryId: 6,
    categoryName: 'House Cleaning',
    description: 'Professional house cleaning services for busy families. Regular cleaning, deep cleaning, move-in/move-out cleaning. Eco-friendly products available. Bonded and insured.',
    phone: '(305) 555-0606',
    email: 'maria@sparkleclean.com',
    website: 'www.sparklecleanservices.com',
    city: 'Hialeah',
    state: 'FL',
    zipCode: '33012',
    serviceRadius: 15,
    rating: 4.6,
    reviewCount: 203,
    yearsInBusiness: 6,
    isVerified: true,
    isFeatured: false,
    profileImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    photos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    ],
  },
  {
    id: 7,
    slug: 'cool-breeze-hvac',
    businessName: 'Cool Breeze HVAC',
    ownerName: 'Robert Brown',
    categoryId: 7,
    categoryName: 'HVAC',
    description: 'Complete HVAC services including installation, repair, and maintenance. Keep your home comfortable year-round with our expert technicians. 24/7 emergency service.',
    phone: '(305) 555-0707',
    email: 'robert@coolbreezehvac.com',
    website: 'www.coolbreezehvac.com',
    city: 'Pembroke Pines',
    state: 'FL',
    zipCode: '33024',
    serviceRadius: 30,
    rating: 4.7,
    reviewCount: 112,
    yearsInBusiness: 18,
    isVerified: true,
    isFeatured: false,
    profileImage: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    photos: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    ],
  },
  {
    id: 8,
    slug: 'top-notch-roofing',
    businessName: 'Top Notch Roofing',
    ownerName: 'William Davis',
    categoryId: 8,
    categoryName: 'Roofing',
    description: 'Licensed roofing contractor specializing in roof repair, replacement, and storm damage restoration. Shingle, tile, and metal roofs. Free inspections and estimates.',
    phone: '(305) 555-0808',
    email: 'william@topnotchroofing.com',
    website: 'www.topnotchroofing.com',
    city: 'Hollywood',
    state: 'FL',
    zipCode: '33020',
    serviceRadius: 50,
    rating: 4.8,
    reviewCount: 94,
    yearsInBusiness: 22,
    isVerified: true,
    isFeatured: true,
    profileImage: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400',
    photos: [
      'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800',
    ],
  },
]; // End of _SAMPLE_PROS_REMOVED (kept for reference but not exported)

// Sample leads for Pro Dashboard testing
export interface SampleLead {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  description: string;
  status: 'new' | 'contacted' | 'quoted' | 'hired' | 'completed' | 'cancelled';
  createdAt: string;
  city: string;
  zipCode: string;
}

export const SAMPLE_LEADS: SampleLead[] = []; /* Empty - real data from Supabase */

const _SAMPLE_LEADS_REMOVED = [
  {
    id: 1,
    customerName: 'Jennifer Smith',
    customerEmail: 'jennifer@email.com',
    customerPhone: '(305) 555-1001',
    serviceType: 'Electrical Repair',
    description: 'Need to fix a faulty outlet in my kitchen. Sparking when I plug in appliances.',
    status: 'new',
    createdAt: '2026-01-05T14:30:00Z',
    city: 'Miami',
    zipCode: '33101',
  },
  {
    id: 2,
    customerName: 'Michael Chen',
    customerEmail: 'mchen@email.com',
    customerPhone: '(305) 555-1002',
    serviceType: 'Panel Upgrade',
    description: 'Looking to upgrade my electrical panel from 100A to 200A. Home is 2,500 sq ft.',
    status: 'contacted',
    createdAt: '2026-01-04T10:15:00Z',
    city: 'Coral Gables',
    zipCode: '33134',
  },
  {
    id: 3,
    customerName: 'Amanda Johnson',
    customerEmail: 'amanda.j@email.com',
    customerPhone: '(305) 555-1003',
    serviceType: 'EV Charger Installation',
    description: 'Need a Level 2 EV charger installed in my garage. Tesla Model 3.',
    status: 'quoted',
    createdAt: '2026-01-03T16:45:00Z',
    city: 'Miami Beach',
    zipCode: '33139',
  },
  {
    id: 4,
    customerName: 'David Williams',
    customerEmail: 'dwilliams@email.com',
    customerPhone: '(305) 555-1004',
    serviceType: 'Lighting Installation',
    description: 'Want to install recessed lighting in living room. About 8 lights total.',
    status: 'hired',
    createdAt: '2026-01-02T09:00:00Z',
    city: 'Fort Lauderdale',
    zipCode: '33301',
  },
  {
    id: 5,
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa.a@email.com',
    customerPhone: '(305) 555-1005',
    serviceType: 'Whole House Rewiring',
    description: 'Older home built in 1965. Need complete rewiring for safety.',
    status: 'completed',
    createdAt: '2025-12-28T11:30:00Z',
    city: 'Boca Raton',
    zipCode: '33432',
  },
]; // End of _SAMPLE_LEADS_REMOVED

// Sample messages for testing
export interface SampleMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderType: 'user' | 'pro';
  content: string;
  createdAt: string;
  isRead: boolean;
}

export const SAMPLE_CONVERSATIONS: any[] = []; /* Empty - real data from Supabase */

const _SAMPLE_CONVERSATIONS_REMOVED = [
  {
    id: 1,
    otherPartyName: 'Jennifer Smith',
    otherPartyType: 'user' as const,
    lastMessage: 'Thanks for the quick response! When can you come by?',
    lastMessageAt: '2026-01-05T15:30:00Z',
    unreadCount: 1,
  },
  {
    id: 2,
    otherPartyName: 'Michael Chen',
    otherPartyType: 'user' as const,
    lastMessage: 'The quote looks good. Let me discuss with my wife.',
    lastMessageAt: '2026-01-04T18:00:00Z',
    unreadCount: 0,
  },
  {
    id: 3,
    otherPartyName: 'Ace Electric Services',
    otherPartyType: 'pro' as const,
    lastMessage: 'We can schedule the installation for next Tuesday.',
    lastMessageAt: '2026-01-03T12:00:00Z',
    unreadCount: 2,
  },
]; // End of _SAMPLE_CONVERSATIONS_REMOVED

export const SAMPLE_MESSAGES: SampleMessage[] = []; /* Empty - real data from Supabase */

const _SAMPLE_MESSAGES_REMOVED: SampleMessage[] = [
  {
    id: 1,
    conversationId: 1,
    senderId: 100,
    senderName: 'Jennifer Smith',
    senderType: 'user',
    content: 'Hi, I saw your profile and I need help with an electrical issue.',
    createdAt: '2026-01-05T14:30:00Z',
    isRead: true,
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1,
    senderName: 'Mike Johnson',
    senderType: 'pro',
    content: 'Hello Jennifer! Thanks for reaching out. Can you describe the issue in more detail?',
    createdAt: '2026-01-05T14:45:00Z',
    isRead: true,
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 100,
    senderName: 'Jennifer Smith',
    senderType: 'user',
    content: 'Yes, my kitchen outlet is sparking when I plug in appliances. It started yesterday.',
    createdAt: '2026-01-05T15:00:00Z',
    isRead: true,
  },
  {
    id: 4,
    conversationId: 1,
    senderId: 1,
    senderName: 'Mike Johnson',
    senderType: 'pro',
    content: 'That sounds like it could be a loose connection or worn outlet. I can come by tomorrow morning to take a look. Would 9am work?',
    createdAt: '2026-01-05T15:15:00Z',
    isRead: true,
  },
  {
    id: 5,
    conversationId: 1,
    senderId: 100,
    senderName: 'Jennifer Smith',
    senderType: 'user',
    content: 'Thanks for the quick response! When can you come by?',
    createdAt: '2026-01-05T15:30:00Z',
    isRead: false,
  },
]; // End of _SAMPLE_MESSAGES_REMOVED

// Sample reviews for testing
export interface SampleReview {
  id: number;
  proId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  serviceType: string;
}

export const SAMPLE_REVIEWS: SampleReview[] = []; /* Empty - real data from Supabase */

const _SAMPLE_REVIEWS_REMOVED: SampleReview[] = [
  {
    id: 1,
    proId: 1,
    userId: 101,
    userName: 'John D.',
    rating: 5,
    comment: 'Mike was fantastic! He arrived on time, explained everything clearly, and fixed our electrical issue quickly. Highly recommend!',
    createdAt: '2026-01-02T10:00:00Z',
    serviceType: 'Electrical Repair',
  },
  {
    id: 2,
    proId: 1,
    userId: 102,
    userName: 'Sarah M.',
    rating: 5,
    comment: 'Professional, knowledgeable, and fair pricing. Installed our EV charger without any issues.',
    createdAt: '2025-12-28T14:30:00Z',
    serviceType: 'EV Charger Installation',
  },
  {
    id: 3,
    proId: 1,
    userId: 103,
    userName: 'Robert K.',
    rating: 4,
    comment: 'Good work on the panel upgrade. Took a bit longer than expected but the quality was excellent.',
    createdAt: '2025-12-20T09:00:00Z',
    serviceType: 'Panel Upgrade',
  },
  {
    id: 4,
    proId: 2,
    userId: 104,
    userName: 'Emily R.',
    rating: 5,
    comment: 'Carlos and his team did an amazing job on our bathroom plumbing. Very clean and professional.',
    createdAt: '2026-01-01T11:00:00Z',
    serviceType: 'Bathroom Plumbing',
  },
  {
    id: 5,
    proId: 2,
    userId: 105,
    userName: 'Mark T.',
    rating: 5,
    comment: 'Fixed our leak same day. Fair price and great service. Will use again!',
    createdAt: '2025-12-25T16:00:00Z',
    serviceType: 'Leak Repair',
  },
]; // End of _SAMPLE_REVIEWS_REMOVED