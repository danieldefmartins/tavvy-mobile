import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './contexts/AuthContext';
import { Colors } from './Constants/Colors';

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

// ✅ Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
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

// --------------------
// Home Stack
// --------------------
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
      <HomeStackNav.Screen name="AddReview" component={AddReviewScreen} />
      <HomeStackNav.Screen name="AddPhoto" component={AddPhotoScreen} />
      <HomeStackNav.Screen name="PlacePhotos" component={PlacePhotosScreen} />
      <HomeStackNav.Screen name="RequestUniverse" component={RequestUniverseScreen} />
      <HomeStackNav.Screen name="CityDetails" component={CityDetailsScreen} />
      <HomeStackNav.Screen name="RateCity" component={RateCityScreen} />
      <HomeStackNav.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
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
            case 'Add':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
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
      <Tab.Screen name="Explore" component={UniverseStack} options={{ tabBarLabel: 'Explore' }} />

      <Tab.Screen
        name="Add"
        component={UniversalAddScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarStyle: { display: 'none' }, // hide tab bar while in Add flow
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