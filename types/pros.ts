/**
 * Pros Types
 * Install path: types/pros.ts
 * 
 * TypeScript interfaces for the Pros feature
 */

// ============================================
// SERVICE CATEGORIES
// ============================================

export interface ProCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
}

// ============================================
// SERVICE PROVIDERS (PROS)
// ============================================

export interface Pro {
  id: number;
  userId: number;
  businessName: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadius?: number;
  yearsInBusiness?: number;
  licenseNumber?: string;
  isInsured: boolean;
  isVerified: boolean;
  isActive: boolean;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  responseTime?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  categories?: ProCategory[];
  photos?: ProPhoto[];
  subscription?: ProSubscription;
}

export interface ProPhoto {
  id: number;
  providerId: number;
  url: string;
  caption?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ProReview {
  id: number;
  providerId: number;
  userId: number;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  createdAt: string;
  // Joined data
  userName?: string;
  userAvatar?: string;
}

// ============================================
// SEARCH & RESPONSES
// ============================================

export interface SearchProsResponse {
  providers: Pro[];
  total: number;
}

export interface ProProfileResponse {
  provider: Pro;
  reviews: ProReview[];
  photos: ProPhoto[];
  categories: ProCategory[];
  availability: ProAvailability[];
}

// ============================================
// LEADS
// ============================================

export interface ProLead {
  id: number;
  providerId: number;
  userId: number;
  categoryId?: number;
  title: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  budget?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'pending' | 'contacted' | 'quoted' | 'hired' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  // Joined data
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  categoryName?: string;
  provider?: Pro;
}

export interface ProLeadRequestForm {
  providerId: number;
  categoryId?: number;
  title: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  budget?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

// ============================================
// MESSAGES & CONVERSATIONS
// ============================================

export interface ProConversation {
  id: number;
  providerId: number;
  userId: number;
  leadId?: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ProConversationWithDetails extends ProConversation {
  providerName?: string;
  providerPhoto?: string;
  userName?: string;
  userPhoto?: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ProMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: 'user' | 'provider';
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export interface ProSubscription {
  id: number;
  providerId: number;
  tier: 'early_adopter' | 'standard';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// ============================================
// AVAILABILITY
// ============================================

export interface ProAvailability {
  id: number;
  providerId: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM format
  endTime: string;
  isAvailable: boolean;
}

// ============================================
// REGISTRATION & PROFILE
// ============================================

export interface ProRegistrationForm {
  businessName: string;
  description?: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  serviceRadius: number;
  yearsInBusiness?: number;
  licenseNumber?: string;
  isInsured: boolean;
  categoryIds: number[];
}

export interface ProProfileUpdateForm {
  businessName?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceRadius?: number;
  yearsInBusiness?: number;
  licenseNumber?: string;
  isInsured?: boolean;
  categoryIds?: number[];
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface ProDashboardStats {
  totalLeads: number;
  newLeads: number;
  respondedLeads: number;
  hiredLeads: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  responseRate: number;
}

// ============================================
// SUBSCRIPTION INFO (for display)
// ============================================

export interface ProSubscriptionInfo {
  isSubscribed: boolean;
  tier?: 'early_adopter' | 'standard';
  status?: 'active' | 'cancelled' | 'expired' | 'pending';
  expiresAt?: string;
  earlyAdopterSpotsLeft: number;
  pricing: {
    earlyAdopter: number;
    standard: number;
  };
}
