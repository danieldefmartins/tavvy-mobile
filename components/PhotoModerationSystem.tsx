// ============================================
// PHOTO MODERATION SYSTEM FOR TAVVY
// Free/Open-Source Solution using NSFW.js + Community Reporting
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// TYPES
// ============================================

interface PhotoReportModalProps {
  visible: boolean;
  onClose: () => void;
  photoId: string;
  photoUrl: string;
}

type ReportReason = 
  | 'nudity'
  | 'violence'
  | 'spam'
  | 'offensive'
  | 'copyright'
  | 'wrong_place'
  | 'other';

interface ReportOption {
  id: ReportReason;
  label: string;
  icon: string;
  description: string;
}

// ============================================
// REPORT OPTIONS
// ============================================

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'nudity',
    label: 'Nudity or Sexual Content',
    icon: 'eye-off',
    description: 'Contains inappropriate nudity or sexual content',
  },
  {
    id: 'violence',
    label: 'Violence or Gore',
    icon: 'warning',
    description: 'Shows violent or graphic content',
  },
  {
    id: 'spam',
    label: 'Spam or Misleading',
    icon: 'megaphone',
    description: 'Promotional content or unrelated to the place',
  },
  {
    id: 'offensive',
    label: 'Hate Speech or Harassment',
    icon: 'hand-left',
    description: 'Contains hateful or harassing content',
  },
  {
    id: 'copyright',
    label: 'Copyright Violation',
    icon: 'document-lock',
    description: 'Uses copyrighted material without permission',
  },
  {
    id: 'wrong_place',
    label: 'Wrong Place',
    icon: 'location',
    description: 'Photo is not of this place',
  },
  {
    id: 'other',
    label: 'Other Issue',
    icon: 'flag',
    description: 'Another issue not listed above',
  },
];

// ============================================
// PHOTO REPORT MODAL COMPONENT
// ============================================

export const PhotoReportModal: React.FC<PhotoReportModalProps> = ({
  visible,
  onClose,
  photoId,
  photoUrl,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select why you are reporting this photo.');
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please log in to report photos.');
      return;
    }

    setSubmitting(true);

    try {
      // Check if user already reported this photo
      const { data: existingReport } = await supabase
        .from('photo_reports')
        .select('id')
        .eq('photo_id', photoId)
        .eq('reporter_id', user.id)
        .single();

      if (existingReport) {
        Alert.alert('Already Reported', 'You have already reported this photo. Our team is reviewing it.');
        onClose();
        return;
      }

      // Submit the report
      const { error: reportError } = await supabase
        .from('photo_reports')
        .insert({
          photo_id: photoId,
          reporter_id: user.id,
          reason: selectedReason,
          status: 'pending',
        });

      if (reportError) throw reportError;

      // Check total reports for this photo
      const { count } = await supabase
        .from('photo_reports')
        .select('id', { count: 'exact' })
        .eq('photo_id', photoId);

      // Auto-hide photo if it has 3+ reports (configurable threshold)
      const REPORT_THRESHOLD = 3;
      if (count && count >= REPORT_THRESHOLD) {
        await supabase
          .from('place_photos')
          .update({ 
            is_flagged: true,
            flag_reason: 'Multiple user reports',
          })
          .eq('id', photoId);
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep TavvY safe. Our team will review this photo.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      console.error('Report error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
      setSelectedReason(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Report Photo</Text>
          <Text style={styles.modalSubtitle}>
            Why are you reporting this photo?
          </Text>

          <View style={styles.reportOptions}>
            {REPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.reportOption,
                  selectedReason === option.id && styles.reportOptionSelected,
                ]}
                onPress={() => setSelectedReason(option.id)}
              >
                <View style={[
                  styles.reportIconContainer,
                  selectedReason === option.id && styles.reportIconSelected,
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={selectedReason === option.id ? '#fff' : '#666'} 
                  />
                </View>
                <View style={styles.reportTextContainer}>
                  <Text style={[
                    styles.reportLabel,
                    selectedReason === option.id && styles.reportLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {selectedReason === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReport}
              disabled={!selectedReason || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================
// REPORT BUTTON COMPONENT (for photo gallery)
// ============================================

interface ReportButtonProps {
  photoId: string;
  photoUrl: string;
  style?: object;
}

export const ReportPhotoButton: React.FC<ReportButtonProps> = ({
  photoId,
  photoUrl,
  style,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.reportButton, style]}
        onPress={() => setShowReportModal(true)}
      >
        <Ionicons name="flag-outline" size={20} color="#fff" />
      </TouchableOpacity>

      <PhotoReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        photoId={photoId}
        photoUrl={photoUrl}
      />
    </>
  );
};

// ============================================
// PHOTO VALIDATION UTILITIES (Client-side checks)
// ============================================

export const validatePhotoBeforeUpload = async (
  fileUri: string,
  fileSize: number,
  mimeType: string
): Promise<{ valid: boolean; error?: string }> => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and HEIC images are allowed.' };
  }

  // Check file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (fileSize > MAX_SIZE) {
    return { valid: false, error: 'Photo must be smaller than 10MB.' };
  }

  // Additional checks can be added here
  // - Image dimensions
  // - Aspect ratio
  // - etc.

  return { valid: true };
};

// ============================================
// SMART PHOTO SELECTION FOR HERO CAROUSEL
// ============================================

interface PhotoWithScore {
  id: string;
  url: string;
  score: number;
  is_cover: boolean;
  likes_count: number;
  created_at: string;
}

export const selectBestPhotosForHero = (
  photos: PhotoWithScore[],
  maxPhotos: number = 5
): PhotoWithScore[] => {
  // Score each photo
  const scoredPhotos = photos
    .filter(photo => !photo.is_flagged) // Exclude flagged photos
    .map(photo => {
      let score = 0;

      // Cover photo gets highest priority
      if (photo.is_cover) score += 100;

      // Likes boost score
      score += (photo.likes_count || 0) * 5;

      // Recency bonus (photos from last 30 days get bonus)
      const daysSinceUpload = Math.floor(
        (Date.now() - new Date(photo.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 30 - daysSinceUpload);

      return { ...photo, score };
    });

  // Sort by score descending and take top N
  return scoredPhotos
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPhotos);
};

// ============================================
// DATABASE SCHEMA (Run in Supabase SQL Editor)
// ============================================

/*
-- Add moderation columns to place_photos table
ALTER TABLE place_photos ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE place_photos ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE place_photos ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE place_photos ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create photo_reports table
CREATE TABLE IF NOT EXISTS photo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES place_photos(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photo_reports_photo_id ON photo_reports(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reports_status ON photo_reports(status);
CREATE INDEX IF NOT EXISTS idx_place_photos_flagged ON place_photos(is_flagged);

-- Create photo_likes table for engagement tracking
CREATE TABLE IF NOT EXISTS photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES place_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE place_photos SET likes_count = likes_count + 1 WHERE id = NEW.photo_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE place_photos SET likes_count = likes_count - 1 WHERE id = OLD.photo_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes count
DROP TRIGGER IF EXISTS photo_likes_count_trigger ON photo_likes;
CREATE TRIGGER photo_likes_count_trigger
AFTER INSERT OR DELETE ON photo_likes
FOR EACH ROW EXECUTE FUNCTION update_photo_likes_count();

-- Row Level Security (RLS) policies
ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can create a report (if logged in)
CREATE POLICY "Users can create reports" ON photo_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can only see their own reports
CREATE POLICY "Users can view own reports" ON photo_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Anyone can like photos
CREATE POLICY "Users can like photos" ON photo_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can unlike photos" ON photo_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Anyone can see likes
CREATE POLICY "Anyone can view likes" ON photo_likes
  FOR SELECT USING (true);
*/

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  reportOptions: {
    marginBottom: 20,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportIconSelected: {
    backgroundColor: '#007AFF',
  },
  reportTextContainer: {
    flex: 1,
  },
  reportLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reportLabelSelected: {
    color: '#007AFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  reportButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});