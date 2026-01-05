import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient'; // Commented out to prevent crash
import { submitReview, updateReview, fetchUserReview, ReviewSignalTap } from '../lib/reviews';
import { REVIEW_TAGS, ReviewCategory } from '../lib/reviewTags';
import PulseCard from '../components/PulseCard';
import { Colors } from '../Constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  AddReview: { placeId?: string; placeName?: string };
};

type AddReviewRouteProp = RouteProp<RootStackParamList, 'AddReview'>;

// Wizard Steps Configuration
const STEPS = [
  {
    id: 'best_for',
    title: 'What did you like?',
    subtitle: 'Tap the highlights.',
    theme: 'positive',
    limit: 5,
    gradient: ['#E0F2FE', '#FFFFFF'] as const, // Soft Blue to White
    accent: '#00a7da',
    solidColor: '#E0F2FE', // Fallback for no gradient
  },
  {
    id: 'vibe',
    title: 'How’s the vibe?',
    subtitle: 'Set the scene.',
    theme: 'vibe',
    limit: 5,
    gradient: ['#F3E8FF', '#FFFFFF'] as const, // Soft Purple to White
    accent: '#8B5CF6',
    solidColor: '#F3E8FF', // Fallback for no gradient
  },
  {
    id: 'heads_up',
    title: 'Any heads up?',
    subtitle: 'Help others prepare.',
    theme: 'negative',
    limit: 2,
    gradient: ['#FEE2E2', '#FFFFFF'] as const, // Soft Red to White
    accent: '#EF4444',
    solidColor: '#FEE2E2', // Fallback for no gradient
  }
] as const;

export default function AddReviewScreen() {
  const route = useRoute<AddReviewRouteProp>();
  const navigation = useNavigation();
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName || 'this place';

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tapCounts, setTapCounts] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Load existing review
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
        const counts: { [key: string]: number } = {};
        signals.forEach(signal => {
          counts[signal.signalId] = signal.intensity;
        });
        setTapCounts(counts);
      }
    } catch (error) {
      console.error('Error loading existing review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTap = (signalId: string) => {
    const currentCount = tapCounts[signalId] || 0;
    
    // Calculate how many items are currently selected in this category
    const categoryTags = REVIEW_TAGS[currentStep.id as ReviewCategory].map(t => t.id);
    const currentCategorySelectionCount = Object.keys(tapCounts).filter(
      key => categoryTags.includes(key) && tapCounts[key] > 0
    ).length;

    // Logic:
    // 1. If tapping a new item (currentCount === 0) AND we hit the limit -> Block it
    if (currentCount === 0 && currentCategorySelectionCount >= currentStep.limit) {
      Alert.alert('Limit Reached', `You can only select ${currentStep.limit} items for this section.`);
      return;
    }

    // 2. Cycle: 0 -> 1 -> 2 -> 3 -> 0
    const newCount = currentCount < 3 ? currentCount + 1 : 0;
    
    if (newCount === 0) {
      const { [signalId]: _, ...rest } = tapCounts;
      setTapCounts(rest);
    } else {
      setTapCounts({ ...tapCounts, [signalId]: newCount });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!placeId) return;

    const selectedCount = Object.keys(tapCounts).length;
    if (selectedCount === 0) {
      Alert.alert('Empty Review', 'Please select at least one signal before submitting.');
      return;
    }

    setIsSubmitting(true);

    const signals: ReviewSignalTap[] = Object.entries(tapCounts).map(([signalId, intensity]) => ({
      signalId,
      intensity,
    }));

    let result;
    if (existingReviewId) {
      result = await updateReview(existingReviewId, placeId, signals, '', '');
    } else {
      result = await submitReview(placeId, placeName, signals, '', '');
    }

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Success! 🎉',
        `You reviewed ${placeName}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', 'Failed to save review. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Get tags for current step
  const currentTags = REVIEW_TAGS[currentStep.id as ReviewCategory];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Dynamic Background (Solid Color Fallback) */}
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: currentStep.solidColor }
        ]} 
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                    backgroundColor: currentStep.accent 
                  }
                ]} 
              />
            </View>
            <Text style={styles.stepIndicator}>
              Step {currentStepIndex + 1} of {STEPS.length}
            </Text>
          </View>
          
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.stepTitle}>
              {currentStep.title}
            </Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>
          
          {/* Warning Box for Negative Step */}
          {currentStep.theme === 'negative' && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={24} color="#991B1B" />
              <Text style={styles.warningText}>
                Note: Selecting these will lower the place's Vibe Score.
              </Text>
            </View>
          )}

          {/* White Card Surface */}
          <View style={styles.cardSurface}>
            <View style={styles.grid}>
              {currentTags.map(tag => (
                <PulseCard
                  key={tag.id}
                  label={tag.label}
                  icon={tag.icon}
                  intensity={tapCounts[tag.id] || 0}
                  onTap={() => handleTap(tag.id)}
                  theme={currentStep.theme as any}
                  disabled={false}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Floating Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: currentStep.accent }]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isLastStep ? 'Submit Review' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  titleContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardSurface: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F2', // Slightly stronger light red
    borderColor: '#F43F5E', // Rose-500: Much stronger border color
    borderWidth: 2, // Thicker border
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#991B1B', // Dark red text
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});