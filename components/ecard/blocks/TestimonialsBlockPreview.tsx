/**
 * Testimonials Block Preview Component
 * Displays customer testimonials in a carousel/swipeable format
 * 
 * Features:
 * - Horizontal carousel with testimonial cards
 * - Star ratings display
 * - Customer photos
 * - Source badges (Google, Yelp, Tavvy)
 * - Smooth animations
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Testimonial {
  id: string;
  customerName: string;
  reviewText: string;
  rating: number;
  customerPhoto?: string;
  date?: string;
  source?: string;
}

interface TestimonialsBlockPreviewProps {
  testimonials: Testimonial[];
  title?: string;
  accentColor?: string;
  textColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 80;
const CARD_MARGIN = 8;

const TestimonialsBlockPreview: React.FC<TestimonialsBlockPreviewProps> = ({
  testimonials,
  title,
  accentColor = '#667eea',
  textColor = 'white',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));
    setActiveIndex(index);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= rating ? '#FFD700' : 'rgba(255,255,255,0.4)'}
          />
        ))}
      </View>
    );
  };

  const getSourceIcon = (source?: string) => {
    switch (source?.toLowerCase()) {
      case 'google':
        return { icon: 'logo-google', color: '#4285F4' };
      case 'yelp':
        return { icon: 'star', color: '#FF1A1A' };
      case 'facebook':
        return { icon: 'logo-facebook', color: '#1877F2' };
      case 'tavvy':
        return { icon: 'ribbon', color: '#667eea' };
      default:
        return { icon: 'chatbubble', color: '#999' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      {title && (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}

      {/* Quote Icon */}
      <View style={styles.quoteIconContainer}>
        <Ionicons name="chatbubble-ellipses" size={24} color="rgba(255,255,255,0.3)" />
      </View>

      {/* Testimonials Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.carouselContainer}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="center"
      >
        {testimonials.map((testimonial, index) => {
          const sourceInfo = getSourceIcon(testimonial.source);
          
          return (
            <View key={testimonial.id || index} style={styles.testimonialCard}>
              {/* Customer Info */}
              <View style={styles.customerHeader}>
                {testimonial.customerPhoto ? (
                  <Image
                    source={{ uri: testimonial.customerPhoto }}
                    style={styles.customerPhoto}
                  />
                ) : (
                  <View style={styles.customerPhotoPlaceholder}>
                    <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{testimonial.customerName}</Text>
                  {renderStars(testimonial.rating)}
                </View>
                {/* Source Badge */}
                {testimonial.source && (
                  <View style={[styles.sourceBadge, { backgroundColor: sourceInfo.color }]}>
                    <Ionicons name={sourceInfo.icon as any} size={12} color="white" />
                  </View>
                )}
              </View>

              {/* Review Text */}
              <Text style={styles.reviewText} numberOfLines={4}>
                "{testimonial.reviewText}"
              </Text>

              {/* Date */}
              {testimonial.date && (
                <Text style={styles.dateText}>{formatDate(testimonial.date)}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {testimonials.length > 1 && (
        <View style={styles.pagination}>
          {testimonials.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Count Badge */}
      <View style={styles.countBadge}>
        <Ionicons name="chatbubbles-outline" size={14} color="rgba(255,255,255,0.8)" />
        <Text style={styles.countText}>{testimonials.length} reviews</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  quoteIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },
  testimonialCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: CARD_MARGIN,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  customerPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  sourceBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  countText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});

export default TestimonialsBlockPreview;
