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
import ProsLeadsScreen from './screens/ProsLeadsScreen';

// NEW: Multi-Step Service Request Flow
import ProsRequestStep1Screen from './screens/ProsRequestStep1Screen';
import ProsRequestStep2Screen from './screens/ProsRequestStep2Screen';
import ProsRequestStep3Screen from './screens/ProsRequestStep3Screen';
import ProsRequestStep4Screen from './screens/ProsRequestStep4Screen';

// NEW: Category Landing & Project Status
import ProsCategoryLandingScreen from './screens/ProsCategoryLandingScreen';
import ProsProjectStatusScreen from './screens/ProsProjectStatusScreen';

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
// Menu Stack
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
// Pros Stack (UPDATED with new screens)
// --------------------
function ProsStack() {
  return (
    <ProsStackNav.Navigator screenOptions={{ headerShown: false }}>
      {/* Main Pros Screens */}
      <ProsStackNav.Screen name="ProsHomeScreen" component={ProsHomeScreen} />
      <ProsStackNav.Screen name="ProsBrowseScreen" component={ProsBrowseScreen} />
      <ProsStackNav.Screen name="ProsProfileScreen" component={ProsProfileScreen} />
      <ProsStackNav.Screen name="ProsDashboardScreen" component={ProsDashboardScreen} />
      <ProsStackNav.Screen name="ProsRegistrationScreen" component={ProsRegistrationScreen} />
      <ProsStackNav.Screen name="ProsMessagesScreen" component={ProsMessagesScreen} />
      <ProsStackNav.Screen name="ProsLeadsScreen" component={ProsLeadsScreen} />
      
      {/* NEW: Multi-Step Service Request Flow */}
      <ProsStackNav.Screen 
        name="ProsRequestStep1Screen" 
        component={ProsRequestStep1Screen}
        options={{ presentation: 'modal' }}
      />
      <ProsStackNav.Screen name="ProsRequestStep2Screen" component={ProsRequestStep2Screen} />
      <ProsStackNav.Screen name="ProsRequestStep3Screen" component={ProsRequestStep3Screen} />
      <ProsStackNav.Screen name="ProsRequestStep4Screen" component={ProsRequestStep4Screen} />
      
      {/* NEW: Category Landing & Project Status */}
      <ProsStackNav.Screen name="ProsCategoryLandingScreen" component={ProsCategoryLandingScreen} />
      <ProsStackNav.Screen name="ProsProjectStatusScreen" component={ProsProjectStatusScreen} />
    </ProsStackNav.Navigator>
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
            case 'Menu':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Explore" component={UniverseStack} options={{ tabBarLabel: 'Universes' }} />

      {/* Pros Tab */}
      <Tab.Screen
        name="Pros"
        component={ProsStack}
        options={{
          tabBarLabel: 'Pros',
        }}
      />

      <Tab.Screen name="Atlas" component={AtlasStack} options={{ tabBarLabel: 'Atlas' }} />
      <Tab.Screen name="Menu" component={MenuStack} options={{ tabBarLabel: 'Menu' }} />
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
