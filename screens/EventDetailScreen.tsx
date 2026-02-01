/**
 * Event Detail Screen
 * Beautiful in-app event details matching black design system
 * Shows Ticketmaster, PredictHQ, and Tavvy events with full information
 * Includes Tavvy review system with signal taps
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { TavvyEvent } from '../lib/eventsService';
import { fetchEventSignals, SignalAggregate, getEventReviewCount } from '../lib/eventReviews';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';

type RouteParams = {
  EventDetail: {
    event: TavvyEvent;
  };
};

export default function EventDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventDetail'>>();
  const { event } = route.params;

  const [signals, setSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
  }>({ best_for: [], vibe: [], heads_up: [] });
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    loadEventReviews();
  }, [event.id]);

  const loadEventReviews = async () => {
    try {
      setLoadingReviews(true);
      const [signalData, count] = await Promise.all([
        fetchEventSignals(event.id),
        getEventReviewCount(event.id),
      ]);
      setSignals(signalData);
      setReviewCount(count);
    } catch (error) {
      console.error('Error loading event reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBuyTickets = async () => {
    if (event.url) {
      try {
        const canOpen = await Linking.canOpenURL(event.url);
        if (canOpen) {
          await Linking.openURL(event.url);
        } else {
          Alert.alert('Cannot Open', 'Unable to open ticket purchase link.');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open ticket link.');
      }
    } else {
      Alert.alert('No Link', 'Ticket purchase link not available.');
    }
  };

  const handleAddReview = () => {
    // @ts-ignore - Navigation types
    navigation.navigate('AddReview', {
      eventId: event.id,
      eventName: event.title,
      isEvent: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = () => {
    if (event.price_min === 0 && !event.price_max) {
      return 'Free';
    }
    if (event.price_min && event.price_max) {
      return `${event.currency || '$'}${event.price_min} - ${event.currency || '$'}${event.price_max}`;
    }
    if (event.price_min) {
      return `From ${event.currency || '$'}${event.price_min}`;
    }
    return 'See Details';
  };

  const getSourceBadge = () => {
    switch (event.source) {
      case 'ticketmaster':
        return { label: 'TM', color: '#00A1E0' };
      case 'predicthq':
        return { label: 'PHQ', color: '#FF6B6B' };
      case 'tavvy':
        return { label: 'Tavvy', color: '#667EEA' };
      default:
        return { label: 'Event', color: '#667EEA' };
    }
  };

  const renderSignalBar = (item: SignalAggregate, color: string) => {
    const widthPercent = Math.min((item.current_score / 10) * 100, 100);
    
    return (
      <View key={item.signal_id} style={styles.signalBarContainer}>
        <View style={styles.signalBarHeader}>
          <Text style={styles.signalEmoji}>{item.icon}</Text>
          <Text style={styles.signalLabel}>{item.label}</Text>
          <Text style={styles.signalCount}>{item.tap_total}</Text>
        </View>
        <View style={styles.signalBarTrack}>
          <View 
            style={[
              styles.signalBarFill, 
              { width: `${widthPercent}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderSignalSection = (
    title: string,
    signalsList: SignalAggregate[],
    color: string,
    icon: string
  ) => {
    if (!signalsList || signalsList.length === 0) return null;

    return (
      <View style={styles.signalSection}>
        <View style={styles.signalSectionHeader}>
          <View style={[styles.signalSectionIcon, { backgroundColor: color }]}>
            <Ionicons name={icon as any} size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.signalSectionTitle}>{title}</Text>
          <View style={[styles.signalSectionBadge, { backgroundColor: color }]}>
            <Text style={styles.signalSectionBadgeText}>{signalsList.length}</Text>
          </View>
        </View>
        {signalsList.map(signal => renderSignalBar(signal, color))}
      </View>
    );
  };

  const sourceBadge = getSourceBadge();
  const hasReviews = signals.best_for.length > 0 || signals.vibe.length > 0 || signals.heads_up.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: event.image_url || DEFAULT_EVENT_IMAGE }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Source Badge */}
          <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.color }]}>
            <Text style={styles.sourceBadgeText}>{sourceBadge.label}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#667EEA" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(event.start_time)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#667EEA" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(event.start_time)}</Text>
            </View>
          </View>

          {/* Venue */}
          {event.venue_name && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#667EEA" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{event.venue_name}</Text>
                {event.address && (
                  <Text style={styles.infoSubtext}>
                    {event.address}
                    {event.city && `, ${event.city}`}
                    {event.state && `, ${event.state}`}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Distance */}
          {event.distance !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color="#667EEA" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {event.distance < 1 
                    ? `${(event.distance * 5280).toFixed(0)} ft` 
                    : `${event.distance.toFixed(1)} mi`}
                </Text>
              </View>
            </View>
          )}

          {/* Price */}
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color="#667EEA" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>{formatPrice()}</Text>
            </View>
          </View>

          {/* Category */}
          {event.category && (
            <View style={styles.infoRow}>
              <Ionicons name="apps-outline" size={20} color="#667EEA" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{event.category}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About This Event</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsContainer}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Tavvy Reviews</Text>
              {reviewCount > 0 && (
                <Text style={styles.reviewsCount}>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</Text>
              )}
            </View>

            {loadingReviews ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#667EEA" />
              </View>
            ) : hasReviews ? (
              <>
                {renderSignalSection('The Good', signals.best_for, '#0A84FF', 'thumbs-up')}
                {renderSignalSection('The Vibe', signals.vibe, '#8B5CF6', 'sparkles')}
                {renderSignalSection('Heads Up', signals.heads_up, '#FF9500', 'warning')}
              </>
            ) : (
              <View style={styles.emptyReviewsContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#333333" />
                <Text style={styles.emptyReviewsText}>No reviews yet</Text>
                <Text style={styles.emptyReviewsSubtext}>Be the first to share your experience!</Text>
              </View>
            )}

            {/* Add Your Tap Button */}
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={handleAddReview}
              activeOpacity={0.8}
            >
              <View style={styles.addReviewButtonContent}>
                <Ionicons name="add-circle-outline" size={24} color="#667EEA" />
                <Text style={styles.addReviewButtonText}>Add Your Tap</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Buy Tickets Button */}
          {event.url && (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={handleBuyTickets}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667EEA', '#5568D3']}
                style={styles.buyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buyButtonText}>Buy Tickets</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  heroContainer: {
    width: width,
    height: width * 0.75,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  descriptionContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  reviewsContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewsCount: {
    fontSize: 14,
    color: '#999999',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyReviewsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  signalSection: {
    marginBottom: 24,
  },
  signalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  signalSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  signalSectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  signalSectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signalBarContainer: {
    marginBottom: 16,
  },
  signalBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  signalEmoji: {
    fontSize: 18,
  },
  signalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  signalCount: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '600',
  },
  signalBarTrack: {
    height: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  signalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  addReviewButton: {
    marginTop: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667EEA',
    overflow: 'hidden',
  },
  addReviewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  addReviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667EEA',
  },
  buyButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
