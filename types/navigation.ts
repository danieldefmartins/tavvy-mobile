import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define all your route params
export type RootStackParamList = {
  // Tab screens
  Home: undefined;
  Explore: undefined;
  Pros: undefined;  // NEW: Replaces Add tab
  Atlas: undefined;
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

  // Create screen (moved to Menu)
  UniversalAdd: undefined;

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
  
  // Multi-step request form screens
  ProsRequestStep1: {
    categoryId?: string;
    categoryName?: string;
  };
  ProsRequestStep2Photo: {
    categoryId: string;
    categoryName: string;
    description?: string;
  };
  ProsRequestStep2: {
    categoryId: string;
    categoryName: string;
    description?: string;
  };
  ProsRequestStep3: {
    categoryId: string;
    categoryName: string;
    description?: string;
    timeline?: string;
    budget?: string;
  };
  ProsRequestStep4: {
    categoryId: string;
    categoryName: string;
    description?: string;
    timeline?: string;
    budget?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  ProsRequestStep5: {
    categoryId: string;
    categoryName: string;
    description?: string;
    timeline?: string;
    budget?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  // ========== ECARD SCREENS ==========
  ECardHome: undefined;
  ECardTemplates: undefined;
  ECardColorPicker: {
    templateId: string;
    templateConfig?: any;
    mode?: 'create' | 'edit';
    existingData?: any;
  };
  ECardBlockBuilder: {
    templateId: string;
    templateConfig: any;
    existingBlocks?: any[];
    mode?: 'create' | 'edit';
  };
  ECardBlockEditor: {
    block: any;
    onSave: (data: any) => void;
    colorScheme?: { primary: string; secondary: string };
  };
  CreateDigitalCard: {
    templateId?: string;
    templateConfig?: any;
    blocks?: any[];
    mode?: 'create' | 'edit';
    cardData?: any;
  };
  MyDigitalCard: {
    cardData?: any;
  };
  
  // ========== NEW LINKTREE-STYLE ECARD SCREENS ==========
  ECardOnboardingPlatforms: {
    templateId?: string;
    colorSchemeId?: string;
  };
  ECardOnboardingProfile: {
    templateId?: string;
    colorSchemeId?: string;
    selectedPlatforms?: string[];
  };
  ECardOnboardingLinks: {
    templateId?: string;
    colorSchemeId?: string;
    selectedPlatforms?: string[];
    profile?: {
      image?: string;
      name: string;
      title?: string;
      bio?: string;
    };
  };
  ECardOnboardingComplete: {
    templateId?: string;
    colorSchemeId?: string;
    profile?: any;
    links?: any[];
  };
  ECardDashboard: {
    templateId?: string;
    colorSchemeId?: string;
    profile?: any;
    links?: any[];
    isNewCard?: boolean;
    openAppearance?: boolean;
  };
  ECardAddLink: {
    onAdd?: (link: any) => void;
  };
  ECardEditLink: {
    link: any;
    onSave?: (link: any) => void;
    onDelete?: () => void;
  };
  ECardThemes: {
    onSelect?: (theme: any) => void;
    currentTheme?: string;
  };
  ECardBackgrounds: undefined;
  ECardButtons: undefined;
  ECardFonts: undefined;
  ECardPremiumUpsell: {
    feature?: string;
    themeName?: string;
  };
  ECardPreview: {
    profile?: any;
    links?: any[];
    templateId?: string;
  };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}