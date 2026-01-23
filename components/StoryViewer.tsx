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
  Alert,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { PlaceStory, markStoryViewed, reportStoryWithReason, StoryReport } from '../lib/storyService';

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
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
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => {
                  setIsPaused(true);
                  setShowOptionsMenu(true);
                }} 
                style={styles.optionsButton}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
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

        {/* Options Menu Modal */}
        <Modal
          visible={showOptionsMenu}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowOptionsMenu(false);
            setIsPaused(false);
          }}
        >
          <TouchableWithoutFeedback onPress={() => {
            setShowOptionsMenu(false);
            setIsPaused(false);
          }}>
            <View style={styles.optionsOverlay}>
              <View style={styles.optionsMenu}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowReportModal(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={24} color="#EF4444" />
                  <Text style={styles.optionTextDanger}>Report Story</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setIsPaused(false);
                  }}
                >
                  <Ionicons name="close-outline" size={24} color="#6B7280" />
                  <Text style={styles.optionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Report Modal */}
        <Modal
          visible={showReportModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowReportModal(false);
            setIsPaused(false);
          }}
        >
          <View style={styles.reportOverlay}>
            <View style={styles.reportModal}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Report Story</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowReportModal(false);
                    setIsPaused(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.reportSubtitle}>
                Why are you reporting this story?
              </Text>
              <ScrollView style={styles.reportOptions}>
                {[
                  { reason: 'sexual' as const, label: 'Sexual Content', icon: 'warning-outline' },
                  { reason: 'explicit' as const, label: 'Explicit/Graphic Content', icon: 'eye-off-outline' },
                  { reason: 'harassment' as const, label: 'Harassment or Bullying', icon: 'hand-left-outline' },
                  { reason: 'violent' as const, label: 'Violence or Threats', icon: 'alert-circle-outline' },
                  { reason: 'spam' as const, label: 'Spam or Misleading', icon: 'megaphone-outline' },
                  { reason: 'other' as const, label: 'Other', icon: 'ellipsis-horizontal-outline' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.reason}
                    style={styles.reportOption}
                    disabled={isReporting}
                    onPress={async () => {
                      if (!currentUserId) {
                        Alert.alert('Login Required', 'Please log in to report stories.');
                        return;
                      }
                      setIsReporting(true);
                      try {
                        const result = await reportStoryWithReason(
                          currentStory.id,
                          currentUserId,
                          item.reason
                        );
                        if (result.success) {
                          Alert.alert(
                            'Report Submitted',
                            'Thank you for your report. Our team will review this story.',
                            [{ text: 'OK', onPress: () => {
                              setShowReportModal(false);
                              setIsPaused(false);
                              goToNext();
                            }}]
                          );
                        } else {
                          Alert.alert('Error', result.error || 'Failed to submit report');
                        }
                      } catch (error) {
                        Alert.alert('Error', 'Failed to submit report. Please try again.');
                      } finally {
                        setIsReporting(false);
                      }
                    }}
                  >
                    <Ionicons name={item.icon as any} size={24} color="#374151" />
                    <Text style={styles.reportOptionText}>{item.label}</Text>
                    {isReporting && <ActivityIndicator size="small" color="#3B82F6" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.reportDisclaimer}>
                Reports are reviewed by the business owner. False reports may result in account restrictions.
              </Text>
            </View>
          </View>
        </Modal>
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
  // Header right section
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionsButton: {
    padding: 8,
  },
  // Options menu styles
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 300,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextDanger: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  // Report modal styles
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  reportOptions: {
    maxHeight: 300,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportOptionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  reportDisclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
});

export default StoryViewer;
