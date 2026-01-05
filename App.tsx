import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './contexts/AuthContext';
import { Colors } from './constants/Colors';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import UniverseDiscoveryScreen from './screens/UniverseDiscoveryScreen';
import UniverseLandingScreen from './screens/UniverseLandingScreen';
import AddPlaceScreen from './screens/AddPlaceScreen';
import RequestUniverseScreen from './screens/RequestUniverseScreen';
import CityDetailsScreen from './screens/CityDetailsScreen';
import RateCityScreen from './screens/RateCityScreen';
import UniversalAddScreen from './screens/UniversalAddScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlaceDetailsScreen from './screens/PlaceDetailsScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import MenuScreen from './screens/MenuScreen';

// Additional screens
import AddReviewScreen from './screens/AddReviewScreen';
import AddPhotoScreen from './screens/AddPhotoScreen';
import PlacePhotosScreen from './screens/PlacePhotosScreen';
import ClaimBusinessScreen from './screens/ClaimBusinessScreen';

// Atlas screens
import AtlasHomeScreen from './screens/AtlasHomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import UniverseDetailScreen from './screens/UniverseDetailScreen';
import CategoryBrowseScreen from './screens/CategoryBrowseScreen';
import AtlasSearchScreen from './screens/AtlasSearchScreen';

// Create QueryClient instance
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
const Stack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
      <Stack.Screen name="AddReview" component={AddReviewScreen} />
      <Stack.Screen name="AddPhoto" component={AddPhotoScreen} />
      <Stack.Screen name="PlacePhotos" component={PlacePhotosScreen} />
      <Stack.Screen name="RequestUniverse" component={RequestUniverseScreen} />
      <Stack.Screen name="CityDetails" component={CityDetailsScreen} />
      <Stack.Screen name="RateCity" component={RateCityScreen} />
      <Stack.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
    </Stack.Navigator>
  );
}

// Atlas Stack Navigator
function AtlasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AtlasMain" component={AtlasHomeScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="UniverseDetail" component={UniverseDetailScreen} />
      <Stack.Screen name="CategoryBrowse" component={CategoryBrowseScreen} />
      <Stack.Screen name="AtlasSearch" component={AtlasSearchScreen} />
    </Stack.Navigator>
  );
}

// Menu Stack Navigator
function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuMain" component={MenuScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="SavedMain" component={SavedScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RateCity" component={RateCityScreen} />
      <Stack.Screen name="ClaimBusiness" component={ClaimBusinessScreen} />
    </Stack.Navigator>
  );
}

// Universe Stack Navigator
function UniverseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UniverseDiscovery" component={UniverseDiscoveryScreen} />
      <Stack.Screen name="UniverseLanding" component={UniverseLandingScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'planet' : 'planet-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Atlas') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Explore" component={UniverseStack} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen
        name="Add"
        component={UniversalAddScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarStyle: { display: 'none' }, // Hide tab bar when in the Add flow
        }}
      />
      <Tab.Screen name="Atlas" component={AtlasStack} options={{ tabBarLabel: 'Atlas' }} />
      <Tab.Screen name="Menu" component={MenuStack} options={{ tabBarLabel: 'Menu' }} />
    </Tab.Navigator>
  );
}

// Main App Component
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