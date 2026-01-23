/**
 * YouTubeBlockEditor.tsx
 * Editor component for YouTube video block
 * Allows users to add YouTube videos to their eCard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
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

interface YouTubeBlockEditorProps {
  data: YouTubeBlockData;
  onChange: (data: YouTubeBlockData) => void;
  accentColor?: string;
}

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Get thumbnail URL from video ID
const getThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export default function YouTubeBlockEditor({ 
  data, 
  onChange, 
  accentColor = '#FF0000' 
}: YouTubeBlockEditorProps) {
  const [inputUrl, setInputUrl] = useState(data.videoUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-extract video ID when URL changes
  useEffect(() => {
    if (inputUrl) {
      const videoId = extractYouTubeId(inputUrl);
      if (videoId && videoId !== data.videoId) {
        setIsLoading(true);
        setError(null);
        
        // Update data with extracted video ID
        const thumbnailUrl = getThumbnailUrl(videoId);
        onChange({
          ...data,
          videoUrl: inputUrl,
          videoId,
          thumbnailUrl,
        });
        
        setIsLoading(false);
      } else if (!videoId && inputUrl.length > 5) {
        setError('Invalid YouTube URL');
      }
    }
  }, [inputUrl]);

  const handlePasteFromClipboard = async () => {
    try {
      // Note: Clipboard API requires expo-clipboard
      Alert.alert('Tip', 'Paste your YouTube link in the input field above');
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const handleOpenYouTube = () => {
    Linking.openURL('https://youtube.com');
  };

  const handleClearVideo = () => {
    setInputUrl('');
    setError(null);
    onChange({
      videoUrl: '',
      videoId: '',
      title: '',
      thumbnailUrl: '',
      autoplay: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name="logo-youtube" size={24} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>YouTube Video</Text>
          <Text style={styles.subtitle}>Add a video to your card</Text>
        </View>
      </View>

      {/* URL Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Video URL</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="link-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Paste YouTube link here..."
            placeholderTextColor="#999"
            value={inputUrl}
            onChangeText={setInputUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {inputUrl ? (
            <TouchableOpacity onPress={handleClearVideo} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Text style={styles.helpText}>
          Supports: youtube.com/watch?v=..., youtu.be/..., shorts
        </Text>
      </View>

      {/* Video Preview */}
      {data.videoId ? (
        <View style={styles.previewContainer}>
          <Text style={styles.label}>Preview</Text>
          <View style={styles.thumbnailContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={accentColor} />
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: data.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.playOverlay}>
                  <View style={[styles.playButton, { backgroundColor: accentColor }]}>
                    <Ionicons name="play" size={32} color="white" />
                  </View>
                </View>
              </>
            )}
          </View>
          <Text style={styles.videoIdText}>Video ID: {data.videoId}</Text>
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <Ionicons name="videocam-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No video added yet</Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: accentColor }]}
            onPress={handleOpenYouTube}
          >
            <Ionicons name="logo-youtube" size={18} color="white" />
            <Text style={styles.browseButtonText}>Browse YouTube</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Title Input (Optional) */}
      {data.videoId && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title (Optional)</Text>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Add a custom title..."
            placeholderTextColor="#999"
            value={data.title}
            onChangeText={(text) => onChange({ ...data, title: text })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  titleInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  previewContainer: {
    marginBottom: 20,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIdText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
