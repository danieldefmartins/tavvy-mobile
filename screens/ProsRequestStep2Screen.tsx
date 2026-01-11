import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  categoryId: string;
  categoryName: string;
  description?: string;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep2Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { categoryId, categoryName, description } = route.params;
  
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  const timelines = [
    { id: 'urgent', label: 'Emergency / ASAP', sublabel: 'Within 24 hours', icon: 'alert-circle' },
    { id: 'this-week', label: 'This week', sublabel: 'Within 7 days', icon: 'calendar' },
    { id: 'this-month', label: 'This month', sublabel: 'Within 30 days', icon: 'calendar-outline' },
    { id: 'flexible', label: 'Flexible', sublabel: 'No rush, just planning', icon: 'time' },
  ];

  const handleNext = () => {
    if (!selectedTimeline) return;
    
    navigation.navigate('ProsRequestStep3', {
      categoryId,
      categoryName,
      description,
      timeline: selectedTimeline,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={50} />
        <Text style={styles.stepText}>Step 2 of 4</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>When do you need this done?</Text>
        <Text style={styles.subtext}>Select your preferred timeline</Text>

        <View style={styles.optionsList}>
          {timelines.map((timeline) => (
            <TouchableOpacity
              key={timeline.id}
              style={[
                styles.optionCard,
                selectedTimeline === timeline.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedTimeline(timeline.id)}
            >
              <View
                style={[
                  styles.optionIcon,
                  selectedTimeline === timeline.id && styles.optionIconSelected,
                ]}
              >
                <Ionicons
                  name={timeline.icon as any}
                  size={24}
                  color={selectedTimeline === timeline.id ? '#FFFFFF' : ProsColors.primary}
                />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    selectedTimeline === timeline.id && styles.optionLabelSelected,
                  ]}
                >
                  {timeline.label}
                </Text>
                <Text style={styles.optionSublabel}>{timeline.sublabel}</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedTimeline === timeline.id && styles.radioOuterSelected,
                ]}
              >
                {selectedTimeline === timeline.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedTimeline && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedTimeline}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  progressWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ProsColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    width: 40,
    textAlign: 'right',
  },
  stepText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: ProsColors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: ProsColors.primary,
  },
  optionSublabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: ProsColors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ProsColors.primary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: ProsColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
