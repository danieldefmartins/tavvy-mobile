// =============================================
// STORY MODERATION DASHBOARD
// =============================================
// Admin tools for reviewing and moderating user-submitted stories

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ModerationStatus = 'pending' | 'active' | 'flagged' | 'removed';
type ModerationFilter = 'all' | ModerationStatus;

interface Story {
  id: string;
  place_id: string;
  user_id: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url: string | null;
  caption: string | null;
  tags: string[] | null;
  moderation_status: ModerationStatus;
  moderation_notes: string | null;
  view_count: number;
  created_at: string;
  expires_at: string;
  place?: {
    name: string;
    city: string;
  };
  user?: {
    email: string;
    full_name: string;
  };
}

interface ModerationStats {
  pending: number;
  active: number;
  flagged: number;
  removed: number;
  total: number;
}

export default function StoryModerationScreen() {
  const navigation = useNavigation();

  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    pending: 0,
    active: 0,
    flagged: 0,
    removed: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<ModerationFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [moderationNote, setModerationNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadStories(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStories = async () => {
    let query = supabase
      .from('place_stories')
      .select(`
        *,
        place:fsq_places_raw(name, city),
        user:profiles(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('moderation_status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading stories:', error);
      return;
    }

    setStories(data || []);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('place_stories')
      .select('moderation_status');

    if (error) {
      console.error('Error loading stats:', error);
      return;
    }

    const newStats: ModerationStats = {
      pending: 0,
      active: 0,
      flagged: 0,
      removed: 0,
      total: data?.length || 0,
    };

    data?.forEach(story => {
      if (story.moderation_status in newStats) {
        newStats[story.moderation_status as ModerationStatus]++;
      }
    });

    setStats(newStats);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const openStoryDetail = (story: Story) => {
    setSelectedStory(story);
    setModerationNote(story.moderation_notes || '');
    setShowDetailModal(true);
  };

  const updateStoryStatus = async (status: ModerationStatus) => {
    if (!selectedStory) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('place_stories')
        .update({
          moderation_status: status,
          moderation_notes: moderationNote.trim() || null,
        })
        .eq('id', selectedStory.id);

      if (error) throw error;

      // Update local state
      setStories(prev =>
        prev.map(s =>
          s.id === selectedStory.id
            ? { ...s, moderation_status: status, moderation_notes: moderationNote.trim() || null }
            : s
        ).filter(s => filter === 'all' || s.moderation_status === filter)
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        [selectedStory.moderation_status]: prev[selectedStory.moderation_status] - 1,
        [status]: prev[status] + 1,
      }));

      setShowDetailModal(false);
      setSelectedStory(null);
      setModerationNote('');

      Alert.alert('Success', `Story ${status === 'active' ? 'approved' : status}`);
    } catch (error) {
      console.error('Error updating story:', error);
      Alert.alert('Error', 'Failed to update story status');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteStory = async () => {
    if (!selectedStory) return;

    Alert.alert(
      'Delete Story',
      'Are you sure you want to permanently delete this story? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const { error } = await supabase
                .from('place_stories')
                .delete()
                .eq('id', selectedStory.id);

              if (error) throw error;

              setStories(prev => prev.filter(s => s.id !== selectedStory.id));
              setStats(prev => ({
                ...prev,
                [selectedStory.moderation_status]: prev[selectedStory.moderation_status] - 1,
                total: prev.total - 1,
              }));

              setShowDetailModal(false);
              setSelectedStory(null);
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert('Error', 'Failed to delete story');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'active': return '#10B981';
      case 'flagged': return '#EF4444';
      case 'removed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: ModerationStatus) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'active': return 'checkmark-circle';
      case 'flagged': return 'flag';
      case 'removed': return 'close-circle';
      default: return 'help-circle';
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

  const renderFilterTab = (filterValue: ModerationFilter, label: string, count?: number) => (
    <TouchableOpacity
      key={filterValue}
      style={[styles.filterTab, filter === filterValue && styles.filterTabActive]}
      onPress={() => setFilter(filterValue)}
    >
      <Text style={[styles.filterTabText, filter === filterValue && styles.filterTabTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterBadge, { backgroundColor: getStatusColor(filterValue as ModerationStatus) }]}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStoryCard = ({ item }: { item: Story }) => (
    <TouchableOpacity style={styles.storyCard} onPress={() => openStoryDetail(item)}>
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.moderation_status) }]}>
          <Ionicons name={getStatusIcon(item.moderation_status)} size={12} color="#fff" />
        </View>
      </View>

      {/* Info */}
      <View style={styles.storyInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.place?.name || 'Unknown Place'}
        </Text>
        <Text style={styles.storyMeta}>
          {formatDate(item.created_at)} • {item.view_count} views
        </Text>
        {item.caption && (
          <Text style={styles.storyCaption} numberOfLines={2}>{item.caption}</Text>
        )}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {item.moderation_status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.quickAction, styles.approveAction]}
              onPress={() => {
                setSelectedStory(item);
                updateStoryStatus('active');
              }}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, styles.rejectAction]}
              onPress={() => {
                setSelectedStory(item);
                updateStoryStatus('removed');
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading moderation queue...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Moderation</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.flagged}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.statNumber, { color: '#4B5563' }]}>{stats.removed}</Text>
          <Text style={styles.statLabel}>Removed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterTab('pending', 'Pending', stats.pending)}
        {renderFilterTab('active', 'Active', stats.active)}
        {renderFilterTab('flagged', 'Flagged', stats.flagged)}
        {renderFilterTab('removed', 'Removed', stats.removed)}
        {renderFilterTab('all', 'All')}
      </ScrollView>

      {/* Stories List */}
      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No stories to review</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending'
                ? 'All stories have been reviewed!'
                : `No ${filter} stories found.`}
            </Text>
          </View>
        }
      />

      {/* Story Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedStory && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Review Story</Text>
                <View style={{ width: 28 }} />
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Media Preview */}
                <View style={styles.mediaPreview}>
                  {selectedStory.media_type === 'video' ? (
                    <Video
                      source={{ uri: selectedStory.media_url }}
                      style={styles.previewMedia}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                      isLooping
                      useNativeControls
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
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Place</Text>
                  <Text style={styles.detailValue}>
                    {selectedStory.place?.name || 'Unknown'} • {selectedStory.place?.city || ''}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Uploaded by</Text>
                  <Text style={styles.detailValue}>
                    {selectedStory.user?.full_name || selectedStory.user?.email || 'Unknown user'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Uploaded</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedStory.created_at)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Expires</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedStory.expires_at)}</Text>
                </View>

                {selectedStory.caption && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Caption</Text>
                    <Text style={styles.detailValue}>{selectedStory.caption}</Text>
                  </View>
                )}

                {selectedStory.tags && selectedStory.tags.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Tags</Text>
                    <View style={styles.tagsWrap}>
                      {selectedStory.tags.map(tag => (
                        <View key={tag} style={styles.detailTag}>
                          <Text style={styles.detailTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Current Status</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusPill, { backgroundColor: getStatusColor(selectedStory.moderation_status) }]}>
                      <Ionicons name={getStatusIcon(selectedStory.moderation_status)} size={14} color="#fff" />
                      <Text style={styles.statusPillText}>
                        {selectedStory.moderation_status.charAt(0).toUpperCase() + selectedStory.moderation_status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Moderation Note */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Moderation Note</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note (optional)..."
                    placeholderTextColor="#9CA3AF"
                    value={moderationNote}
                    onChangeText={setModerationNote}
                    multiline
                    maxLength={500}
                  />
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => updateStoryStatus('active')}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.flagBtn]}
                  onPress={() => updateStoryStatus('flagged')}
                  disabled={isProcessing}
                >
                  <Ionicons name="flag" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Flag</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.removeBtn]}
                  onPress={() => updateStoryStatus('removed')}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Remove</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={deleteStory}
                  disabled={isProcessing}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Filter
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // List
  listContent: {
    padding: 16,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storyThumbnail: {
    width: 80,
    height: 100,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    borderRadius: 10,
    padding: 4,
  },
  storyInfo: {
    flex: 1,
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  storyMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  storyCaption: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  quickActions: {
    justifyContent: 'center',
    paddingRight: 8,
    gap: 8,
  },
  quickAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveAction: {
    backgroundColor: '#10B981',
  },
  rejectAction: {
    backgroundColor: '#EF4444',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Modal
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
    height: SCREEN_WIDTH * 1.2,
    backgroundColor: '#000',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTagText: {
    fontSize: 13,
    color: '#3B82F6',
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  flagBtn: {
    backgroundColor: '#F59E0B',
  },
  removeBtn: {
    backgroundColor: '#6B7280',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
});
