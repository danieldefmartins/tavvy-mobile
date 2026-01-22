// =============================================
// STORY RING COMPONENT
// =============================================
// Displays a gradient ring around place avatars
// when they have active stories

import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export type StoryRingState = 'none' | 'unseen' | 'seen';

interface StoryRingProps {
  imageUrl?: string;
  placeName?: string;
  size?: number;
  state: StoryRingState;
  onPress?: () => void;
  showLabel?: boolean;
  categoryIcon?: string;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  imageUrl,
  placeName,
  size = 64,
  state,
  onPress,
  showLabel = false,
  categoryIcon,
}) => {
  const ringWidth = 3;
  const innerSize = size - ringWidth * 2 - 4; // Account for ring and gap
  
  // Gradient colors for unseen stories (purple to orange like Instagram)
  const unseenGradient = ['#833AB4', '#FD1D1D', '#F77737'];
  // Gray for seen stories
  const seenGradient = ['#C4C4C4', '#A0A0A0', '#C4C4C4'];
  
  const renderAvatar = () => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.avatar, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}
        />
      );
    }
    
    // Fallback to category icon or placeholder
    return (
      <View style={[styles.placeholder, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
        {categoryIcon ? (
          <Text style={[styles.categoryIcon, { fontSize: innerSize * 0.4 }]}>{categoryIcon}</Text>
        ) : (
          <Ionicons name="business" size={innerSize * 0.4} color="#666" />
        )}
      </View>
    );
  };
  
  const content = (
    <View style={[styles.container, { width: size, height: size }]}>
      {state !== 'none' ? (
        <LinearGradient
          colors={state === 'unseen' ? unseenGradient : seenGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View style={[styles.innerContainer, { 
            width: size - ringWidth * 2, 
            height: size - ringWidth * 2, 
            borderRadius: (size - ringWidth * 2) / 2 
          }]}>
            {renderAvatar()}
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.noRing, { width: size, height: size, borderRadius: size / 2 }]}>
          {renderAvatar()}
        </View>
      )}
      
      {/* Story indicator dot for unseen */}
      {state === 'unseen' && (
        <View style={styles.indicatorDot} />
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.wrapper}>
          {content}
          {showLabel && placeName && (
            <Text style={styles.label} numberOfLines={1}>
              {placeName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.wrapper}>
      {content}
      {showLabel && placeName && (
        <Text style={styles.label} numberOfLines={1}>
          {placeName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 80,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  innerContainer: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  noRing: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    backgroundColor: '#e0e0e0',
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    textAlign: 'center',
  },
  indicatorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    width: 70,
  },
});

export default StoryRing;
