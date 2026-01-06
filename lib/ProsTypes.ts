/**
 * Pros TypeScript Types
 * Install path: lib/ProsTypes.ts
 */

export interface ProCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export interface Pro {
  id: number;
  userId: number;
  businessName: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadius: number;
  yearsInBusiness: number | null;
  licenseNumber: string | null;
  isInsured: boolean;
  isLicensed: boolean;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: string;
  totalReviews: number;
  responseTime: string | null;
  categories?: ProCategoryLink[];
  photos?: ProPhoto[];
  reviews?: ProReview[];
  availability?: ProAvailability[];
}

export interface ProCategoryLink {
  id: number;
  providerId: number;
  categoryId: number;
  isPrimary: boolean;
  category?: ProCategory;
}

export interface ProPhoto {
  id: number;
  providerId: number;
  imageUrl: string;
  caption: string | null;
  categoryId: number | null;
  sortOrder: number;
}

export interface ProReview {
  id: number;
  providerId: number;
  userId: number;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface ProAvailability {
  id: number;
  providerId: number;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
}

export interface ProSubscription {
  id: number;
  providerId: number;
  tier: 'early_adopter' | 'standard';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  pricePerYear: string;
  startDate: string;
  endDate: string;
  earlyAdopterNumber: number | null;
}

export interface ProLead {
  id: number;
  providerId: number;
  userId: number;
  categoryId: number | null;
  title: string;
  description: string | null;
  status: ProLeadStatus;
  preferredDate: string | null;
  budget: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export type ProLeadStatus = 'new' | 'contacted' | 'quoted' | 'hired' | 'completed' | 'cancelled';

export interface ProConversation {
  id: number;
  providerId: number;
  userId: number;
  leadRequestId: number | null;
  lastMessageAt: string;
  userUnread: number;
  providerUnread: number;
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

export interface ProConversationWithDetails {
  conversation: ProConversation;
  provider?: Pro;
  user?: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  lastMessage?: ProMessage;
}

// API Response types
export interface SearchProsResponse {
  providers: Pro[];
  total: number;
}

export interface ProProfileResponse extends Pro {
  categories: ProCategoryLink[];
  photos: ProPhoto[];
  reviews: ProReview[];
  availability: ProAvailability[];
}

// Form types
export interface ProRegistrationForm {
  businessName: string;
  description?: string;
  phone?: string;
  email?: string;
  city: string;
  state: string;
  zipCode: string;
  categoryIds: number[];
  primaryCategoryId?: number;
}

export interface ProLeadRequestForm {
  providerId: number;
  categoryId?: number;
  title: string;
  description?: string;
  preferredDate?: Date;
  budget?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

export interface ProProfileUpdateForm {
  businessName?: string;
  description?: string;
  shortDescription?: string;
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
  isLicensed?: boolean;
  categoryIds?: number[];
  primaryCategoryId?: number;
}
