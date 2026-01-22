// =============================================
// STORY VIEWER COMPONENT
// =============================================
// Full-screen story viewer with progress bars,
// navigation, and auto-advance

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { PlaceStory, markStoryViewed } from '../lib/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds for images
const VIDEO_MAX_DURATION = 15000; // 15 seconds max for videos

interface StoryViewerProps {
  visible: boolean;
  stories: PlaceStory[];
  initialIndex?: number;
  placeName?: string;
  placeImage?: string;
  currentUserId?: string;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  stories,
  initialIndex = 0,
  placeName,
  placeImage,
  currentUserId,
  onClose,
  onStoryViewed,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const videoRef = useRef<Video>(null);

  const currentStory = stories[currentIndex];

  // Reset to initial index when stories change
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, stories]);

  // Mark story as viewed
  useEffect(() => {
    if (visible && currentStory && currentUserId) {
      markStoryViewed(currentStory.id, currentUserId);
      onStoryViewed?.(currentStory.id);
    }
  }, [visible, currentStory?.id, currentUserId]);

  // Start progress animation
  const startProgress = useCallback((duration: number) => {
    progressAnim.setValue(0);
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    progressAnimation.current.start(({ finished }) => {
      if (finished) {
        goToNext();
      }
    });
  }, [currentIndex, stories.length]);

  // Pause/resume progress
  useEffect(() => {
    if (isPaused) {
      progressAnimation.current?.stop();
    } else if (!isLoading) {
      // Resume from current position
      const currentValue = (progressAnim as any)._value || 0;
      const remainingDuration = (1 - currentValue) * (currentStory?.media_type === 'video' ? VIDEO_MAX_DURATION : STORY_DURATION);
      
      progressAnimation.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      progressAnimation.current.start(({ finished }) => {
        if (finished) {
          goToNext();
        }
      });
    }
  }, [isPaused, isLoading]);

  // Handle content loaded
  const handleContentLoaded = () => {
    setIsLoading(false);
    const duration = currentStory?.media_type === 'video' ? VIDEO_MAX_DURATION : STORY_DURATION;
    startProgress(duration);
  };

  // Navigation
  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoading(true);
      progressAnim.setValue(0);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoading(true);
      progressAnim.setValue(0);
    } else {
      // Restart current story
      setIsLoading(true);
      progressAnim.setValue(0);
    }
  };

  // Touch handlers
  const handlePressIn = () => setIsPaused(true);
  const handlePressOut = () => setIsPaused(false);

  const handleTap = (event: any) => {
    const tapX = event.nativeEvent.locationX;
    if (tapX < SCREEN_WIDTH / 3) {
      goToPrevious();
    } else if (tapX > (SCREEN_WIDTH * 2) / 3) {
      goToNext();
    }
    // Middle tap does nothing (just pause/resume)
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Progress bars */}
        <SafeAreaView style={styles.progressContainer}>
          <View style={styles.progressBars}>
            {stories.map((_, index) => (
              <View key={index} style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: index < currentIndex
                        ? '100%'
                        : index === currentIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </SafeAreaView>

        {/* Header */}
        <SafeAreaView style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {placeImage ? (
                <Image source={{ uri: placeImage }} style={styles.placeAvatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Ionicons name="business" size={20} color="#fff" />
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {placeName || 'Place'}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(currentStory.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Story content */}
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleTap}
        >
          <View style={styles.contentContainer}>
            {currentStory.media_type === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: currentStory.media_url }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={!isPaused}
                isLooping={false}
                onLoad={handleContentLoaded}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    goToNext();
                  }
                }}
              />
            ) : (
              <Image
                source={{ uri: currentStory.media_url }}
                style={styles.media}
                resizeMode="cover"
                onLoad={handleContentLoaded}
              />
            )}

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Caption */}
        {currentStory.caption && (
          <View style={styles.captionContainer}>
            <BlurView intensity={50} style={styles.captionBlur}>
              <Text style={styles.caption}>{currentStory.caption}</Text>
            </BlurView>
          </View>
        )}

        {/* Tags */}
        {currentStory.tags && currentStory.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {currentStory.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 8,
  },
  progressBars: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  placeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  captionBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  tagsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StoryViewer;
