import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './contexts/AuthContext';
import { Colors } from './constants/Colors';

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
import AddPlaceScreen from './screens/AddPlaceScreen';
import BusinessCardScannerScreen from './screens/BusinessCardScannerScreen';

import AtlasHomeScreen from './screens/AtlasHomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import UniverseDetailScreen from './screens/UniverseDetailScreen';
import CategoryBrowseScreen from './screens/CategoryBrowseScreen';
import AtlasSearchScreen from './screens/AtlasSearchScreen';

import MenuScreen from './screens/MenuScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedScreen from './screens/SavedScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';

// ========== PROS SCREENS ==========
import ProsHomeScreen from './screens/ProsHomeScreen';
import ProsBrowseScreen from './screens/ProsBrowseScreen';
import ProsProfileScreen from './screens/ProsProfileScreen';
import ProsDashboardScreen from './screens/ProsDashboardScreen';
import ProsRegistrationScreen from './screens/ProsRegistrationScreen';
import ProsMessagesScreen from './screens/ProsMessagesScreen';
import ProsRequestQuoteScreen from './screens/ProsRequestQuoteScreen';
import ProsLeadsScreen from './screens/ProsLeadsScreen';

// ========== APPS SCREENS (NEW) ==========
import AppsHomeScreen from './screens/AppsHomeScreen';
import QuickFindsScreen from './screens/QuickFindsScreen';
import QuickFindsResultsScreen from './screens/QuickFindsResultsScreen';
import ExperiencePathsScreen from './screens/ExperiencePathsScreen';
import ExperiencePathDetailScreen from './screens/ExperiencePathDetailScreen';
import HappeningNowScreen from './screens/HappeningNowScreen';
import HappeningNowDetailScreen from './screens/HappeningNowDetailScreen';

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
const ProsStackNav = createNativeStackNavigator();
const AppsStackNav = createNativeStackNavigator(); // NEW: Apps Stack

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
      {/* Business Card Scanner - accessible from AddPlaceScreen */}
      <HomeStackNav.Screen 
        name="BusinessCardScanner" 
        component={BusinessCardScannerScreen}
        options={{ presentation: 'modal' }}
      />
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
      <AtlasStackNav.Screen name="UniverseDetail" component={UniverseDetailScreen} />
      <AtlasStackNav.Screen name="CategoryBrowse" component={CategoryBrowseScreen} />
      <AtlasStackNav.Screen name="AtlasSearch" component={AtlasSearchScreen} />
    </AtlasStackNav.Navigator>
  );
}

// --------------------
// Menu Stack (now contains My Account / Login)
// --------------------
function MenuStack() {
  return (
    <MenuStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MenuStackNav.Screen name="MenuMain" component={MenuScreen} />
      <MenuStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <MenuStackNav.Screen name="SavedMain" component={SavedScreen} />

      {/* Auth */}
      <MenuStackNav.Screen name="Login" component={LoginScreen} />
      <MenuStackNav.Screen name="SignUp" component={SignUpScreen} />

      {/* Shared screens accessible from menu */}
      <MenuStackNav.Screen name="RateCity" component={RateCityScreen} />
      <MenuStackNav.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
      
      {/* Create functionality moved to Menu */}
      <MenuStackNav.Screen name="UniversalAdd" component={UniversalAddScreen} />
      <MenuStackNav.Screen name="AddPlace" component={AddPlaceScreen} />
      
      {/* Business Card Scanner - accessible from AddPlaceScreen */}
      <MenuStackNav.Screen 
        name="BusinessCardScanner" 
        component={BusinessCardScannerScreen}
        options={{ presentation: 'modal' }}
      />
      
      {/* Pro Dashboard accessible from Menu */}
      <MenuStackNav.Screen name="ProsDashboard" component={ProsDashboardScreen} />
      <MenuStackNav.Screen name="ProsLeads" component={ProsLeadsScreen} />
      <MenuStackNav.Screen name="ProsMessages" component={ProsMessagesScreen} />
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
    </UniverseStackNav.Navigator>
  );
}

// --------------------
// Pros Stack
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
    </ProsStackNav.Navigator>
  );
}

// --------------------
// Apps Stack (NEW)
// --------------------
function AppsStack() {
  return (
    <AppsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppsStackNav.Screen name="AppsHome" component={AppsHomeScreen} />
      
      {/* Quick Finds */}
      <AppsStackNav.Screen name="QuickFinds" component={QuickFindsScreen} />
      <AppsStackNav.Screen name="QuickFindsResults" component={QuickFindsResultsScreen} />
      
      {/* Experience Paths */}
      <AppsStackNav.Screen name="ExperiencePaths" component={ExperiencePathsScreen} />
      <AppsStackNav.Screen name="ExperiencePathDetail" component={ExperiencePathDetailScreen} />
      
      {/* Happening Now */}
      <AppsStackNav.Screen name="HappeningNow" component={HappeningNowScreen} />
      <AppsStackNav.Screen name="HappeningNowDetail" component={HappeningNowDetailScreen} />
    </AppsStackNav.Navigator>
  );
}

// --------------------
// Tabs
// --------------------
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
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
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Explore" component={UniverseStack} options={{ tabBarLabel: 'Universes' }} />
      <Tab.Screen
        name="Pros"
        component={ProsStack}
        options={{
          tabBarLabel: 'Pros',
        }}
      />
      <Tab.Screen name="Atlas" component={AtlasStack} options={{ tabBarLabel: 'Atlas' }} />
      {/* CHANGED: Replaced Menu tab with Apps tab */}
      <Tab.Screen name="Apps" component={AppsStack} options={{ tabBarLabel: 'Apps' }} />
    </Tab.Navigator>
  );
}

// --------------------
// App Root
// --------------------
export default function App() {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
