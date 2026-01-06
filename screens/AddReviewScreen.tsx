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
import { submitReview, updateReview, fetchUserReview, ReviewSignalTap } from '../lib/reviews';
import { 
  fetchSignalsForPlace, 
  SignalsByCategory, 
  Signal,
  SIGNAL_COLORS,
  SIGNAL_LABELS 
} from '../lib/signalService';
import PulseCard from '../components/PulseCard';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  AddReview: { placeId?: string; placeName?: string };
};

type AddReviewRouteProp = RouteProp<RootStackParamList, 'AddReview'>;

// Wizard Steps Configuration
const STEPS = [
  {
    id: 'best_for' as const,
    title: 'What did you like?',
    subtitle: 'Tap the highlights.',
    theme: 'positive',
    limit: 5,
    gradient: ['#E0F2FE', '#FFFFFF'] as const,
    accent: '#0A84FF', // Apple Blue
    solidColor: '#E0F2FE',
  },
  {
    id: 'vibe' as const,
    title: 'How's the vibe?',
    subtitle: 'Set the scene.',
    theme: 'vibe',
    limit: 5,
    gradient: ['#F3E8FF', '#FFFFFF'] as const,
    accent: '#8E8E93', // Gray
    solidColor: '#F3E8FF',
  },
  {
    id: 'heads_up' as const,
    title: 'Any heads up?',
    subtitle: 'Help others prepare.',
    theme: 'negative',
    limit: 2,
    gradient: ['#FEE2E2', '#FFFFFF'] as const,
    accent: '#FF9500', // Orange
    solidColor: '#FEE2E2',
  }
] as const;

type StepId = typeof STEPS[number]['id'];

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
  
  // Dynamic signals from database
  const [signals, setSignals] = useState<SignalsByCategory>({
    best_for: [],
    vibe: [],
    heads_up: [],
  });

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Load signals and existing review
  useEffect(() => {
    loadData();
  }, [placeId]);

  const loadData = async () => {
    if (!placeId) {
      setIsLoading(false);
      return;
    }

    try {
      // Load signals for this place (based on its category)
      const placeSignals = await fetchSignalsForPlace(placeId);
      setSignals(placeSignals);

      // Load existing review if any
      const { review, signals: existingSignals } = await fetchUserReview(placeId);
      
      if (review) {
        setExistingReviewId(review.id);
        const counts: { [key: string]: number } = {};
        existingSignals.forEach(signal => {
          counts[signal.signalId] = signal.intensity;
        });
        setTapCounts(counts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTap = (signalId: string) => {
    const currentCount = tapCounts[signalId] || 0;
    
    // Get current step's signals
    const currentSignals = signals[currentStep.id];
    const currentSignalIds = currentSignals.map(s => s.id);
    
    // Calculate how many items are currently selected in this category
    const currentCategorySelectionCount = Object.keys(tapCounts).filter(
      key => currentSignalIds.includes(key) && tapCounts[key] > 0
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

    const reviewSignals: ReviewSignalTap[] = Object.entries(tapCounts).map(([signalId, intensity]) => ({
      signalId,
      intensity,
    }));

    let result;
    if (existingReviewId) {
      result = await updateReview(existingReviewId, placeId, reviewSignals, '', '');
    } else {
      result = await submitReview(placeId, placeName, reviewSignals, '', '');
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
        <Text style={styles.loadingText}>Loading signals...</Text>
      </View>
    );
  }

  // Get signals for current step
  const currentSignals: Signal[] = signals[currentStep.id] || [];

  // Check if there are any signals to show
  const hasSignals = currentSignals.length > 0;

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
            {hasSignals ? (
              <View style={styles.grid}>
                {currentSignals.map(signal => (
                  <PulseCard
                    key={signal.id}
                    label={signal.label}
                    icon={signal.icon_emoji}
                    intensity={tapCounts[signal.id] || 0}
                    onTap={() => handleTap(signal.id)}
                    theme={currentStep.theme as any}
                    disabled={false}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  No signals available for this category yet.
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap "Next" to continue.
                </Text>
              </View>
            )}
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
    minHeight: 200,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
    backgroundColor: '#FFF1F2',
    borderColor: '#F43F5E',
    borderWidth: 2,
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
    color: '#991B1B',
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