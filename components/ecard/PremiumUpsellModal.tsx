/**
 * PremiumUpsellModal.tsx
 * Beautiful premium upsell modal for block-based eCard system
 * 
 * Shows when:
 * 1. User tries to save with premium blocks (hard gate)
 * 2. User adds 2+ premium blocks (soft hint)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { PREMIUM_PRICE } from '../../config/eCardBlocks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumUpsellModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  premiumBlockCount: number;
  mode: 'hint' | 'gate'; // hint = soft prompt, gate = must subscribe to continue
}

const PREMIUM_FEATURES = [
  { icon: 'link-outline', title: 'Unlimited Links', desc: 'Add as many links as you want' },
  { icon: 'images-outline', title: 'Photo Gallery', desc: 'Showcase your work beautifully' },
  { icon: 'videocam-outline', title: 'Video Embeds', desc: 'YouTube, TikTok, Vimeo' },
  { icon: 'pricetag-outline', title: 'Products Block', desc: 'Sell with images & prices' },
  { icon: 'chatbubble-outline', title: 'Testimonials', desc: 'Show off customer reviews' },
  { icon: 'document-text-outline', title: 'About Me Bio', desc: 'Tell your full story' },
];

export default function PremiumUpsellModal({
  visible,
  onClose,
  onSubscribe,
  premiumBlockCount,
  mode,
}: PremiumUpsellModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);
  
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={mode === 'hint' ? handleClose : undefined}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={mode === 'hint' ? handleClose : undefined}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBadgeGradient}
            >
              <Ionicons name="star" size={24} color="#1a1a2e" />
            </LinearGradient>
          </View>
          
          {/* Header */}
          <Text style={styles.title}>
            {mode === 'gate' ? 'Upgrade to Save' : 'Unlock Premium Blocks'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'gate' 
              ? `You have ${premiumBlockCount} premium block${premiumBlockCount > 1 ? 's' : ''} that require a subscription to save.`
              : 'Get access to all premium blocks and make your card stand out!'
            }
          </Text>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>${PREMIUM_PRICE}</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          
          {/* Features */}
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.slice(0, 4).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={18} color="#FFD700" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* CTA Buttons */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={onSubscribe}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeButtonGradient}
            >
              <Ionicons name="star" size={20} color="#1a1a2e" />
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {mode === 'hint' && (
            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleClose}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
          
          {mode === 'gate' && (
            <TouchableOpacity
              style={styles.removeBlocksButton}
              onPress={handleClose}
            >
              <Text style={styles.removeBlocksText}>Remove Premium Blocks</Text>
            </TouchableOpacity>
          )}
          
          {/* Terms */}
          <Text style={styles.terms}>
            Cancel anytime. Billed monthly.
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    backgroundColor: '#1a1a2e',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  premiumBadge: {
    marginBottom: 20,
  },
  premiumBadgeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFD700',
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  subscribeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  laterButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  removeBlocksButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  removeBlocksText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  terms: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
  },
});
