// ============================================================================
// AUDIO PLAYER COMPONENT
// ============================================================================
// Plays article audio with play/pause, progress bar, and speed controls
// Uses expo-av for audio playback
// Pure JS implementation - no native slider dependency
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_DARK = '#0F766E';

interface AudioPlayerProps {
  articleId: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
  onGenerateAudio?: () => Promise<void>;
  isGenerating?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Pure JS Progress Bar Component
interface ProgressBarProps {
  progress: number; // 0 to 1
  onSeek: (progress: number) => void;
  trackColor?: string;
  progressColor?: string;
  thumbColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  onSeek,
  trackColor = TEAL_LIGHT,
  progressColor = TEAL_PRIMARY,
  thumbColor = TEAL_PRIMARY,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(progress);

  const displayProgress = isSeeking ? seekProgress : progress;

  const handlePress = (event: GestureResponderEvent) => {
    if (trackWidth > 0) {
      const locationX = event.nativeEvent.locationX;
      const newProgress = Math.max(0, Math.min(1, locationX / trackWidth));
      onSeek(newProgress);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setIsSeeking(true);
        if (trackWidth > 0) {
          const locationX = event.nativeEvent.locationX;
          const newProgress = Math.max(0, Math.min(1, locationX / trackWidth));
          setSeekProgress(newProgress);
        }
      },
      onPanResponderMove: (event, gestureState) => {
        if (trackWidth > 0) {
          const startX = event.nativeEvent.locationX - gestureState.dx;
          const currentX = startX + gestureState.dx;
          const newProgress = Math.max(0, Math.min(1, currentX / trackWidth));
          setSeekProgress(newProgress);
        }
      },
      onPanResponderRelease: () => {
        setIsSeeking(false);
        onSeek(seekProgress);
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    })
  ).current;

  return (
    <View
      style={styles.progressBarContainer}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* Track Background */}
      <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
        {/* Progress Fill */}
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: progressColor,
              width: `${displayProgress * 100}%`,
            },
          ]}
        />
      </View>
      {/* Thumb */}
      <View
        style={[
          styles.progressThumb,
          {
            backgroundColor: thumbColor,
            left: `${displayProgress * 100}%`,
            marginLeft: -8,
          },
        ]}
      />
    </View>
  );
};

export default function AudioPlayer({
  articleId,
  audioUrl,
  audioDuration,
  onGenerateAudio,
  isGenerating = false,
  backgroundColor = '#F0FDFA',
  textColor = '#0F766E',
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(audioDuration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation for expand/collapse
  const expandAnimation = useState(new Animated.Value(0))[0];

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Toggle expand animation
  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const loadAndPlayAudio = useCallback(async () => {
    if (!audioUrl) return;

    try {
      setIsLoading(true);

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: playbackSpeed },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl, playbackSpeed]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis / 1000);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : audioDuration || 0);
    setIsPlaying(status.isPlaying);

    // Handle playback finished
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const togglePlayPause = async () => {
    if (!audioUrl) {
      // Generate audio if not available
      if (onGenerateAudio) {
        await onGenerateAudio();
      }
      return;
    }

    if (!sound) {
      await loadAndPlayAudio();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleSeek = async (progressPercent: number) => {
    if (sound && duration > 0) {
      const newPosition = progressPercent * duration;
      await sound.setPositionAsync(newPosition * 1000);
    }
  };

  const handleSpeedChange = async () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    setPlaybackSpeed(newSpeed);

    if (sound) {
      await sound.setRateAsync(newSpeed, true);
    }
  };

  const skipForward = async () => {
    if (sound) {
      const newPosition = Math.min(position + 15, duration);
      await sound.setPositionAsync(newPosition * 1000);
    }
  };

  const skipBackward = async () => {
    if (sound) {
      const newPosition = Math.max(position - 15, 0);
      await sound.setPositionAsync(newPosition * 1000);
    }
  };

  // Render generate audio button if no audio available
  if (!audioUrl) {
    return (
      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor }]}
        onPress={onGenerateAudio}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator size="small" color={TEAL_PRIMARY} />
            <Text style={[styles.generateText, { color: textColor }]}>
              Generating audio...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="headset-outline" size={20} color={TEAL_PRIMARY} />
            <Text style={[styles.generateText, { color: textColor }]}>
              Listen to this article
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  const expandedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 130],
  });

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Animated.View style={[styles.container, { backgroundColor, height: expandedHeight }]}>
      {/* Main Controls Row */}
      <View style={styles.mainRow}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: textColor }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.timeText, { color: textColor }]}>
              {formatTime(duration)}
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            onSeek={handleSeek}
            trackColor={TEAL_LIGHT}
            progressColor={TEAL_PRIMARY}
            thumbColor={TEAL_PRIMARY}
          />
        </View>

        {/* Expand Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={textColor}
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Controls */}
      {isExpanded && (
        <View style={styles.expandedRow}>
          {/* Skip Backward */}
          <TouchableOpacity style={styles.skipButton} onPress={skipBackward}>
            <Ionicons name="play-back" size={20} color={textColor} />
            <Text style={[styles.skipText, { color: textColor }]}>15s</Text>
          </TouchableOpacity>

          {/* Speed Control */}
          <TouchableOpacity style={styles.speedButton} onPress={handleSpeedChange}>
            <Text style={[styles.speedText, { color: textColor }]}>
              {playbackSpeed}x
            </Text>
          </TouchableOpacity>

          {/* Skip Forward */}
          <TouchableOpacity style={styles.skipButton} onPress={skipForward}>
            <Text style={[styles.skipText, { color: textColor }]}>15s</Text>
            <Ionicons name="play-forward" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: TEAL_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressSection: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Progress Bar Styles
  progressBarContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  expandButton: {
    padding: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  generateText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
