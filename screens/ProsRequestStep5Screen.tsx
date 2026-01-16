import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useProsLeads } from '../hooks/usePros';

type RouteParams = {
  categoryId: string;
  categoryName: string;
  description?: string;
  photos?: string[];
  timeline: string;
  budget: string;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep5Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { categoryId, categoryName, description, photos, timeline, budget } = route.params;
  
  const [selectedProCount, setSelectedProCount] = useState<number>(3);
  const { createLead, loading: isSubmitting } = useProsLeads();

  const proCountOptions = [1, 2, 3, 4, 5];

  const handleSubmit = async () => {
    try {
      const lead = await createLead({
        categoryId: parseInt(categoryId),
        title: `${categoryName} Request`,
        description: description || `Request for ${categoryName} service.`,
        preferredDate: timeline,
        budget: budget,
      } as any);

      Alert.alert('Success', 'Your request has been submitted successfully!');
      
      navigation.reset({
        index: 0,
        routes: [
          { name: 'ProsHome' },
          { 
            name: 'ProsProjectStatus', 
            params: { 
              projectId: lead.id,
              categoryName,
              timeline,
              budget,
              proCount: selectedProCount,
            } 
          },
        ],
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    }
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
        <ProgressBar progress={100} />
        <Text style={styles.stepText}>Step 5 of 5</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>How many pros do you want quotes from?</Text>
        <Text style={styles.subtext}>We'll match you with top-rated professionals</Text>
        <View style={styles.proCountContainer}>
          {proCountOptions.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.proCountButton,
                selectedProCount === count && styles.proCountButtonSelected,
              ]}
              onPress={() => setSelectedProCount(count)}
            >
              <Text
                style={[
                  styles.proCountText,
                  selectedProCount === count && styles.proCountTextSelected,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Request Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="construct" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{categoryName}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="time" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Timeline</Text>
              <Text style={styles.summaryValue}>{timeline}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="wallet" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{budget}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="people" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Quotes requested</Text>
              <Text style={styles.summaryValue}>{selectedProCount} pros</Text>
            </View>
          </View>
          {description && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="document-text" size={18} color={ProsColors.primary} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Description</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{description}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          By submitting, you agree to receive quotes from service professionals.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  progressWrapper: { paddingHorizontal: 20, paddingVertical: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#10B981', width: 40, textAlign: 'right' },
  stepText: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  content: { flex: 1, paddingHorizontal: 20 },
  question: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtext: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  proCountContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  proCountButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  proCountButtonSelected: { backgroundColor: '#EFF6FF', borderColor: ProsColors.primary },
  proCountText: { fontSize: 20, fontWeight: '600', color: '#6B7280' },
  proCountTextSelected: { color: ProsColors.primary },
  summaryCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryContent: { flex: 1 },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: '500', color: '#111827' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  submitButtonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
});
