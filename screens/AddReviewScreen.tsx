import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import SignalCard from '../components/SignalCard';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { submitReview, updateReview, fetchUserReview, ReviewSignalTap } from '../lib/reviews';
import { 
  REVIEW_TAGS, 
  CATEGORY_COLORS, 
  CATEGORY_LABELS, 
  ReviewCategory 
} from '../lib/reviewTags';

type RootStackParamList = {
  AddReview: { placeId?: string; placeName?: string };
};

type AddReviewRouteProp = RouteProp<RootStackParamList, 'AddReview'>;

export default function AddReviewScreen() {
  const route = useRoute<AddReviewRouteProp>();
  const navigation = useNavigation();
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName || 'this place';

  const [tapCounts, setTapCounts] = useState<{ [key: string]: number }>({});
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  // Load existing review if user has one
  useEffect(() => {
    loadExistingReview();
  }, [placeId]);

  const loadExistingReview = async () => {
    if (!placeId) {
      setIsLoading(false);
      return;
    }

    try {
      const { review, signals } = await fetchUserReview(placeId);
      
      if (review) {
        setExistingReviewId(review.id);
        setPublicNote(review.public_note || '');
        setPrivateNote(review.private_note_owner || '');
        
        // Convert signals to tap counts
        const counts: { [key: string]: number } = {};
        signals.forEach(signal => {
          counts[signal.signalId] = signal.intensity;
        });
        setTapCounts(counts);
        
        if (review.public_note || review.private_note_owner) {
          setShowNotes(true);
        }
      }
    } catch (error) {
      console.error('Error loading existing review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTap = (signalId: string) => {
    const currentCount = tapCounts[signalId] || 0;
    const newCount = currentCount < 3 ? currentCount + 1 : 0;
    
    if (newCount === 0) {
      const { [signalId]: _, ...rest } = tapCounts;
      setTapCounts(rest);
    } else {
      setTapCounts({ ...tapCounts, [signalId]: newCount });
    }
  };

  const handleSubmit = async () => {
    if (!placeId) {
      Alert.alert('Error', 'No place selected for review');
      return;
    }

    if (selectedCount === 0) {
      Alert.alert('Select Signals', 'Please tap at least one signal to describe your experience');
      return;
    }

    setIsSubmitting(true);

    // Convert tap counts to signal array
    const signals: ReviewSignalTap[] = Object.entries(tapCounts).map(([signalId, intensity]) => ({
      signalId,
      intensity,
    }));

    let result;
    
    if (existingReviewId) {
      // Update existing review
      result = await updateReview(
        existingReviewId,
        placeId,
        signals,
        publicNote,
        privateNote
      );
    } else {
      // Submit new review
      result = await submitReview(
        placeId,
        signals,
        publicNote,
        privateNote
      );
    }

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        existingReviewId ? 'Review Updated! 🎉' : 'Review Submitted! 🎉',
        `You reviewed ${placeName} with ${selectedCount} signals!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Error',
        'Failed to save review. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const selectedCount = Object.keys(tapCounts).length;

  const renderCategory = (category: ReviewCategory) => {
    const categoryTags = REVIEW_TAGS[category];
    const colors = CATEGORY_COLORS[category];
    const label = CATEGORY_LABELS[category];
    
    return (
      <View key={category} style={styles.categorySection}>
        <View style={[styles.categoryLabel, { backgroundColor: colors.bg }]}>
          <Text style={[styles.categoryLabelText, { color: colors.text }]}>{label}</Text>
        </View>
        
        <View style={styles.grid}>
          {categoryTags.map(tag => (
            <SignalCard
              key={tag.id}
              label={tag.label}
              icon={tag.icon}
              tapCount={tapCounts[tag.id] || 0}
              onTap={() => handleTap(tag.id)}
              color={colors.bg}
            />
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B9FD9" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.placeTitle}>Review: {placeName}</Text>
        
        <View style={styles.header}>
          <Text style={styles.title}>What Stood Out?</Text>
          {selectedCount > 0 && (
            <Text style={styles.selectedCount}>{selectedCount} selected</Text>
          )}
        </View>
        
        <Text style={styles.subtitle}>
          Tap to select • Tap again to make it stronger
        </Text>

        {renderCategory('best_for')}
        {renderCategory('vibe')}
        {renderCategory('heads_up')}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          {!showNotes ? (
            <TouchableOpacity 
              style={styles.addNoteButton}
              onPress={() => setShowNotes(true)}
            >
              <Text style={styles.addNoteButtonText}>Add a note (optional)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.notesContainer}>
              <View style={styles.noteField}>
                <Text style={styles.noteLabel}>Public Note (visible to everyone)</Text>
                <TextInput
                  style={styles.noteInput}
                  value={publicNote}
                  onChangeText={setPublicNote}
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.noteField}>
                <Text style={styles.noteLabel}>Private Note (only you can see)</Text>
                <TextInput
                  style={[styles.noteInput, styles.privateNoteInput]}
                  value={privateNote}
                  onChangeText={setPrivateNote}
                  placeholder="Notes for yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (selectedCount === 0 || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={selectedCount === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReviewId ? 'Update Review →' : 'Submit Review →'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B9FD9',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  addNoteButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addNoteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  notesContainer: {
    gap: 16,
  },
  noteField: {
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
  },
  privateNoteInput: {
    minHeight: 60,
  },
  submitButton: {
    backgroundColor: '#3B9FD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
