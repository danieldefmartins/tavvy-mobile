// =============================================
// OWNER HIGHLIGHTS MANAGEMENT SCREEN
// =============================================
// Allows business owners to curate permanent story highlights
// from their place's stories

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { Video, ResizeMode } from 'expo-av';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Highlight {
  id: string;
  place_id: string;
  title: string;
  cover_image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  items?: HighlightItem[];
}

interface HighlightItem {
  id: string;
  highlight_id: string;
  story_id: string;
  display_order: number;
  story?: Story;
}

interface Story {
  id: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  view_count: number;
}

interface RouteParams {
  placeId: string;
  placeName: string;
}

export default function OwnerHighlightsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId, placeName } = (route.params as RouteParams) || {};

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStoryPicker, setShowStoryPicker] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedStories, setSelectedStories] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [placeId])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadHighlights(), loadAvailableStories()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHighlights = async () => {
    const { data, error } = await supabase
      .from('place_story_highlights')
      .select(`
        *,
        items:place_story_highlight_items(
          *,
          story:place_stories(*)
        )
      `)
      .eq('place_id', placeId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading highlights:', error);
      return;
    }

    setHighlights(data || []);
  };

  const loadAvailableStories = async () => {
    const { data, error } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('moderation_status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading stories:', error);
      return;
    }

    setAvailableStories(data || []);
  };

  const createHighlight = async () => {
    if (!newHighlightTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the highlight');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Get the next display order
      const nextOrder = highlights.length > 0 
        ? Math.max(...highlights.map(h => h.display_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('place_story_highlights')
        .insert({
          place_id: placeId,
          title: newHighlightTitle.trim(),
          display_order: nextOrder,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setHighlights(prev => [...prev, data]);
      setNewHighlightTitle('');
      setShowCreateModal(false);

      // Open story picker for the new highlight
      setSelectedHighlight(data);
      setSelectedStories([]);
      setShowStoryPicker(true);
    } catch (error) {
      console.error('Error creating highlight:', error);
      Alert.alert('Error', 'Failed to create highlight');
    } finally {
      setIsSaving(false);
    }
  };

  const updateHighlight = async () => {
    if (!selectedHighlight || !newHighlightTitle.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('place_story_highlights')
        .update({ title: newHighlightTitle.trim() })
        .eq('id', selectedHighlight.id);

      if (error) throw error;

      setHighlights(prev => 
        prev.map(h => h.id === selectedHighlight.id 
          ? { ...h, title: newHighlightTitle.trim() } 
          : h
        )
      );
      setShowEditModal(false);
      setSelectedHighlight(null);
      setNewHighlightTitle('');
    } catch (error) {
      console.error('Error updating highlight:', error);
      Alert.alert('Error', 'Failed to update highlight');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHighlight = async (highlight: Highlight) => {
    Alert.alert(
      'Delete Highlight',
      `Are you sure you want to delete "${highlight.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete highlight items first
              await supabase
                .from('place_story_highlight_items')
                .delete()
                .eq('highlight_id', highlight.id);

              // Delete highlight
              const { error } = await supabase
                .from('place_story_highlights')
                .delete()
                .eq('id', highlight.id);

              if (error) throw error;

              setHighlights(prev => prev.filter(h => h.id !== highlight.id));
            } catch (error) {
              console.error('Error deleting highlight:', error);
              Alert.alert('Error', 'Failed to delete highlight');
            }
          },
        },
      ]
    );
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStories(prev =>
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const saveHighlightStories = async () => {
    if (!selectedHighlight) return;

    setIsSaving(true);
    try {
      // Delete existing items
      await supabase
        .from('place_story_highlight_items')
        .delete()
        .eq('highlight_id', selectedHighlight.id);

      // Insert new items
      if (selectedStories.length > 0) {
        const items = selectedStories.map((storyId, index) => ({
          highlight_id: selectedHighlight.id,
          story_id: storyId,
          display_order: index,
        }));

        const { error } = await supabase
          .from('place_story_highlight_items')
          .insert(items);

        if (error) throw error;

        // Update cover image to first story's thumbnail
        const firstStory = availableStories.find(s => s.id === selectedStories[0]);
        if (firstStory) {
          await supabase
            .from('place_story_highlights')
            .update({ cover_image_url: firstStory.thumbnail_url || firstStory.media_url })
            .eq('id', selectedHighlight.id);
        }
      }

      await loadHighlights();
      setShowStoryPicker(false);
      setSelectedHighlight(null);
      setSelectedStories([]);
    } catch (error) {
      console.error('Error saving highlight stories:', error);
      Alert.alert('Error', 'Failed to save stories to highlight');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditHighlight = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setNewHighlightTitle(highlight.title);
    setShowEditModal(true);
  };

  const openStoryPicker = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setSelectedStories(highlight.items?.map(i => i.story_id) || []);
    setShowStoryPicker(true);
  };

  const toggleHighlightActive = async (highlight: Highlight) => {
    try {
      const { error } = await supabase
        .from('place_story_highlights')
        .update({ is_active: !highlight.is_active })
        .eq('id', highlight.id);

      if (error) throw error;

      setHighlights(prev =>
        prev.map(h => h.id === highlight.id ? { ...h, is_active: !h.is_active } : h)
      );
    } catch (error) {
      console.error('Error toggling highlight:', error);
    }
  };

  const renderHighlightCard = (highlight: Highlight) => (
    <View key={highlight.id} style={styles.highlightCard}>
      {/* Cover Image */}
      <TouchableOpacity
        style={styles.highlightCover}
        onPress={() => openStoryPicker(highlight)}
      >
        {highlight.cover_image_url ? (
          <Image source={{ uri: highlight.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.emptyCover}>
            <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyCoverText}>Add Stories</Text>
          </View>
        )}
        {highlight.items && highlight.items.length > 0 && (
          <View style={styles.storyCount}>
            <Text style={styles.storyCountText}>{highlight.items.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.highlightTitle} numberOfLines={1}>{highlight.title}</Text>

      {/* Actions */}
      <View style={styles.highlightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditHighlight(highlight)}
        >
          <Ionicons name="pencil" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleHighlightActive(highlight)}
        >
          <Ionicons
            name={highlight.is_active ? 'eye' : 'eye-off'}
            size={18}
            color={highlight.is_active ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteHighlight(highlight)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isSelected = selectedStories.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.storyItem, isSelected && styles.storyItemSelected]}
        onPress={() => toggleStorySelection(item.id)}
      >
        {item.media_type === 'video' ? (
          <Video
            source={{ uri: item.thumbnail_url || item.media_url }}
            style={styles.storyThumbnail}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
        ) : (
          <Image source={{ uri: item.media_url }} style={styles.storyThumbnail} />
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>
                {selectedStories.indexOf(item.id) + 1}
              </Text>
            </View>
          </View>
        )}
        {item.media_type === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="videocam" size={14} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading highlights...</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Story Highlights</Text>
          <Text style={styles.headerSubtitle}>{placeName}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Highlights are permanent story collections that appear on your place profile.
          Unlike regular stories, they don't expire.
        </Text>
      </View>

      {/* Highlights Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {highlights.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Highlights Yet</Text>
            <Text style={styles.emptyText}>
              Create highlights to showcase your best stories permanently on your profile.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Highlight</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.highlightsGrid}>
            {highlights.map(renderHighlightCard)}
            {/* Add New Highlight Card */}
            <TouchableOpacity
              style={styles.addHighlightCard}
              onPress={() => setShowCreateModal(true)}
            >
              <View style={styles.addHighlightIcon}>
                <Ionicons name="add" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.addHighlightText}>New</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Highlight Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Highlight</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Highlight title (e.g., Menu, Events, Behind the Scenes)"
              placeholderTextColor="#9CA3AF"
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewHighlightTitle('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, isSaving && styles.modalButtonDisabled]}
                onPress={createHighlight}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Highlight Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Highlight</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Highlight title"
              placeholderTextColor="#9CA3AF"
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedHighlight(null);
                  setNewHighlightTitle('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, isSaving && styles.modalButtonDisabled]}
                onPress={updateHighlight}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Story Picker Modal */}
      <Modal
        visible={showStoryPicker}
        animationType="slide"
        onRequestClose={() => setShowStoryPicker(false)}
      >
        <SafeAreaView style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowStoryPicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>
              {selectedHighlight?.title || 'Select Stories'}
            </Text>
            <TouchableOpacity
              onPress={saveHighlightStories}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.pickerDoneText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.pickerSubtitle}>
            Tap stories to add them. Tap again to remove. Order matters!
          </Text>

          {availableStories.length === 0 ? (
            <View style={styles.noStoriesContainer}>
              <Ionicons name="images-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noStoriesText}>No stories available</Text>
              <Text style={styles.noStoriesSubtext}>
                Upload stories first to add them to highlights
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableStories}
              renderItem={renderStoryItem}
              keyExtractor={item => item.id}
              numColumns={3}
              contentContainerStyle={styles.storiesGrid}
            />
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
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
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Highlights Grid
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  highlightCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    alignItems: 'center',
  },
  highlightCover: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: (SCREEN_WIDTH - 48) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  emptyCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCoverText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  storyCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  storyCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  highlightActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },

  // Add Highlight Card
  addHighlightCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    alignItems: 'center',
  },
  addHighlightIcon: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: (SCREEN_WIDTH - 48) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHighlightText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalCreateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalCreateText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },

  // Story Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerCancelText: {
    fontSize: 15,
    color: '#6B7280',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickerDoneText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },
  pickerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  storiesGrid: {
    padding: 2,
  },
  storyItem: {
    width: (SCREEN_WIDTH - 8) / 3,
    height: (SCREEN_WIDTH - 8) / 3 * 1.5,
    margin: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storyItemSelected: {
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  storyThumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 4,
  },
  noStoriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noStoriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  noStoriesSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
