/**
 * Pros Project Status Screen
 * Install path: screens/ProsProjectStatusScreen.tsx
 * 
 * Allows customers to track the status of their service requests
 * and view responses from pros.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  ProsProjectStatusScreen: {
    projectId?: number;
    projectTitle?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Mock data for demonstration - replace with actual API calls
type ProResponse = {
  id: number;
  proName: string;
  proImage: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  lowEstimate: number;
  highEstimate: number;
  pitch: string;
  availability: string;
  responseTime: string;
};

type ProjectStatus = {
  id: number;
  title: string;
  status: 'pending' | 'matching' | 'responses' | 'hired' | 'completed';
  timeline: string;
  budget: string;
  prosRequested: number;
  prosResponded: number;
  createdAt: string;
  responses: ProResponse[];
};

// Status step configuration
const STATUS_STEPS = [
  { key: 'pending', label: 'Request Sent', icon: 'paper-plane' },
  { key: 'matching', label: 'Finding Pros', icon: 'search' },
  { key: 'responses', label: 'Reviewing Quotes', icon: 'documents' },
  { key: 'hired', label: 'Pro Hired', icon: 'checkmark-circle' },
];

export default function ProsProjectStatusScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsProjectStatusScreen'>>();
  const { projectId, projectTitle } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [project, setProject] = useState<ProjectStatus | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    loadProjectStatus();
  }, [projectId]);

  const loadProjectStatus = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProject({
        id: projectId || 1,
        title: projectTitle || 'Kitchen Lighting Installation',
        status: 'responses',
        timeline: 'Within 1 week',
        budget: '$500 - $1,000',
        prosRequested: 3,
        prosResponded: 2,
        createdAt: new Date().toISOString(),
        responses: [
          {
            id: 1,
            proName: 'Mike\'s Electric',
            proImage: null,
            rating: 4.9,
            reviewCount: 127,
            isVerified: true,
            lowEstimate: 450,
            highEstimate: 650,
            pitch: 'Hi! I\'ve done over 200 kitchen lighting projects. I can come by tomorrow for a free estimate and have this done within 3 days.',
            availability: 'Available tomorrow',
            responseTime: '2 hours ago',
          },
          {
            id: 2,
            proName: 'Bright Solutions LLC',
            proImage: null,
            rating: 4.7,
            reviewCount: 89,
            isVerified: true,
            lowEstimate: 500,
            highEstimate: 750,
            pitch: 'Hello! I specialize in modern kitchen lighting. Happy to discuss options that fit your budget and style.',
            availability: 'Available this week',
            responseTime: '5 hours ago',
          },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjectStatus();
    setRefreshing(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewProfile = (proId: number) => {
    navigation.navigate('ProsProfileScreen', { id: proId });
  };

  const handleMessage = (proId: number, proName: string) => {
    navigation.navigate('ProsMessagesScreen', { proId, proName });
  };

  const handleInviteMore = () => {
    // Navigate to invite more pros flow
    navigation.navigate('ProsRequestStep1Screen', {
      projectTitle: project?.title,
    });
  };

  const getStatusIndex = (status: string): number => {
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.loadingText}>Loading project status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={ProsColors.textMuted} />
          <Text style={styles.errorText}>Project not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = getStatusIndex(project.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Title Card */}
        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <View style={styles.projectMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={ProsColors.textSecondary} />
              <Text style={styles.metaText}>{project.timeline}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color={ProsColors.textSecondary} />
              <Text style={styles.metaText}>{project.budget}</Text>
            </View>
          </View>
        </View>

        {/* Status Progress */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusSteps}>
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <View key={step.key} style={styles.statusStep}>
                  <View style={styles.statusStepLeft}>
                    <View style={[
                      styles.statusDot,
                      isCompleted && styles.statusDotCompleted,
                      isCurrent && styles.statusDotCurrent,
                    ]}>
                      {isCompleted && (
                        <Ionicons
                          name={isCurrent ? step.icon as any : 'checkmark'}
                          size={14}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[
                        styles.statusLine,
                        isCompleted && styles.statusLineCompleted,
                      ]} />
                    )}
                  </View>
                  <View style={styles.statusStepContent}>
                    <Text style={[
                      styles.statusStepLabel,
                      isCompleted && styles.statusStepLabelCompleted,
                      isCurrent && styles.statusStepLabelCurrent,
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.statusStepSubtext}>
                        {project.prosResponded} of {project.prosRequested} pros responded
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pro Responses */}
        <View style={styles.responsesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pro Responses</Text>
            <Text style={styles.responseCount}>
              {project.prosResponded}/{project.prosRequested}
            </Text>
          </View>

          {project.responses.length > 0 ? (
            project.responses.map((response) => (
              <View key={response.id} style={styles.responseCard}>
                {/* Pro Header */}
                <View style={styles.responseHeader}>
                  <View style={styles.proInfo}>
                    {response.proImage ? (
                      <Image source={{ uri: response.proImage }} style={styles.proAvatar} />
                    ) : (
                      <View style={[styles.proAvatar, styles.proAvatarPlaceholder]}>
                        <Ionicons name="person" size={20} color={ProsColors.textMuted} />
                      </View>
                    )}
                    <View style={styles.proDetails}>
                      <View style={styles.proNameRow}>
                        <Text style={styles.proName}>{response.proName}</Text>
                        {response.isVerified && (
                          <Ionicons name="checkmark-circle" size={16} color={ProsColors.primary} />
                        )}
                      </View>
                      <View style={styles.proRating}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.proRatingText}>
                          {response.rating} ({response.reviewCount} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.responseTime}>{response.responseTime}</Text>
                </View>

                {/* Estimate */}
                <View style={styles.estimateContainer}>
                  <Text style={styles.estimateLabel}>Estimated Price</Text>
                  <Text style={styles.estimateValue}>
                    ${response.lowEstimate} - ${response.highEstimate}
                  </Text>
                </View>

                {/* Pitch */}
                <Text style={styles.pitchText}>{response.pitch}</Text>

                {/* Availability */}
                <View style={styles.availabilityRow}>
                  <Ionicons name="calendar-outline" size={16} color={ProsColors.primary} />
                  <Text style={styles.availabilityText}>{response.availability}</Text>
                </View>

                {/* Actions */}
                <View style={styles.responseActions}>
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => handleViewProfile(response.id)}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => handleMessage(response.id, response.proName)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noResponsesContainer}>
              <Ionicons name="hourglass-outline" size={48} color={ProsColors.textMuted} />
              <Text style={styles.noResponsesTitle}>Waiting for responses</Text>
              <Text style={styles.noResponsesText}>
                We're reaching out to pros in your area. You'll be notified when they respond.
              </Text>
            </View>
          )}

          {/* Invite More Button */}
          {project.prosResponded < project.prosRequested && (
            <TouchableOpacity style={styles.inviteMoreButton} onPress={handleInviteMore}>
              <Ionicons name="add-circle-outline" size={20} color={ProsColors.primary} />
              <Text style={styles.inviteMoreText}>Invite More Pros</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  responseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  statusSteps: {
    gap: 0,
  },
  statusStep: {
    flexDirection: 'row',
    minHeight: 50,
  },
  statusStepLeft: {
    width: 32,
    alignItems: 'center',
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotCompleted: {
    backgroundColor: ProsColors.primary,
  },
  statusDotCurrent: {
    backgroundColor: ProsColors.primary,
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: ProsColors.border,
    marginVertical: 4,
  },
  statusLineCompleted: {
    backgroundColor: ProsColors.primary,
  },
  statusStepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  statusStepLabel: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  statusStepLabelCompleted: {
    color: ProsColors.textPrimary,
    fontWeight: '500',
  },
  statusStepLabelCurrent: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  statusStepSubtext: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 4,
  },
  responsesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  responseCard: {
    borderWidth: 1,
    borderColor: ProsColors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  proAvatarPlaceholder: {
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proDetails: {
    flex: 1,
  },
  proNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proName: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  proRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  proRatingText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  responseTime: {
    fontSize: 12,
    color: ProsColors.textMuted,
  },
  estimateContainer: {
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  estimateLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  pitchText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 13,
    color: ProsColors.primary,
    fontWeight: '500',
  },
  responseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProfileButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ProsColors.primary,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: ProsColors.primary,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResponsesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResponsesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  noResponsesText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inviteMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ProsColors.primary,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  inviteMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
