/**
 * ECardBlockBuilderScreen.tsx
 * Block-based card builder with drag-and-drop functionality
 * 
 * Flow:
 * 1. User arrives after selecting template
 * 2. Shows default blocks (Profile, Contact, Social)
 * 3. User can add, remove, reorder blocks
 * 4. Premium upsell when adding 2+ premium blocks
 * 5. Preview and save
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import {
  BlockType,
  CardBlock,
  BLOCK_CONFIGS,
  getBlockConfig,
  getFreeBlocks,
  getPremiumBlocks,
  createBlockInstance,
  getDefaultBlocks,
  countPremiumBlocks,
  PREMIUM_PRICE,
} from '../config/eCardBlocks';
import { ColorScheme } from '../config/eCardTemplates';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  templateId: string;
  templateConfig: {
    template: any;
    colorScheme: ColorScheme;
  };
  existingBlocks?: CardBlock[];
  mode?: 'create' | 'edit';
}

export default function ECardBlockBuilderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  
  // Get template config from route
  const { templateId, templateConfig, existingBlocks, mode } = route.params as RouteParams;
  const colorScheme = templateConfig?.colorScheme;
  
  // State
  const [blocks, setBlocks] = useState<CardBlock[]>(existingBlocks || getDefaultBlocks());
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [hasShownPremiumHint, setHasShownPremiumHint] = useState(false);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Add a new block
  const addBlock = (type: BlockType) => {
    const config = getBlockConfig(type);
    if (!config) return;
    
    // Check if max instances reached
    const existingCount = blocks.filter(b => b.type === type).length;
    if (existingCount >= config.maxInstances) {
      Alert.alert('Limit Reached', `You can only add ${config.maxInstances} ${config.name} block(s).`);
      return;
    }
    
    // Check premium status
    const currentPremiumCount = countPremiumBlocks(blocks);
    const isAddingPremium = config.isPremium;
    
    // If adding a premium block and already have one, show hint
    if (isAddingPremium && currentPremiumCount >= 1 && !hasShownPremiumHint) {
      setHasShownPremiumHint(true);
      // Show soft hint, don't block
      setTimeout(() => {
        Alert.alert(
          '✨ Premium Feature',
          `Adding multiple premium blocks requires a subscription ($${PREMIUM_PRICE}/month). You can continue building and subscribe when you're ready to save.`,
          [{ text: 'Got it!', style: 'default' }]
        );
      }, 300);
    }
    
    const newBlock = createBlockInstance(type);
    newBlock.sortOrder = blocks.length;
    
    setBlocks(prev => [...prev, newBlock]);
    setShowAddBlockModal(false);
    
    // Open editor for the new block
    setTimeout(() => {
      setEditingBlockId(newBlock.id);
    }, 300);
  };

  // Remove a block
  const removeBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    const config = block ? getBlockConfig(block.type) : null;
    
    if (config?.isRequired) {
      Alert.alert('Required Block', 'This block cannot be removed.');
      return;
    }
    
    Alert.alert(
      'Remove Block',
      `Are you sure you want to remove this ${config?.name || 'block'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setBlocks(prev => prev.filter(b => b.id !== blockId));
          },
        },
      ]
    );
  };

  // Move block up/down
  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    // Update sort orders
    newBlocks.forEach((block, i) => {
      block.sortOrder = i;
    });
    
    setBlocks(newBlocks);
  };

  // Update block data
  const updateBlockData = (blockId: string, data: any) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, data: { ...block.data, ...data } } : block
    ));
  };

  // Continue to preview/edit
  const handleContinue = () => {
    // Validate required fields
    const profileBlock = blocks.find(b => b.type === 'profile');
    if (!profileBlock?.data?.fullName?.trim()) {
      Alert.alert('Missing Information', 'Please enter your name in the Profile block.');
      setEditingBlockId(profileBlock?.id || null);
      return;
    }
    
    navigation.navigate('CreateDigitalCard', {
      templateId,
      templateConfig,
      blocks,
      mode: mode || 'create',
    });
  };

  // Render a single block card
  const renderBlockCard = (block: CardBlock, index: number) => {
    const config = getBlockConfig(block.type);
    if (!config) return null;
    
    const isFirst = index === 0;
    const isLast = index === blocks.length - 1;
    
    return (
      <Animated.View
        key={block.id}
        style={[
          styles.blockCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.blockCardContent}
          onPress={() => setEditingBlockId(block.id)}
          activeOpacity={0.7}
        >
          {/* Block Icon & Info */}
          <View style={styles.blockInfo}>
            <View style={[
              styles.blockIconContainer,
              config.isPremium && styles.blockIconPremium,
            ]}>
              <Ionicons 
                name={config.icon as any} 
                size={24} 
                color={config.isPremium ? '#FFD700' : '#FFFFFF'} 
              />
            </View>
            <View style={styles.blockTextContainer}>
              <View style={styles.blockTitleRow}>
                <Text style={styles.blockTitle}>{config.name}</Text>
                {config.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.blockDescription} numberOfLines={1}>
                {getBlockPreviewText(block)}
              </Text>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.blockActions}>
            {!isFirst && (
              <TouchableOpacity
                style={styles.blockActionButton}
                onPress={() => moveBlock(block.id, 'up')}
              >
                <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                style={styles.blockActionButton}
                onPress={() => moveBlock(block.id, 'down')}
              >
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
            {!config.isRequired && (
              <TouchableOpacity
                style={[styles.blockActionButton, styles.blockDeleteButton]}
                onPress={() => removeBlock(block.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Get preview text for a block
  const getBlockPreviewText = (block: CardBlock): string => {
    switch (block.type) {
      case 'profile':
        return block.data.fullName || 'Tap to add your name';
      case 'contact':
        const contacts = [block.data.phone, block.data.email].filter(Boolean);
        return contacts.length > 0 ? contacts.join(' • ') : 'Tap to add contact info';
      case 'social':
        const socials = Object.values(block.data).filter(v => v && typeof v === 'string');
        return socials.length > 0 ? `${socials.length} connected` : 'Tap to add social links';
      case 'links':
        const linkCount = block.data.links?.length || 0;
        return linkCount > 0 ? `${linkCount} link${linkCount > 1 ? 's' : ''}` : 'Tap to add links';
      case 'about':
        return block.data.content?.substring(0, 40) || 'Tap to add your bio';
      case 'products':
        const productCount = block.data.products?.length || 0;
        return productCount > 0 ? `${productCount} product${productCount > 1 ? 's' : ''}` : 'Tap to add products';
      case 'gallery':
        const imageCount = block.data.images?.length || 0;
        return imageCount > 0 ? `${imageCount} image${imageCount > 1 ? 's' : ''}` : 'Tap to add images';
      case 'video':
        return block.data.videoUrl ? 'Video added' : 'Tap to add video';
      case 'testimonials':
        const testimonialCount = block.data.testimonials?.length || 0;
        return testimonialCount > 0 ? `${testimonialCount} testimonial${testimonialCount > 1 ? 's' : ''}` : 'Tap to add testimonials';
      case 'form':
        const formType = block.data.formType || 'native';
        const formTypeLabels: Record<string, string> = {
          native: 'Tavvy Form',
          gohighlevel: 'Go High Level',
          typeform: 'Typeform',
          jotform: 'JotForm',
          googleforms: 'Google Forms',
          calendly: 'Calendly',
          webhook: 'Custom Webhook',
        };
        return block.data.title || formTypeLabels[formType] || 'Tap to configure form';
      case 'divider':
        return `${block.data.style} style`;
      case 'spacer':
        return `${block.data.size} space`;
      default:
        return 'Tap to edit';
    }
  };

  // Render Add Block Modal
  const renderAddBlockModal = () => (
    <Modal
      visible={showAddBlockModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddBlockModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Block</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddBlockModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Free Blocks */}
            <Text style={styles.modalSectionTitle}>Free Blocks</Text>
            <View style={styles.blockGrid}>
              {getFreeBlocks().map(config => {
                const existingCount = blocks.filter(b => b.type === config.id).length;
                const isMaxed = existingCount >= config.maxInstances;
                
                return (
                  <TouchableOpacity
                    key={config.id}
                    style={[styles.addBlockItem, isMaxed && styles.addBlockItemDisabled]}
                    onPress={() => !isMaxed && addBlock(config.id)}
                    disabled={isMaxed}
                  >
                    <View style={styles.addBlockIcon}>
                      <Ionicons name={config.icon as any} size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.addBlockName}>{config.name}</Text>
                    <Text style={styles.addBlockDesc} numberOfLines={2}>{config.description}</Text>
                    {isMaxed && (
                      <View style={styles.addBlockMaxed}>
                        <Text style={styles.addBlockMaxedText}>Added</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Premium Blocks */}
            <View style={styles.premiumSectionHeader}>
              <Text style={styles.modalSectionTitle}>Premium Blocks</Text>
              <View style={styles.premiumPriceBadge}>
                <Text style={styles.premiumPriceText}>${PREMIUM_PRICE}/mo</Text>
              </View>
            </View>
            <View style={styles.blockGrid}>
              {getPremiumBlocks().map(config => {
                const existingCount = blocks.filter(b => b.type === config.id).length;
                const isMaxed = existingCount >= config.maxInstances;
                
                return (
                  <TouchableOpacity
                    key={config.id}
                    style={[styles.addBlockItem, styles.addBlockItemPremium, isMaxed && styles.addBlockItemDisabled]}
                    onPress={() => !isMaxed && addBlock(config.id)}
                    disabled={isMaxed}
                  >
                    <View style={[styles.addBlockIcon, styles.addBlockIconPremium]}>
                      <Ionicons name={config.icon as any} size={28} color="#FFD700" />
                    </View>
                    <Text style={styles.addBlockName}>{config.name}</Text>
                    <Text style={styles.addBlockDesc} numberOfLines={2}>{config.description}</Text>
                    {isMaxed ? (
                      <View style={styles.addBlockMaxed}>
                        <Text style={styles.addBlockMaxedText}>Added</Text>
                      </View>
                    ) : (
                      <View style={styles.addBlockProBadge}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={styles.addBlockProText}>PRO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Premium count for header
  const premiumCount = countPremiumBlocks(blocks);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={[colorScheme?.primary || '#1a1a2e', colorScheme?.secondary || '#16213e', '#0f0f1a']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Build Your Card</Text>
          <Text style={styles.headerSubtitle}>{blocks.length} blocks</Text>
        </View>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={handleContinue}
        >
          <Text style={styles.previewButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Premium Status Bar */}
      {premiumCount > 0 && (
        <View style={styles.premiumStatusBar}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.premiumStatusText}>
            {premiumCount} premium block{premiumCount > 1 ? 's' : ''} • ${PREMIUM_PRICE}/mo to save
          </Text>
        </View>
      )}
      
      {/* Block List */}
      <ScrollView
        style={styles.blockList}
        contentContainerStyle={styles.blockListContent}
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((block, index) => renderBlockCard(block, index))}
        
        {/* Add Block Button */}
        <TouchableOpacity
          style={styles.addBlockButton}
          onPress={() => setShowAddBlockModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addBlockButtonInner}>
            <Ionicons name="add-circle-outline" size={32} color="rgba(255,255,255,0.6)" />
            <Text style={styles.addBlockButtonText}>Add Block</Text>
          </View>
        </TouchableOpacity>
        
        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F0F0F0']}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue to Preview</Text>
            <Ionicons name="arrow-forward" size={20} color="#1a1a2e" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Modals */}
      {renderAddBlockModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  premiumStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFD700',
  },
  blockList: {
    flex: 1,
  },
  blockListContent: {
    padding: 20,
  },
  blockCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  blockCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  blockIconPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  blockTextContainer: {
    flex: 1,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  blockDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockDeleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  addBlockButton: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  addBlockButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  addBlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  premiumPriceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  blockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  addBlockItem: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addBlockItemPremium: {
    borderColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  addBlockItemDisabled: {
    opacity: 0.5,
  },
  addBlockIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addBlockIconPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  addBlockName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  addBlockDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  addBlockMaxed: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  addBlockMaxedText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  addBlockProBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  addBlockProText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
});
