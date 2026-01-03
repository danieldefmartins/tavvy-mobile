import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (width - GRID_GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface PlacePhoto {
  id: string;
  url: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  caption?: string;
  created_at: string;
  is_cover?: boolean;
}

interface PlacePhotosScreenProps {
  route: {
    params: {
      placeId: string;
      placeName: string;
      photos?: PlacePhoto[];
    };
  };
  navigation: any;
}

export default function PlacePhotosScreen({ route, navigation }: PlacePhotosScreenProps) {
  const { placeId, placeName, photos: initialPhotos } = route.params;
  
  const [photos, setPhotos] = useState<PlacePhoto[]>(initialPhotos || []);
  const [loading, setLoading] = useState(!initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<PlacePhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fullscreenListRef = useRef<FlatList>(null);

  // Fetch photos if not provided
  useEffect(() => {
    if (!initialPhotos) {
      fetchPhotos();
    }
  }, [placeId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('place_photos')
        .select('id, url, user_id, caption, created_at, is_cover, users(display_name, avatar_url)')
        .eq('place_id', placeId)
        .order('is_cover', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedPhotos: PlacePhoto[] = data.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          user_id: photo.user_id,
          user_name: photo.users?.display_name || 'Anonymous',
          user_avatar: photo.users?.avatar_url,
          caption: photo.caption,
          created_at: photo.created_at,
          is_cover: photo.is_cover,
        }));
        setPhotos(mappedPhotos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open fullscreen viewer
  const openFullscreen = (photo: PlacePhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Close fullscreen viewer
  const closeFullscreen = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPhoto(null);
    });
  };

  // Handle fullscreen swipe
  const onFullscreenScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < photos.length) {
      setCurrentIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Navigate to add photo
  const handleAddPhoto = () => {
    navigation.navigate('AddPhoto', {
      placeId,
      placeName,
    });
  };

  // Render grid item
  const renderGridItem = ({ item, index }: { item: PlacePhoto; index: number }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => openFullscreen(item, index)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.url }} style={styles.gridImage} />
      {item.is_cover && (
        <View style={styles.coverBadge}>
          <Ionicons name="star" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render fullscreen item
  const renderFullscreenItem = ({ item }: { item: PlacePhoto }) => (
    <View style={styles.fullscreenItem}>
      <Image
        source={{ uri: item.url }}
        style={styles.fullscreenImage}
        resizeMode="contain"
      />
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{placeName}</Text>
          <Text style={styles.headerSubtitle}>{photos.length} photos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Photos Yet</Text>
          <Text style={styles.emptyText}>Be the first to share a photo of this place!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddPhoto}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fullscreen Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="none"
        onRequestClose={closeFullscreen}
      >
        <Animated.View style={[styles.fullscreenContainer, { opacity: fadeAnim }]}>
          <StatusBar barStyle="light-content" />
          
          {/* Fullscreen Header */}
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={closeFullscreen}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullscreenCounter}>
              {currentIndex + 1} / {photos.length}
            </Text>
            <View style={styles.fullscreenHeaderRight} />
          </View>

          {/* Fullscreen Image Carousel */}
          <FlatList
            ref={fullscreenListRef}
            data={photos}
            renderItem={renderFullscreenItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onFullscreenScroll}
            scrollEventThrottle={16}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />

          {/* Fullscreen Footer with Photo Info */}
          {selectedPhoto && (
            <View style={styles.fullscreenFooter}>
              <View style={styles.photoInfo}>
                <View style={styles.userInfo}>
                  {selectedPhoto.user_avatar ? (
                    <Image
                      source={{ uri: selectedPhoto.user_avatar }}
                      style={styles.userAvatar}
                    />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Ionicons name="person" size={16} color="#666" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.userName}>
                      {selectedPhoto.user_name || 'Anonymous'}
                    </Text>
                    <Text style={styles.photoDate}>
                      {formatDate(selectedPhoto.created_at)}
                    </Text>
                  </View>
                </View>
                {selectedPhoto.caption && (
                  <Text style={styles.photoCaption}>{selectedPhoto.caption}</Text>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    padding: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GRID_GAP / 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fullscreenCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fullscreenHeaderRight: {
    width: 40,
  },
  fullscreenItem: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height * 0.7,
  },
  fullscreenFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  photoInfo: {
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  photoDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  photoCaption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});
