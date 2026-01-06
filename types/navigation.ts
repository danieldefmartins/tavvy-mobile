import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define all your route params
export type RootStackParamList = {
  // Tab screens
  Home: undefined;
  Explore: undefined;
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
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
