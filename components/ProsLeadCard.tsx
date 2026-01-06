/**
 * Pros Lead Card Component (for Pro Dashboard)
 * Install path: components/ProsLeadCard.tsx
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors, PROS_LEAD_STATUSES } from '../constants/ProsConfig';
import { ProLead } from '../lib/ProsTypes';

interface ProsLeadCardProps {
  lead: ProLead;
  onPress: (lead: ProLead) => void;
  onStatusChange?: (leadId: number, status: string) => void;
  onMessagePress?: (lead: ProLead) => void;
}

export const ProsLeadCard: React.FC<ProsLeadCardProps> = ({
  lead,
  onPress,
  onStatusChange,
  onMessagePress,
}) => {
  const statusConfig = PROS_LEAD_STATUSES.find(s => s.value === lead.status) || PROS_LEAD_STATUSES[0];
  const createdDate = new Date(lead.createdAt);
  const isNew = lead.status === 'new';

  return (
    <TouchableOpacity
      style={[styles.card, isNew && styles.cardNew]}
      onPress={() => onPress(lead)}
      activeOpacity={0.7}
    >
      {isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.userInfo}>
          {lead.user?.avatarUrl ? (
            <Image source={{ uri: lead.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={ProsColors.textMuted} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{lead.user?.name || 'Customer'}</Text>
            <Text style={styles.date}>
              {createdDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{lead.title}</Text>
      
      {lead.description && (
        <Text style={styles.description} numberOfLines={2}>
          {lead.description}
        </Text>
      )}

      <View style={styles.details}>
        {lead.city && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color={ProsColors.textSecondary} />
            <Text style={styles.detailText}>
              {lead.city}, {lead.state}
            </Text>
          </View>
        )}
        {lead.budget && (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={ProsColors.textSecondary} />
            <Text style={styles.detailText}>{lead.budget}</Text>
          </View>
        )}
        {lead.preferredDate && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={ProsColors.textSecondary} />
            <Text style={styles.detailText}>
              {new Date(lead.preferredDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onMessagePress && (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => onMessagePress(lead)}
          >
            <Ionicons name="chatbubble-outline" size={16} color={ProsColors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        )}
        {lead.phone && (
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={16} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Compact version for lists
export const ProsLeadCardCompact: React.FC<ProsLeadCardProps> = ({
  lead,
  onPress,
}) => {
  const statusConfig = PROS_LEAD_STATUSES.find(s => s.value === lead.status) || PROS_LEAD_STATUSES[0];
  const isNew = lead.status === 'new';

  return (
    <TouchableOpacity
      style={[styles.compactCard, isNew && styles.cardNew]}
      onPress={() => onPress(lead)}
      activeOpacity={0.7}
    >
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle} numberOfLines={1}>{lead.title}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
      </View>
      <View style={styles.compactFooter}>
        <Text style={styles.compactUser}>{lead.user?.name || 'Customer'}</Text>
        <Text style={styles.compactDate}>
          {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  cardNew: {
    borderColor: ProsColors.primary,
    borderWidth: 2,
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ProsColors.sectionBg,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ProsColors.primary,
  },
  messageButtonText: {
    color: ProsColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: ProsColors.primary,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Compact styles
  compactCard: {
    backgroundColor: ProsColors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactUser: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  compactDate: {
    fontSize: 12,
    color: ProsColors.textMuted,
  },
});

export default ProsLeadCard;
