/**
 * PROS NAVIGATION TYPES
 * =====================
 * 
 * ADD these types to your existing `types/navigation.ts` file
 * 
 * Instructions:
 * 1. Open types/navigation.ts
 * 2. Add these screen types inside your RootStackParamList
 */

// ============================================
// ADD THESE TO YOUR RootStackParamList:
// ============================================

// Pros Tab & Screens (add after Menu: undefined;)
ProsHome: undefined;
ProsBrowse: {
  categoryId?: number;
  categoryName?: string;
  searchQuery?: string;
  location?: string;
};
ProsProfile: {
  slug: string;
};
ProsDashboard: undefined;
ProsRegistration: undefined;
ProsMessages: {
  conversationId?: number;
  recipientId?: number;
  recipientName?: string;
};
ProsRequestQuote: {
  proId: number;
  proName?: string;
  categoryId?: number;
};
ProsLeads: undefined;
ProsLeadDetail: {
  leadId: number;
};
ProsEditProfile: undefined;
ProsPhotos: undefined;
ProsAvailability: undefined;
ProsServices: undefined;
ProsPricing: undefined;
ProsSettings: undefined;

// ============================================
// FULL UPDATED navigation.ts FILE:
// ============================================
// Copy this entire file to replace your types/navigation.ts

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define all your route params
export type RootStackParamList = {
  // Tab screens
  Home: undefined;
  Explore: undefined;
  Pros: undefined;  // NEW: Replaces the + (Create) tab
  Saved: undefined;
  Menu: undefined;
  
  // Stack screens
  PlaceDetails: { placeId: string };
  CityDetails: { cityId: string };
  UniverseLanding: { universeId: string };
  UniverseDetail: { universeId: string; universe?: any };
  UniverseDiscovery: undefined;
  CategoryBrowse: { category: string };
  AtlasHome: undefined;
  AtlasSearch: { query?: string };
  AddPhoto: { placeId: string; placeName: string };
  AddReview: { placeId: string; placeName: string };
  BusinessCardScanner: { onScanComplete: (data: any) => void };
  AddPlace: undefined;
  ClaimBusiness: { placeId: string };
  RateCity: { cityId: string };
  RequestUniverse: undefined;
  PlacePhotos: { placeId: string; placeName: string };
  ArticleDetail: { article: any; articleId?: string };
  
  // Auth screens
  Login: undefined;
  SignUp: undefined;
  ProfileMain: undefined;
  SavedMain: undefined;
  MenuMain: undefined;

  // ========== PROS SCREENS (NEW) ==========
  ProsHome: undefined;
  ProsBrowse: {
    categoryId?: number;
    categoryName?: string;
    searchQuery?: string;
    location?: string;
  };
  ProsProfile: {
    slug: string;
  };
  ProsDashboard: undefined;
  ProsRegistration: undefined;
  ProsMessages: {
    conversationId?: number;
    recipientId?: number;
    recipientName?: string;
  };
  ProsRequestQuote: {
    proId: number;
    proName?: string;
    categoryId?: number;
  };
  ProsLeads: undefined;
  ProsLeadDetail: {
    leadId: number;
  };
  ProsEditProfile: undefined;
  ProsPhotos: undefined;
  ProsAvailability: undefined;
  ProsServices: undefined;
  ProsPricing: undefined;
  ProsSettings: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
