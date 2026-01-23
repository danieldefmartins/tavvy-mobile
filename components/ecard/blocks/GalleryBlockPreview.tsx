/**
 * Gallery Block Preview Component
 * Displays gallery images in a grid layout on the eCard
 * 
 * Features:
 * - Responsive grid layout (2-3 columns)
 * - Image lightbox on tap
 * - Optional captions
 * - Smooth animations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GalleryImage {
  id: string;
  uri: string;
  caption?: string;
}

interface GalleryBlockPreviewProps {
  images: GalleryImage[];
  title?: string;
  accentColor?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GalleryBlockPreview: React.FC<GalleryBlockPreviewProps> = ({
  images = [],
  title,
  accentColor = '#667eea',
}) => {
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxVisible(true);
  };

  const closeLightbox = () => {
    setLightboxVisible(false);
  };

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Determine grid layout based on image count
  const getGridStyle = () => {
    if (images.length === 1) {
      return { numColumns: 1, imageSize: SCREEN_WIDTH - 64 };
    } else if (images.length === 2) {
      return { numColumns: 2, imageSize: (SCREEN_WIDTH - 80) / 2 };
    } else {
      return { numColumns: 3, imageSize: (SCREEN_WIDTH - 88) / 3 };
    }
  };

  const { numColumns, imageSize } = getGridStyle();

  return (
    <View style={styles.container}>
      {/* Title */}
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Image Grid */}
      <View style={[styles.grid, { flexWrap: 'wrap' }]}>
        {images.slice(0, 9).map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={[
              styles.imageContainer,
              {
                width: imageSize,
                height: imageSize,
              },
            ]}
            onPress={() => openLightbox(index)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: image.uri }} style={styles.image} />
            
            {/* Show "+X more" on the last visible image if there are more */}
            {index === 8 && images.length > 9 && (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+{images.length - 9}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Image Count Badge */}
      <View style={[styles.countBadge, { backgroundColor: accentColor }]}>
        <Ionicons name="images" size={14} color="white" />
        <Text style={styles.countText}>{images.length} photos</Text>
      </View>

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        <StatusBar hidden />
        <View style={styles.lightboxContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeLightbox}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Main Image */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setSelectedIndex(newIndex);
            }}
            contentOffset={{ x: selectedIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((image, index) => (
              <View key={image.id} style={styles.lightboxImageContainer}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
                {image.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.captionText}>{image.caption}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={goToPrevious}
              >
                <Ionicons name="chevron-back" size={32} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToNext}
              >
                <Ionicons name="chevron-forward" size={32} color="white" />
              </TouchableOpacity>
            </>
          )}

          {/* Thumbnail Strip */}
          <ScrollView
            horizontal
            style={styles.thumbnailStrip}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.thumbnail,
                  selectedIndex === index && styles.thumbnailActive,
                ]}
                onPress={() => setSelectedIndex(index)}
              >
                <Image source={{ uri: image.uri }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    margin: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 10,
  },
  countText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // Lightbox styles
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  lightboxImageContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 10,
  },
  captionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  thumbnailContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: 'white',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default GalleryBlockPreview;
