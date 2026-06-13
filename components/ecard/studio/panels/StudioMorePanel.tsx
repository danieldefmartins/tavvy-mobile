/**
 * StudioMorePanel — More Options tab content for Card Studio bottom sheet.
 *
 * Contains: card URL/slug, visibility, QR code, share, advanced settings,
 * civic fields (if civic template), mobile business fields (if mobile-business),
 * professional badges (if pro template).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
  StyleSheet,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import StudioField from './shared/StudioField';
import StudioGroup from './shared/StudioGroup';
import StudioToggleRow from './shared/StudioToggleRow';
import StudioSettingsRow from './shared/StudioSettingsRow';

// Conditional section components (reused from existing editor)
import CivicSection from '../../editor/sections/CivicSection';
import MobileBusinessSection from '../../editor/sections/MobileBusinessSection';
import AdvancedSection from '../../editor/sections/AdvancedSection';

const AMBER = '#FF9F0A';

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioMorePanelProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioMorePanel({ isDark, isPro }: StudioMorePanelProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [showQR, setShowQR] = useState(false);

  if (!card) return null;

  const set = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const templateId = card.template_id || 'basic';
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate =
    templateId.startsWith('pro-') ||
    templateId === 'business-card' ||
    templateId === 'cover-card';

  const cardUrl = `https://tavvy.com/${card.slug || 'preview'}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ url: cardUrl });
      } else {
        await Share.share({ message: cardUrl });
      }
    } catch {
      // User cancelled
    }
  };

  const handleCopyUrl = () => {
    Clipboard.setString(cardUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Card URL copied to clipboard');
  };

  return (
    <View style={styles.container}>
      {/* Card URL & Sharing */}
      <StudioGroup title="Card URL & Sharing">
        <StudioField
          label="Card URL Slug"
          value={card.slug || ''}
          onChange={(v) => set('slug', v)}
          placeholder="your-card-name"
        />
        <StudioSettingsRow
          icon="link"
          label="Card URL"
          value={cardUrl}
          onPress={handleCopyUrl}
        />
        <StudioSettingsRow
          icon="qr-code"
          label="QR Code"
          onPress={() => setShowQR(true)}
        />
        <StudioSettingsRow
          icon="share"
          label="Share Card"
          onPress={handleShare}
          isLast
        />
      </StudioGroup>

      {/* Visibility */}
      <StudioGroup title="Visibility">
        <StudioToggleRow
          label="Published"
          value={card.is_published !== false}
          onChange={(v) => set('is_published', v)}
        />
        <StudioToggleRow
          label="Active"
          value={card.is_active !== false}
          onChange={(v) => set('is_active', v)}
          isLast
        />
      </StudioGroup>

      {/* Civic Fields (conditional) */}
      {isCivic && (
        <View style={styles.conditionalSection}>
          <CivicSection isDark={true} isPro={isPro} />
        </View>
      )}

      {/* Mobile Business Fields (conditional) */}
      {isMobileBiz && (
        <View style={styles.conditionalSection}>
          <MobileBusinessSection isDark={true} isPro={isPro} />
        </View>
      )}

      {/* Advanced / Pro Fields (conditional) */}
      {isProTemplate && (
        <View style={styles.conditionalSection}>
          <AdvancedSection isDark={true} isPro={isPro} />
        </View>
      )}

      {/* Danger Zone */}
      <StudioGroup title="Danger Zone">
        <StudioSettingsRow
          icon="trash"
          label="Delete Card"
          destructive
          onPress={() => {
            Alert.alert(
              'Delete Card',
              'Are you sure you want to delete this card? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement delete via Supabase
                  },
                },
              ],
            );
          }}
          isLast
        />
      </StudioGroup>

      {/* QR Code Modal */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setShowQR(false)}
            >
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>QR Code</Text>
            <Text style={styles.qrSubtitle}>Scan to view your card</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>
            <Text style={styles.qrUrl} numberOfLines={1}>
              {cardUrl}
            </Text>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.qrShareBtn}
                onPress={() => {
                  setShowQR(false);
                  handleShare();
                }}
              >
                <Ionicons name="share-outline" size={18} color="#000" />
                <Text style={styles.qrShareText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrCopyBtn}
                onPress={() => {
                  setShowQR(false);
                  handleCopyUrl();
                }}
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.qrCopyText}>Copy URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {},
  conditionalSection: {
    marginBottom: 8,
  },
  // QR Modal
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(44,44,46,0.98)',
  },
  qrCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 8,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrUrl: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: AMBER,
  },
  qrShareText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  qrCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qrCopyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
