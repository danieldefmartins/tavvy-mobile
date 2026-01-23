// =============================================
// BUSINESS STORY MODERATION SCREEN
// =============================================
// For business owners/admins to review reported stories
// at their places and take moderation actions

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { Video, ResizeMode } from 'expo-av';
import {
  getReportedStoriesForAdmin,
  moderateStory,
  ReportedStoryWithDetails,
  ModerationAction,
} from '../lib/storyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdminPlace {
  place_id: string;
  place_name: string;
  pending_reports: number;
}

export default function BusinessStoryModerationScreen() {
  const navigation = useNavigation();

  const [adminPlaces, setAdminPlaces] = useState<AdminPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<AdminPlace | null>(null);
  const [reportedStories, setReportedStories] = useState<ReportedStoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<ReportedStoryWithDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [moderationNote, setModerationNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        loadAdminPlaces();
      }
    }, [currentUserId])
  );

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadAdminPlaces = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      // Get places where user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('place_admins')
        .select('place_id')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (adminError) throw adminError;

      if (!adminData || adminData.length === 0) {
        setAdminPlaces([]);
        setIsLoading(false);
        return;
      }

      const placeIds = adminData.map(a => a.place_id);

      // Get place details and pending report counts
      const { data: placesData, error: placesError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_id, name')
        .in('fsq_id', placeIds);

      if (placesError) throw placesError;

      // Get pending report counts for each place
      const placesWithCounts: AdminPlace[] = await Promise.all(
        (placesData || []).map(async (place) => {
          const { count } = await supabase
            .from('place_stories')
            .select('*', { count: 'exact', head: true })
            .eq('place_id', place.fsq_id)
            .eq('status', 'under_review');

          return {
            place_id: place.fsq_id,
            place_name: place.name,
            pending_reports: count || 0,
          };
        })
      );

      setAdminPlaces(placesWithCounts);
    } catch (error) {
      console.error('Error loading admin places:', error);
      Alert.alert('Error', 'Failed to load your business places');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportedStories = async (placeId: string) => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const stories = await getReportedStoriesForAdmin(currentUserId, placeId);
      setReportedStories(stories);
    } catch (error) {
      console.error('Error loading reported stories:', error);
      Alert.alert('Error', 'Failed to load reported stories');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPlace = (place: AdminPlace) => {
    setSelectedPlace(place);
    loadReportedStories(place.place_id);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (selectedPlace) {
      await loadReportedStories(selectedPlace.place_id);
    } else {
      await loadAdminPlaces();
    }
    setIsRefreshing(false);
  };

  const openStoryDetail = (story: ReportedStoryWithDetails) => {
    setSelectedStory(story);
    setModerationNote('');
    setShowDetailModal(true);
  };

  const handleModeration = async (action: ModerationAction) => {
    if (!selectedStory || !currentUserId) return;

    setIsProcessing(true);
    try {
      const result = await moderateStory(
        selectedStory.id,
        currentUserId,
        action,
        moderationNote.trim() || undefined
      );

      if (result.success) {
        // Remove from list
        setReportedStories(prev => prev.filter(s => s.id !== selectedStory.id));
        
        // Update place count
        if (selectedPlace) {
          setAdminPlaces(prev =>
            prev.map(p =>
              p.place_id === selectedPlace.place_id
                ? { ...p, pending_reports: Math.max(0, p.pending_reports - 1) }
                : p
            )
          );
        }

        setShowDetailModal(false);
        setSelectedStory(null);
        setModerationNote('');

        const actionText = action === 'approve' ? 'approved' : action === 'remove' ? 'removed' : 'dismissed';
        Alert.alert('Success', `Story ${actionText} successfully`);
      } else {
        Alert.alert('Error', result.error || 'Failed to moderate story');
      }
    } catch (error) {
      console.error('Error moderating story:', error);
      Alert.alert('Error', 'Failed to moderate story');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReportReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      sexual: 'Sexual Content',
      explicit: 'Explicit/Graphic',
      harassment: 'Harassment',
      violent: 'Violence',
      spam: 'Spam',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  // Render place selection list
  const renderPlaceList = () => (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F1233', '#1a1f4e']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Story Moderation</Text>
          <Text style={styles.headerSubtitle}>Review reported stories at your places</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your places...</Text>
        </View>
      ) : adminPlaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Business Places</Text>
          <Text style={styles.emptyText}>
            You are not an admin of any business places yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={adminPlaces}
          keyExtractor={(item) => item.place_id}
          contentContainerStyle={styles.placeList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.placeCard}
              onPress={() => selectPlace(item)}
            >
              <View style={styles.placeIcon}>
                <Ionicons name="business" size={24} color="#3B82F6" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{item.place_name}</Text>
                <Text style={styles.placeStatus}>
                  {item.pending_reports > 0
                    ? `${item.pending_reports} pending report${item.pending_reports > 1 ? 's' : ''}`
                    : 'No pending reports'}
                </Text>
              </View>
              {item.pending_reports > 0 && (
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>{item.pending_reports}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );

  // Render reported stories list
  const renderStoriesList = () => (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F1233', '#1a1f4e']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedPlace(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedPlace?.place_name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {reportedStories.length} reported stor{reportedStories.length === 1 ? 'y' : 'ies'}
          </Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reported stories...</Text>
        </View>
      ) : reportedStories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptyText}>
            No reported stories need your review at this place.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reportedStories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.storiesList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.storyCard}
              onPress={() => openStoryDetail(item)}
            >
              {/* Thumbnail */}
              <View style={styles.storyThumbnail}>
                {item.media_type === 'video' ? (
                  <Video
                    source={{ uri: item.thumbnail_url || item.media_url }}
                    style={styles.thumbnailImage}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                  />
                ) : (
                  <Image source={{ uri: item.media_url }} style={styles.thumbnailImage} />
                )}
                {item.media_type === 'video' && (
                  <View style={styles.videoIcon}>
                    <Ionicons name="videocam" size={14} color="#fff" />
                  </View>
                )}
                <View style={styles.reportCountBadge}>
                  <Ionicons name="flag" size={12} color="#fff" />
                  <Text style={styles.reportCountText}>{item.report_count}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.storyInfo}>
                <Text style={styles.storyDate}>{formatDate(item.created_at)}</Text>
                {item.caption && (
                  <Text style={styles.storyCaption} numberOfLines={2}>
                    {item.caption}
                  </Text>
                )}
                <View style={styles.reportReasons}>
                  {item.reports?.slice(0, 2).map((report, index) => (
                    <View key={index} style={styles.reasonTag}>
                      <Text style={styles.reasonText}>
                        {getReportReasonLabel(report.reason)}
                      </Text>
                    </View>
                  ))}
                  {(item.reports?.length || 0) > 2 && (
                    <Text style={styles.moreReasons}>
                      +{(item.reports?.length || 0) - 2} more
                    </Text>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );

  // Render story detail modal
  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowDetailModal(false);
              setSelectedStory(null);
            }}
          >
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Review Story</Text>
          <View style={{ width: 28 }} />
        </View>

        {selectedStory && (
          <ScrollView style={styles.modalContent}>
            {/* Media Preview */}
            <View style={styles.mediaPreview}>
              {selectedStory.media_type === 'video' ? (
                <Video
                  source={{ uri: selectedStory.media_url }}
                  style={styles.previewMedia}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay={false}
                />
              ) : (
                <Image
                  source={{ uri: selectedStory.media_url }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Story Info */}
            <View style={styles.storyDetails}>
              {selectedStory.caption && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Caption</Text>
                  <Text style={styles.detailText}>{selectedStory.caption}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Posted</Text>
                <Text style={styles.detailText}>{formatDate(selectedStory.created_at)}</Text>
              </View>

              {/* Reports Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>
                  Reports ({selectedStory.reports?.length || 0})
                </Text>
                {selectedStory.reports?.map((report, index) => (
                  <View key={index} style={styles.reportItem}>
                    <View style={styles.reportHeader}>
                      <View style={styles.reasonTagLarge}>
                        <Ionicons name="flag" size={14} color="#EF4444" />
                        <Text style={styles.reasonTextLarge}>
                          {getReportReasonLabel(report.reason)}
                        </Text>
                      </View>
                      <Text style={styles.reportDate}>
                        {formatDate(report.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Moderation Note */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Moderation Note (Optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note about your decision..."
                  placeholderTextColor="#9CA3AF"
                  value={moderationNote}
                  onChangeText={setModerationNote}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleModeration('approve')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={() => handleModeration('dismiss')}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Dismiss Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => {
                  Alert.alert(
                    'Remove Story',
                    'This will remove the story and issue a strike to the user. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove & Strike',
                        style: 'destructive',
                        onPress: () => handleModeration('remove'),
                      },
                    ]
                  );
                }}
                disabled={isProcessing}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Remove & Strike</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.warningText}>
              Removing a story will issue a strike to the user. 2 strikes result in suspension.
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {selectedPlace ? renderStoriesList() : renderPlaceList()}
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  placeList: {
    padding: 16,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeStatus: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  reportBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  reportBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  storiesList: {
    padding: 16,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoIcon: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 2,
  },
  reportCountBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reportCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  storyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  storyCaption: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  reportReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  reasonTag: {
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reasonText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
  },
  moreReasons: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },
  mediaPreview: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  storyDetails: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  reportItem: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonTagLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonTextLarge: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warningText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
