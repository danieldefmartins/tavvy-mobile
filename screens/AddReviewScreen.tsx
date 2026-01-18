'''import { StatusBar } from 'expo-status-bar';
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
  Dimensions,
  useColorScheme
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  AddReview: { 
    placeId?: string; 
    placeName?: string;
    primaryCategory?: string;
    subcategory?: string;
  };
};

type AddReviewRouteProp = RouteProp<RootStackParamList, 'AddReview'>;

// ============================================
// DARK MODE THEME
// ============================================
const darkTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  border: '#38383A',
  // Step-specific backgrounds (dark mode)
  stepBackgrounds: {
    best_for: '#0A1628',
    vibe: '#1A1A2E',
    heads_up: '#1F1410',
  },
};

const lightTheme = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F2F2F7',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E5EA',
  // Step-specific backgrounds (light mode)
  stepBackgrounds: {
    best_for: '#E0F2FE',
    vibe: '#F3E8FF',
    heads_up: '#FEE2E2',
  },
};

export default function AddReviewScreen() {
  const { t } = useTranslation();

  const STEPS = [
    {
      id: 'best_for' as const,
      title: t('signals.theGood'),
      subtitle: 'What did you like? Tap the highlights.',
      theme: 'positive',
      limit: 5,
      accent: '#0A84FF', // Apple Blue
      icon: 'thumbs-up',
    },
    {
      id: 'vibe' as const,
      title: t('signals.theVibe'),
      subtitle: "How's the atmosphere? Set the scene.",
      theme: 'vibe',
      limit: 5,
      accent: '#8B5CF6', // Purple
      icon: 'sparkles',
    },
    {
      id: 'heads_up' as const,
      title: t('signals.watchOut'),
      subtitle: 'Any warnings? Help others prepare.',
      theme: 'negative',
      limit: 2,
      accent: '#FF9500', // Orange
      icon: 'warning',
    }
  ] as const;

  type StepId = typeof STEPS[number]['id'];

  const route = useRoute<AddReviewRouteProp>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName || t('places.thisPlace');
  const primaryCategory = route.params?.primaryCategory;
  const subcategory = route.params?.subcategory;

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

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.stepBackgrounds[currentStep.id],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.textSecondary,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    stepIndicator: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    stepTitle: {
      fontSize: 34,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 18,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    cardSurface: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 16,
      minHeight: 200,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 20,
      elevation: 5,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.border,
    },
    emptyStateText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center',
    },
    warningBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      borderColor: '#F43F5E',
      borderWidth: 2,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      alignItems: 'center',
    },
    warningText: {
      flex: 1,
      marginLeft: 12,
      color: isDark ? '#FCA5A5' : '#991B1B',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    placeName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 4,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    categoryBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginLeft: 6,
    },
    signalCount: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 8,
    },
    progressBar: {
      height: 4,
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 2,
      marginBottom: 4,
      overflow: 'hidden',
    },
  }), [theme, currentStep.id, isDark]);

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
      Alert.alert(t('common.limitReached'), t('common.limitReachedMessage', { limit: currentStep.limit }));
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
      Alert.alert(t('reviews.emptyReview'), t('reviews.emptyReviewMessage'));
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
        t('success.success'),
        t('reviews.reviewSuccessMessage', { placeName }),
        [
          { text: t('common.done'), onPress: () => navigation.goBack() },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        t('errors.somethingWentWrong'),
        result.error || t('errors.unknownError'),
        [{ text: t('common.retry'), onPress: handleSubmit }, { text: t('common.cancel'), style: 'cancel' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={dynamicStyles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const currentSignals = signals[currentStep.id];

  return (
    <View style={dynamicStyles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={dynamicStyles.backButton}>
            <Ionicons name={currentStepIndex > 0 ? 'arrow-back' : 'close'} size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={dynamicStyles.stepIndicator}>
              {t('common.step', { current: currentStepIndex + 1, total: STEPS.length })}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                backgroundColor: currentStep.accent,
              }]} />
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={dynamicStyles.placeName}>{placeName}</Text>
            <View style={styles.titleRow}>
              <View style={[styles.stepIconContainer, { backgroundColor: currentStep.accent }]}>
                <Ionicons name={currentStep.icon} size={20} color="white" />
              </View>
              <Text style={dynamicStyles.stepTitle}>{currentStep.title}</Text>
            </View>
            <Text style={dynamicStyles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>

          {/* Signals Grid */}
          {currentSignals.length > 0 ? (
            <View style={styles.grid}>
              {currentSignals.map((signal) => (
                <PulseCard 
                  key={signal.id} 
                  signal={signal} 
                  onTap={() => handleTap(signal.id)}
                  tapCount={tapCounts[signal.id] || 0}
                  theme={theme}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
              <Text style={dynamicStyles.emptyStateText}>{t('signals.noSignalsFound')}</Text>
              <Text style={dynamicStyles.emptyStateSubtext}>{t('signals.noSignalsFoundMessage')}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {!isLastStep && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => setCurrentStepIndex(prev => prev + 1)}
            >
              <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
                {t('common.skip')}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: currentStep.accent }]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>
                  {isLastStep ? t('reviews.submitReview') : t('common.next')}
                </Text>
                {!isLastStep && (
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
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
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
'''
