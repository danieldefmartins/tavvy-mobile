/**
 * YouTubeBlockPreview.tsx
 * Preview component for YouTube video block on eCard
 * Shows thumbnail with play button overlay
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface YouTubeBlockData {
  videoUrl: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  autoplay: boolean;
}

interface YouTubeBlockPreviewProps {
  data: YouTubeBlockData;
  accentColor?: string;
  textColor?: string;
  onPress?: () => void;
}

export default function YouTubeBlockPreview({
  data,
  accentColor = '#FF0000',
  textColor = '#FFFFFF',
  onPress,
}: YouTubeBlockPreviewProps) {
  if (!data.videoId) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Open YouTube video
      const url = data.videoUrl || `https://youtube.com/watch?v=${data.videoId}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      {data.title && (
        <Text style={[styles.title, { color: textColor }]}>{data.title}</Text>
      )}

      {/* Video Thumbnail */}
      <TouchableOpacity 
        style={styles.thumbnailContainer}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: data.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Play Button Overlay */}
        <View style={styles.playOverlay}>
          <View style={[styles.playButton, { backgroundColor: accentColor }]}>
            <Ionicons name="play" size={28} color="white" />
          </View>
        </View>

        {/* YouTube Badge */}
        <View style={styles.youtubeBadge}>
          <Ionicons name="logo-youtube" size={16} color="#FF0000" />
          <Text style={styles.youtubeText}>YouTube</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  youtubeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  youtubeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
