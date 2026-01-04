import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
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
const Stack = createStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PlaceDetails" 
        component={PlaceDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddReview" 
        component={AddReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddPhoto" 
        component={AddPhotoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PlacePhotos" 
        component={PlacePhotosScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RequestUniverse" 
        component={RequestUniverseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CityDetails" 
        component={CityDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RateCity" 
        component={RateCityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ClaimBusiness" 
        component={ClaimBusinessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Atlas Stack Navigator
function AtlasStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AtlasMain" 
        component={AtlasHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ArticleDetail" 
        component={ArticleDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UniverseDetail" 
        component={UniverseDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CategoryBrowse" 
        component={CategoryBrowseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AtlasSearch" 
        component={AtlasSearchScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Menu Stack Navigator
function MenuStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MenuMain" 
        component={MenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SavedMain" 
        component={SavedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Universe Stack Navigator
function UniverseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UniverseDiscovery" 
        component={UniverseDiscoveryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UniverseLanding" 
        component={UniverseLandingScreen}
        options={{ headerShown: false }}
      />
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={UniverseStack} />
      <Tab.Screen 
        name="Add" 
        component={UniversalAddScreen}
        options={{ 
          title: 'Create',
          tabBarStyle: { display: 'none' } // Hide tab bar when in the Add flow
        }} 
      />
      <Tab.Screen 
        name="Atlas" 
        component={AtlasStack}
        options={{ title: 'Atlas' }}
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuStack}
        options={{ title: 'Menu' }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
