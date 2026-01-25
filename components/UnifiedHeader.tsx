import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screen color configurations
export const SCREEN_COLORS = {
  universes: { start: '#0EA5E9', end: '#14B8A6' },
  happeningNow: { start: '#F43F5E', end: '#FB7185' },
  realtors: { start: '#1E3A5F', end: '#2D4A6F' },
  pros: { start: '#059669', end: '#10B981' },
  atlas: { start: '#7C3AED', end: '#8B5CF6' },
  cities: { start: '#EA580C', end: '#F97316' },
  wallet: { start: '#475569', end: '#64748B' },
  rvCamping: { start: '#166534', end: '#15803D' },
  rides: { start: '#D946EF', end: '#F472B6' },
} as const;

export type ScreenColorKey = keyof typeof SCREEN_COLORS;

interface UnifiedHeaderProps {
  screenKey: ScreenColorKey;
  title: string;
  searchPlaceholder: string;
  onSearch?: (text: string) => void;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  showSearch?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  screenKey,
  title,
  searchPlaceholder,
  onSearch,
  onProfilePress,
  showBackButton = true,
  showSearch = true,
  rightIcon,
  onRightIconPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = SCREEN_COLORS[screenKey];

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // Default navigation to profile
      (navigation as any).navigate('ProfileMain');
    }
  };

  const handleRightIconPress = () => {
    if (onRightIconPress) {
      onRightIconPress();
    } else {
      handleProfilePress();
    }
  };

  return (
    <LinearGradient
      colors={[colors.start, colors.end]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Row 1: Navigation */}
      <View style={styles.navRow}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleRightIconPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={(rightIcon || 'person-circle-outline') as any} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Row 2: Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              onChangeText={onSearch}
            />
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#1F2937',
  },
});

export default UnifiedHeader;
