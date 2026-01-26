import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { UnreadMessagesProvider, useUnreadMessagesContext } from './contexts/UnreadMessagesContext';
import { Colors, darkTheme } from './constants/Colors';

// Animated Splash Screen (replaces VideoSplashScreen)
import AnimatedSplash from './components/AnimatedSplash';

// Error Boundary for graceful error handling
import ErrorBoundary from './components/ErrorBoundary';

// Network connectivity monitoring
import { NetworkProvider } from './contexts/NetworkContext';

// Signal System - Preload cache on app start
import { preloadSignalLabels } from './hooks/useSignalLabels';
import { preloadSignalCache } from './lib/reviews';

// Screens
import HomeScreen from './screens/HomeScreen';
import PlaceDetailsScreen from './screens/PlaceDetailsScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import AddPhotoScreen from './screens/AddPhotoScreen';
import PlacePhotosScreen from './screens/PlacePhotosScreen';
import RequestUniverseScreen from './screens/RequestUniverseScreen';
import CityDetailsScreen from './screens/CityDetailsScreen';
import RateCityScreen from './screens/RateCityScreen';
import ClaimBusinessScreen from './screens/ClaimBusinessScreen';

import UniverseDiscoveryScreen from './screens/UniverseDiscoveryScreen';
import UniverseLandingScreen from './screens/UniverseLandingScreen';

import UniversalAddScreen from './screens/UniversalAddScreen';
import UniversalAddScreenV3 from './screens/UniversalAddScreenV3';
import AddPlaceScreen from './screens/AddPlaceScreen';
import BusinessCardScannerScreen from './screens/BusinessCardScannerScreen';

import AtlasHomeScreen from './screens/AtlasHomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import UniverseDetailScreen from './screens/UniverseDetailScreen';
import CategoryBrowseScreen from './screens/CategoryBrowseScreen';
import AtlasSearchScreen from './screens/AtlasSearchScreen';
import OwnerSpotlightScreen from './screens/OwnerSpotlightScreen';

import MenuScreen from './screens/MenuScreen';
import AppsScreen from './screens/AppsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedScreen from './screens/SavedScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import WelcomeOnboardingScreen from './screens/WelcomeOnboardingScreen';

// ========== PROS SCREENS (NEW) ==========
import ProsHomeScreen from './screens/ProsHomeScreen';
import ProsBrowseScreen from './screens/ProsBrowseScreen';
import ProsProfileScreen from './screens/ProsProfileScreen';
import ProsDashboardScreen from './screens/ProsDashboardScreen';
import ProsRegistrationScreen from './screens/ProsRegistrationScreen';
import ProsMessagesScreen from './screens/ProsMessagesScreen';
import ProsRequestQuoteScreen from './screens/ProsRequestQuoteScreen';
import ProsLeadsScreen from './screens/ProsLeadsScreen';
import ProsRequestStep0Screen from './screens/ProsRequestStep0Screen';
import ProsRequestStep1Screen from './screens/ProsRequestStep1Screen';
import ProsRequestStep2PhotoScreen from './screens/ProsRequestStep2PhotoScreen';
import ProsRequestStep2Screen from './screens/ProsRequestStep2Screen';
import ProsRequestStep3Screen from './screens/ProsRequestStep3Screen';
import ProsRequestStep4Screen from './screens/ProsRequestStep4Screen';
import ProsRequestStep5Screen from './screens/ProsRequestStep5Screen';
import ProsProjectStatusScreen from './screens/ProsProjectStatusScreen';
import ProsLoginScreen from './screens/ProsLoginScreen';

// ========== BROWSE SCREENS ==========
import RidesBrowseScreen from './screens/RidesBrowseScreen';
import RVCampingBrowseScreen from './screens/RVCampingBrowseScreen';
import CitiesBrowseScreen from './screens/CitiesBrowseScreen';
import RideDetailsScreen from './screens/RideDetailsScreen';
import RealtorsHubScreen from './screens/RealtorsHubScreen';
import RealtorsBrowseScreen from './screens/RealtorsBrowseScreen';
import RealtorDetailScreen from './screens/RealtorDetailScreen';

// ========== REALTOR MATCH QUESTIONNAIRE SCREENS ==========
import RealtorMatchStartScreen from './screens/RealtorMatchStartScreen';
import RealtorMatchQ1Screen from './screens/RealtorMatchQ1Screen';
import RealtorMatchQ2Screen from './screens/RealtorMatchQ2Screen';
import RealtorMatchQ3Screen from './screens/RealtorMatchQ3Screen';
import {
  RealtorMatchQ4Screen,
  RealtorMatchQ5Screen,
  RealtorMatchQ6Screen,
  RealtorMatchQ7Screen,
  RealtorMatchQ8Screen,
  RealtorMatchQ9Screen,
  RealtorMatchQ10Screen,
  RealtorMatchQ11Screen,
  RealtorMatchQ12Screen,
} from './screens/RealtorMatchQ4to12Screens';
import RealtorMatchContactScreen from './screens/RealtorMatchContactScreen';
import RealtorMatchCompleteScreen from './screens/RealtorMatchCompleteScreen';

// ========== MISSING SCREENS (Referenced but not in navigation) ==========
import SettingsScreen from './screens/SettingsScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import ProsLeadDetailScreen from './screens/ProsLeadDetailScreen';

// ========== ON THE GO SCREEN ==========
import OnTheGoScreen from './screens/OnTheGoScreen';
import PlaceScheduleScreen from './screens/PlaceScheduleScreen';

// ========== STORY & DISCOVERY SCREENS ==========
import StoryUploadScreen from './screens/StoryUploadScreen';
import OwnerHighlightsScreen from './screens/OwnerHighlightsScreen';
import StoryModerationScreen from './screens/StoryModerationScreen';
import StoryAnalyticsScreen from './screens/StoryAnalyticsScreen';
import QuickFindResultsScreen from './screens/QuickFindResultsScreen';
import HappeningNowScreen from './screens/HappeningNowScreen';
import WalletScreen from './screens/WalletScreen';
import ProCardDetailScreen from './screens/ProCardDetailScreen';
import CreateDigitalCardScreen from './screens/CreateDigitalCardScreen';
import MyDigitalCardScreen from './screens/MyDigitalCardScreen';
import MyCardsScreen from './screens/MyCardsScreen';
import CardSettingsScreen from './screens/CardSettingsScreen';
import PublicCardViewScreen from './screens/PublicCardViewScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import BusinessStoryModerationScreen from './screens/BusinessStoryModerationScreen';

// ========== ECARD TEMPLATE SCREENS ==========
import ECardTemplateGalleryScreen from './screens/ECardTemplateGalleryScreen';
import ECardColorPickerScreen from './screens/ECardColorPickerScreen';
import ECardMultiPageUpgradeScreen from './screens/ECardMultiPageUpgradeScreen';
import ECardBlockBuilderScreen from './screens/ECardBlockBuilderScreen';

// ========== NEW ECARD LINKTREE-STYLE SCREENS ==========
import {
  ECardHubScreen,
  ECardOnboardingPlatformsScreen,
  ECardOnboardingProfileScreen,
  ECardOnboardingLinksScreen,
  ECardOnboardingCompleteScreen,
  ECardDashboardScreen,
  ECardAddLinkScreen,
  ECardEditLinkScreen,
  ECardThemesScreen,
  ECardPremiumUpsellScreen,
  ECardPreviewScreen,
  ECardNFCWriteScreen,
  ECardFormBlockScreen,
} from './screens/ecard';
import VerificationUploadScreen from './screens/VerificationUploadScreen';

// ✅ Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const Tab = createBottomTabNavigator();

// ✅ Use separate stacks for clarity
const HomeStackNav = createNativeStackNavigator();
const AtlasStackNav = createNativeStackNavigator();
const MenuStackNav = createNativeStackNavigator();
const UniverseStackNav = createNativeStackNavigator();
const ProsStackNav = createNativeStackNavigator(); // NEW: Pros Stack

// --------------------
// Home Stack
// --------------------
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
      <HomeStackNav.Screen name="AddReview" component={AddReviewScreen} />
      <HomeStackNav.Screen name="AddPhoto" component={AddPhotoScreen as any} />
      <HomeStackNav.Screen name="PlacePhotos" component={PlacePhotosScreen as any} />
      <HomeStackNav.Screen name="RequestUniverse" component={RequestUniverseScreen} />
      <HomeStackNav.Screen name="CityDetails" component={CityDetailsScreen} />
      <HomeStackNav.Screen name="RateCity" component={RateCityScreen} />
      <HomeStackNav.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
      {/* Browse Screens */}
      <HomeStackNav.Screen name="RidesBrowse" component={RidesBrowseScreen} />
      <HomeStackNav.Screen name="RideDetails" component={RideDetailsScreen} />
      <HomeStackNav.Screen name="RVCampingBrowse" component={RVCampingBrowseScreen} />
      <HomeStackNav.Screen name="CitiesBrowse" component={CitiesBrowseScreen} />
      {/* Business Card Scanner - accessible from AddPlaceScreen */}
      <HomeStackNav.Screen 
        name="BusinessCardScanner" 
        component={BusinessCardScannerScreen}
        options={{ presentation: 'modal' }}
      />
      {/* Story & Discovery Screens */}
      <HomeStackNav.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen}
        options={{ presentation: 'modal' }}
      />
      <HomeStackNav.Screen name="OwnerHighlights" component={OwnerHighlightsScreen} />
      <HomeStackNav.Screen name="StoryAnalytics" component={StoryAnalyticsScreen} />
      <HomeStackNav.Screen name="QuickFindResults" component={QuickFindResultsScreen} />
      <HomeStackNav.Screen name="HappeningNow" component={HappeningNowScreen} />
    </HomeStackNav.Navigator>
  );
}

// --------------------
// Atlas Stack
// --------------------
function AtlasStack() {
  return (
    <AtlasStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AtlasStackNav.Screen name="AtlasMain" component={AtlasHomeScreen} />
      <AtlasStackNav.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <AtlasStackNav.Screen name="OwnerSpotlight" component={OwnerSpotlightScreen} />
      <AtlasStackNav.Screen name="UniverseDetail" component={UniverseDetailScreen} />
      <AtlasStackNav.Screen name="CategoryBrowse" component={CategoryBrowseScreen} />
      <AtlasStackNav.Screen name="AtlasSearch" component={AtlasSearchScreen} />
      <AtlasStackNav.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
    </AtlasStackNav.Navigator>
  );
}

// --------------------
// Apps Stack
// --------------------
function AppsStack() {
  return (
    <MenuStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MenuStackNav.Screen name="AppsMain" component={AppsScreen} />
      <MenuStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <MenuStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <MenuStackNav.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen}
        options={{ presentation: 'modal' }}
      />
      <MenuStackNav.Screen name="SavedMain" component={SavedScreen} />

      {/* Auth */}
      <MenuStackNav.Screen name="Login" component={LoginScreen} />
      <MenuStackNav.Screen name="ProsLogin" component={ProsLoginScreen} />

      {/* Shared screens accessible from menu */}
      <MenuStackNav.Screen name="RateCity" component={RateCityScreen} />
      
      {/* Browse Screens accessible from Apps */}
      <MenuStackNav.Screen name="CitiesBrowse" component={CitiesBrowseScreen} />
      <MenuStackNav.Screen name="RidesBrowse" component={RidesBrowseScreen} />
      <MenuStackNav.Screen name="RVCampingBrowse" component={RVCampingBrowseScreen} />
      <MenuStackNav.Screen name="UniverseDiscovery" component={UniverseDiscoveryScreen} />
      <MenuStackNav.Screen name="UniverseLanding" component={UniverseLandingScreen} />
      <MenuStackNav.Screen name="RideDetails" component={RideDetailsScreen} />
      <MenuStackNav.Screen name="CityDetails" component={CityDetailsScreen} />
      <MenuStackNav.Screen name="AddReview" component={AddReviewScreen} />
      <MenuStackNav.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
      
      {/* Create functionality moved to Menu */}
      <MenuStackNav.Screen name="UniversalAdd" component={UniversalAddScreenV3} />
      <MenuStackNav.Screen name="AddPlace" component={AddPlaceScreen} />
      
      {/* Business Card Scanner - accessible from AddPlaceScreen */}
      <MenuStackNav.Screen 
        name="BusinessCardScanner" 
        component={BusinessCardScannerScreen}
        options={{ presentation: 'modal' }}
      />
      
      {/* Realtors Hub accessible from Apps */}
      <MenuStackNav.Screen name="RealtorsHub" component={RealtorsHubScreen} />
      <MenuStackNav.Screen name="RealtorsBrowse" component={RealtorsBrowseScreen} />
      <MenuStackNav.Screen name="RealtorDetail" component={RealtorDetailScreen} />
      
      {/* Realtor Match Questionnaire Flow */}
      <MenuStackNav.Screen name="RealtorMatchStart" component={RealtorMatchStartScreen} />
      <MenuStackNav.Screen name="RealtorMatchQ1" component={RealtorMatchQ1Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ2" component={RealtorMatchQ2Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ3" component={RealtorMatchQ3Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ4" component={RealtorMatchQ4Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ5" component={RealtorMatchQ5Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ6" component={RealtorMatchQ6Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ7" component={RealtorMatchQ7Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ8" component={RealtorMatchQ8Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ9" component={RealtorMatchQ9Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ10" component={RealtorMatchQ10Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ11" component={RealtorMatchQ11Screen} />
      <MenuStackNav.Screen name="RealtorMatchQ12" component={RealtorMatchQ12Screen} />
      <MenuStackNav.Screen name="RealtorMatchContact" component={RealtorMatchContactScreen} />
      <MenuStackNav.Screen name="RealtorMatchComplete" component={RealtorMatchCompleteScreen} />
      
      {/* Pro Dashboard accessible from Menu */}
      <MenuStackNav.Screen name="ProsDashboard" component={ProsDashboardScreen} />
      <MenuStackNav.Screen name="ProsLeads" component={ProsLeadsScreen} />
      <MenuStackNav.Screen name="ProsMessages" component={ProsMessagesScreen} />
      
      {/* Settings and Help - referenced by other screens */}
      <MenuStackNav.Screen name="Settings" component={SettingsScreen} />
      <MenuStackNav.Screen name="HelpSupport" component={HelpSupportScreen} />
      
      {/* Happening Now - accessible from Apps */}
      <MenuStackNav.Screen name="HappeningNow" component={HappeningNowScreen} />
      
      {/* On The Go - Live mobile businesses map */}
      <MenuStackNav.Screen name="OnTheGo" component={OnTheGoScreen} />
      <MenuStackNav.Screen name="PlaceSchedule" component={PlaceScheduleScreen} />
      
      {/* Wallet - Pro Cards collection */}
      <MenuStackNav.Screen name="Wallet" component={WalletScreen} />
      <MenuStackNav.Screen name="ProCardDetail" component={ProCardDetailScreen} />
      
      {/* Digital Card - Create and share digital business cards */}
      <MenuStackNav.Screen name="ECardTemplateGallery" component={ECardTemplateGalleryScreen} />
      <MenuStackNav.Screen name="ECardColorPicker" component={ECardColorPickerScreen} />
      <MenuStackNav.Screen name="ECardBlockBuilder" component={ECardBlockBuilderScreen} />
      <MenuStackNav.Screen name="ECardMultiPageUpgrade" component={ECardMultiPageUpgradeScreen} />
      <MenuStackNav.Screen name="CreateDigitalCard" component={CreateDigitalCardScreen} />
      <MenuStackNav.Screen name="MyDigitalCard" component={MyDigitalCardScreen} />
      <MenuStackNav.Screen name="MyCards" component={MyCardsScreen} />
      <MenuStackNav.Screen name="CardSettings" component={CardSettingsScreen} />
      <MenuStackNav.Screen name="PublicCardView" component={PublicCardViewScreen} />
      
      {/* NEW: Linktree-style eCard Flow */}
      <MenuStackNav.Screen name="ECardHub" component={ECardHubScreen} />
      <MenuStackNav.Screen name="ECardOnboardingPlatforms" component={ECardOnboardingPlatformsScreen} />
      <MenuStackNav.Screen name="ECardOnboardingProfile" component={ECardOnboardingProfileScreen} />
      <MenuStackNav.Screen name="ECardOnboardingLinks" component={ECardOnboardingLinksScreen} />
      <MenuStackNav.Screen name="ECardOnboardingComplete" component={ECardOnboardingCompleteScreen} />
      <MenuStackNav.Screen name="ECardDashboard" component={ECardDashboardScreen} />
      <MenuStackNav.Screen name="ECardAddLink" component={ECardAddLinkScreen} />
      <MenuStackNav.Screen name="ECardEditLink" component={ECardEditLinkScreen} />
      <MenuStackNav.Screen name="ECardThemes" component={ECardThemesScreen} />
      <MenuStackNav.Screen name="ECardPremiumUpsell" component={ECardPremiumUpsellScreen} />
      <MenuStackNav.Screen name="ECardPreview" component={ECardPreviewScreen} />
      <MenuStackNav.Screen name="ECardNFCWrite" component={ECardNFCWriteScreen} />
      <MenuStackNav.Screen name="ECardFormBlock" component={ECardFormBlockScreen} />
      <MenuStackNav.Screen name="VerificationUpload" component={VerificationUploadScreen} />
      
      {/* Admin Screens */}
      <MenuStackNav.Screen name="StoryModeration" component={StoryModerationScreen} />
      <MenuStackNav.Screen name="StoryAnalytics" component={StoryAnalyticsScreen} />
      <MenuStackNav.Screen name="BusinessStoryModeration" component={BusinessStoryModerationScreen} />
    </MenuStackNav.Navigator>
  );
}

// --------------------
// Universe Stack
// --------------------
function UniverseStack() {
  return (
    <UniverseStackNav.Navigator screenOptions={{ headerShown: false }}>
      <UniverseStackNav.Screen name="UniverseDiscovery" component={UniverseDiscoveryScreen} />
      <UniverseStackNav.Screen name="UniverseLanding" component={UniverseLandingScreen} />
      <UniverseStackNav.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
    </UniverseStackNav.Navigator>
  );
}

// --------------------
// Pros Stack (NEW)
// --------------------
function ProsStack() {
  return (
    <ProsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProsStackNav.Screen name="ProsHome" component={ProsHomeScreen} />
      <ProsStackNav.Screen name="ProsBrowse" component={ProsBrowseScreen} />
      <ProsStackNav.Screen name="ProsProfile" component={ProsProfileScreen} />
      <ProsStackNav.Screen name="ProsDashboard" component={ProsDashboardScreen} />
      <ProsStackNav.Screen name="ProsRegistration" component={ProsRegistrationScreen} />
      <ProsStackNav.Screen name="ProsMessages" component={ProsMessagesScreen} />
      <ProsStackNav.Screen 
        name="ProsRequestQuote" 
        component={ProsRequestQuoteScreen}
        options={{ presentation: 'modal' }}
      />
      <ProsStackNav.Screen name="ProsLeads" component={ProsLeadsScreen} />
      <ProsStackNav.Screen name="ProsLeadDetail" component={ProsLeadDetailScreen} />
      <ProsStackNav.Screen name="ProsRequestStep0" component={ProsRequestStep0Screen} />
      <ProsStackNav.Screen name="ProsRequestStep1" component={ProsRequestStep1Screen} />
      <ProsStackNav.Screen name="ProsRequestStep2Photo" component={ProsRequestStep2PhotoScreen} />
      <ProsStackNav.Screen name="ProsRequestStep2" component={ProsRequestStep2Screen} />
      <ProsStackNav.Screen name="ProsRequestStep3" component={ProsRequestStep3Screen} />
      <ProsStackNav.Screen name="ProsRequestStep4" component={ProsRequestStep4Screen} />
      <ProsStackNav.Screen name="ProsRequestStep5" component={ProsRequestStep5Screen} />
      <ProsStackNav.Screen name="ProsProjectStatus" component={ProsProjectStatusScreen} />
      {/* Auth screens accessible from Pros flow */}
      <ProsStackNav.Screen name="SignUp" component={SignUpScreen} />
      <ProsStackNav.Screen name="Login" component={LoginScreen} />
      <ProsStackNav.Screen name="WelcomeOnboarding" component={WelcomeOnboardingScreen} />
    </ProsStackNav.Navigator>
  );
}

// --------------------
// Tab Icon with Badge Component
// --------------------
interface TabIconWithBadgeProps {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badgeCount?: number;
}

function TabIconWithBadge({ iconName, color, size, badgeCount = 0 }: TabIconWithBadgeProps) {
  return (
    <View style={{ width: size + 10, height: size + 10, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={iconName} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={badgeStyles.badge}>
          <Text style={badgeStyles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// --------------------
// Tabs
// --------------------
function TabNavigator() {
  const { theme, isDark } = useThemeContext();
  const { unreadCount } = useUnreadMessagesContext();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explore':
              iconName = focused ? 'planet' : 'planet-outline';
              break;
            case 'Pros':
              iconName = focused ? 'construct' : 'construct-outline';
              break;
            case 'Atlas':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Apps':
              iconName = focused ? 'apps' : 'apps-outline';
              // Show badge on Apps tab for unread messages
              return (
                <TabIconWithBadge 
                  iconName={iconName} 
                  color={color} 
                  size={size} 
                  badgeCount={unreadCount} 
                />
              );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Explore" component={UniverseStack} options={{ tabBarLabel: 'Universes' }} />

      {/* CHANGED: Replaced Add tab with Pros tab */}
      <Tab.Screen
        name="Pros"
        component={ProsStack}
        options={{
          tabBarLabel: 'Pros',
        }}
      />

      <Tab.Screen name="Atlas" component={AtlasStack} options={{ tabBarLabel: 'Atlas' }} />
      <Tab.Screen name="Apps" component={AppsStack} options={{ tabBarLabel: 'Apps' }} />
    </Tab.Navigator>
  );
}

// --------------------
// Tavvy Navigation Theme
// --------------------
const TavvyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkTheme.primary,
    background: darkTheme.background,
    card: darkTheme.surface,
    text: darkTheme.text,
    border: darkTheme.border,
    notification: darkTheme.brandOrange,
  },
};

const TavvyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: '#FFFFFF',
    card: '#F8FAFC',
    text: '#0F172A',
    border: '#E2E8F0',
    notification: Colors.secondary,
  },
};

// --------------------
// App Content (with theme access)
// --------------------
function AppContent() {
  const { isDark } = useThemeContext();
  
  // Preload signal caches on app start for faster signal lookups
  useEffect(() => {
    const initializeSignalSystem = async () => {
      try {
        // Preload both caches in parallel
        await Promise.all([
          preloadSignalLabels(),
          preloadSignalCache(),
        ]);
        console.log('✅ Signal system initialized');
      } catch (error) {
        console.error('Error initializing signal system:', error);
      }
    };

    initializeSignalSystem();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={isDark ? TavvyDarkTheme : TavvyLightTheme}>
        <TabNavigator />
      </NavigationContainer>
    </>
  );
}

// --------------------
// App Root
// --------------------
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: darkTheme.background }}>
      <ErrorBoundary>
        <NetworkProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider>
                <UnreadMessagesProvider>
                  {showSplash ? (
                    <AnimatedSplash onAnimationComplete={handleSplashComplete} />
                  ) : (
                    <AppContent />
                  )}
                </UnreadMessagesProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </NetworkProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
