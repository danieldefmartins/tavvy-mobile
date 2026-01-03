import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCheckInTypes } from './businessTypeConfig';

interface CheckIn {
  id: string;
  type: string; // Check-in type ID (e.g., 'stayed_here', 'dined_here', 'visited')
  note?: string;
  created_at: string;
  user_name: string;
  is_trusted: boolean;
}

interface EasyCheckProps {
  placeId: string;
  businessType: string; // NEW: Business type for dynamic check-in types
  onSubmit: (type: string, note?: string) => Promise<void>;
  onDelete: (checkinId: string) => Promise<void>;
  checkins: CheckIn[];
  isLoading: boolean;
  currentUserId?: string;
}

// Check-in types now loaded dynamically based on business type

export default function EasyCheck({ 
  placeId,
  businessType,
  onSubmit, 
  onDelete, 
  checkins, 
  isLoading,
  currentUserId 
}: EasyCheckProps) {
  // Get check-in types based on business type
  const checkTypes = getCheckInTypes(businessType);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTypeSelect = (type: string) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    try {
      setSubmitting(true);
      await onSubmit(selectedType, note.trim() || undefined);
      setSelectedType(null);
      setNote('');
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (checkinId: string) => {
    try {
      await onDelete(checkinId);
    } catch (error) {
      console.error('Failed to delete check-in:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCheckTypeLabel = (type: string) => {
    return checkTypes.find(t => t.id === type)?.label || type;
  };

  const getCheckTypeColor = (type: string) => {
    return checkTypes.find(t => t.id === type)?.color || '#6b7280';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Easy Check</Text>
      <Text style={styles.subtitle}>Help others by sharing your experience</Text>

      {/* Check-in Type Buttons */}
      <View style={styles.typeButtons}>
        {checkTypes.map((checkType) => {
          const isSelected = selectedType === checkType.id;
          return (
            <TouchableOpacity
              key={checkType.id}
              style={[
                styles.typeButton,
                isSelected && { 
                  backgroundColor: checkType.color,
                  borderColor: checkType.color,
                }
              ]}
              onPress={() => handleTypeSelect(checkType.id)}
            >
              <Ionicons 
                name={checkType.icon as any}
                size={20} 
                color={isSelected ? '#fff' : checkType.color} 
              />
              <Text style={[
                styles.typeButtonText,
                isSelected && styles.typeButtonTextActive
              ]}>
                {checkType.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Note Input (shown when type selected) */}
      {selectedType && (
        <View style={styles.noteContainer}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Check-ins */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : checkins.length > 0 ? (
        <View style={styles.checkinsContainer}>
          <Text style={styles.checkinsTitle}>Recent Check-ins</Text>
          <ScrollView style={styles.checkinsList} nestedScrollEnabled>
            {checkins.map((checkin) => (
              <View key={checkin.id} style={styles.checkinItem}>
                <View style={styles.checkinHeader}>
                  <View style={styles.checkinUserInfo}>
                    <Text style={styles.checkinUserName}>
                      {checkin.user_name}
                      {checkin.is_trusted && (
                        <Ionicons name="shield-checkmark" size={14} color="#10b981" style={{ marginLeft: 4 }} />
                      )}
                    </Text>
                    <Text style={styles.checkinTime}>{getTimeAgo(checkin.created_at)}</Text>
                  </View>
                  {currentUserId && (
                    <TouchableOpacity
                      onPress={() => handleDelete(checkin.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[
                  styles.checkinTypeBadge,
                  { backgroundColor: `${getCheckTypeColor(checkin.type)}15` }
                ]}>
                  <Text style={[
                    styles.checkinTypeText,
                    { color: getCheckTypeColor(checkin.type) }
                  ]}>
                    {getCheckTypeLabel(checkin.type)}
                  </Text>
                </View>
                {checkin.note && (
                  <Text style={styles.checkinNote}>{checkin.note}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.noCheckinsText}>
          No check-ins yet. Be the first!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  noteContainer: {
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  checkinsContainer: {
    marginTop: 8,
  },
  checkinsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  checkinsList: {
    maxHeight: 300,
  },
  checkinItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkinUserInfo: {
    flex: 1,
  },
  checkinUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  checkinTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
  checkinTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  checkinTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkinNote: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCheckinsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});