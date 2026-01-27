import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TEMPLATES, Template, getFreeTemplates, getPremiumTemplates, getProOnlyTemplates, getTemplatesForUser } from '../config/eCardTemplates';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  mode?: 'create' | 'edit';
  cardId?: string;
  existingData?: any;
  existingLinks?: any[];
  existingFeaturedSocials?: any[];
  preserveData?: boolean;
}

// Super admin emails that have full access to all templates
const SUPER_ADMIN_EMAILS = [
  'daniel@360forbusiness.com',
];

const ECardTemplateGalleryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams || {};
  const { user, isPro } = useAuth();
  
  // Check if user is a super admin (has full access to everything)
  const isSuperAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // Super admins have Pro-level access
  const hasProAccess = isPro || isSuperAdmin;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'free' | 'premium' | 'pro'>('all');
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Filter templates based on user status and selected category
  const allTemplates = useMemo(() => {
    let templates = TEMPLATES;
    
    // Filter by category
    switch (selectedCategory) {
      case 'free':
        templates = templates.filter(t => !t.isPremium && !t.isProOnly);
        break;
      case 'premium':
        templates = templates.filter(t => t.isPremium);
        break;
      case 'pro':
        templates = templates.filter(t => t.isProOnly);
        break;
      default:
        // Show all, but put Pro templates first if user has Pro access
        if (hasProAccess) {
          const proTemplates = templates.filter(t => t.isProOnly);
          const otherTemplates = templates.filter(t => !t.isProOnly);
          templates = [...proTemplates, ...otherTemplates];
        }
        break;
    }
    
    return templates;
  }, [selectedCategory, hasProAccess]);

  const handleSelectTemplate = (template: Template) => {
  const { t } = useTranslation();
    // Navigate to color scheme picker, preserving existing data if editing
    navigation.navigate('ECardColorPicker', {
      templateId: template.id,
      mode: params.mode || 'create',
      cardId: params.cardId,
      existingData: params.existingData,
      existingLinks: params.existingLinks,
      existingFeaturedSocials: params.existingFeaturedSocials,
      preserveData: params.preserveData,
    });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderTemplateCard = ({ item, index }: { item: Template; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    // Get first color scheme for preview
    const previewColors = item.colorSchemes[0];
    const gradientColors = previewColors.primary.startsWith('linear') 
      ? [previewColors.primary, previewColors.secondary]
      : [previewColors.primary, previewColors.secondary];

    return (
      <View style={styles.slideContainer}>
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}>
          {/* Template Preview Card */}
          <LinearGradient
            colors={gradientColors as any}
            style={styles.previewCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Pro-Only Badge */}
            {item.isProOnly && (
              <View style={[styles.premiumBadge, styles.proBadge]}>
                <Ionicons name="briefcase" size={12} color="#fff" />
                <Text style={[styles.premiumBadgeText, styles.proBadgeText]}>
                  {hasProAccess ? 'PRO' : 'PRO ONLY'}
                </Text>
              </View>
            )}

            {/* Premium Badge */}
            {item.isPremium && !item.isProOnly && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#000" />
                <Text style={styles.premiumBadgeText}>$4.99/mo</Text>
              </View>
            )}

            {/* Free Badge */}
            {!item.isPremium && !item.isProOnly && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}

            {/* Lock overlay for Pro templates if user does not have Pro access */}
            {item.isProOnly && !hasProAccess && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.9)" />
                <Text style={styles.lockText}>Pro Membership Required</Text>
              </View>
            )}

            {/* Mock Profile Photo */}
            <View style={[
              styles.mockPhoto,
              item.layout.photoStyle === 'ornate' && styles.mockPhotoOrnate,
              { borderColor: previewColors.accent || 'rgba(255,255,255,0.3)' }
            ]}>
              <Ionicons name="person" size={40} color={previewColors.textSecondary} />
            </View>

            {/* Mock Name */}
            <Text style={[styles.mockName, { color: previewColors.text }]}>Your Name</Text>
            <Text style={[styles.mockTitle, { color: previewColors.textSecondary }]}>Your Title</Text>

            {/* Mock Action Buttons */}
            <View style={styles.mockButtons}>
              {['Call', 'Text', 'Email'].map((label, i) => (
                <View
                  key={i}
                  style={[
                    styles.mockButton,
                    {
                      backgroundColor: previewColors.accent,
                      borderRadius: item.layout.buttonStyle === 'pill' ? 20 : 
                                   item.layout.buttonStyle === 'square' ? 4 : 12,
                    }
                  ]}
                >
                  <Ionicons 
                    name={label === 'Call' ? 'call' : label === 'Text' ? 'chatbubble' : 'mail'} 
                    size={16} 
                    color={previewColors.text} 
                  />
                </View>
              ))}
            </View>

            {/* Mock Social Icons */}
            <View style={styles.mockSocials}>
              {['logo-instagram', 'logo-linkedin', 'logo-twitter'].map((icon, i) => (
                <Ionicons key={i} name={icon as any} size={20} color={previewColors.textSecondary} style={styles.mockSocialIcon} />
              ))}
            </View>

            {/* Ornate Border for Luxury */}
            {item.layout.showBorder && item.layout.borderStyle === 'ornate' && (
              <View style={[styles.ornateBorder, { borderColor: previewColors.border }]} />
            )}
          </LinearGradient>

          {/* Template Info */}
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateDescription}>{item.description}</Text>
            <Text style={styles.colorCount}>{item.colorSchemes.length} color schemes</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const currentTemplate = allTemplates[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Template</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Swipe to browse • Tap to select</Text>

      {/* Template Gallery */}
      <FlatList
        ref={flatListRef}
        data={allTemplates}
        renderItem={renderTemplateCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.flatListContent}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {allTemplates.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: allTemplates[index].isProOnly ? '#10b981' : 
                                   allTemplates[index].isPremium ? '#d4af37' : '#fff',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'free', 'premium', 'pro'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterTab,
              selectedCategory === cat && styles.filterTabActive,
              cat === 'pro' && styles.filterTabPro,
              cat === 'pro' && selectedCategory === cat && styles.filterTabProActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          >
            <Text style={[
              styles.filterTabText,
              selectedCategory === cat && styles.filterTabTextActive,
              cat === 'pro' && styles.filterTabTextPro,
            ]}>
              {cat === 'all' ? 'All' : cat === 'free' ? 'Free' : cat === 'premium' ? 'Premium' : 'Pro'}
            </Text>
            {cat === 'pro' && !hasProAccess && (
              <Ionicons name="lock-closed" size={10} color="#10b981" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Select Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            currentTemplate?.isPremium && styles.selectButtonPremium,
            currentTemplate?.isProOnly && styles.selectButtonPro,
            currentTemplate?.isProOnly && !hasProAccess && styles.selectButtonDisabled,
          ]}
          onPress={() => {
            if (currentTemplate?.isProOnly && !hasProAccess) {
              // Navigate to Pro upgrade screen
              Alert.alert('Coming Soon', 'Pro membership will be available in a future update.');
            } else if (currentTemplate) {
              handleSelectTemplate(currentTemplate);
            }
          }}
        >
          <Text style={styles.selectButtonText}>
            {currentTemplate?.isProOnly && !hasProAccess 
              ? 'Upgrade to Pro' 
              : currentTemplate?.isProOnly 
                ? 'Use Pro Template' 
                : currentTemplate?.isPremium 
                  ? 'Select Premium Template' 
                  : 'Use This Template'}
          </Text>
          <Ionicons 
            name={currentTemplate?.isProOnly && !hasProAccess ? 'arrow-up-circle' : 'arrow-forward'} 
            size={20} 
            color="#fff" 
            style={styles.selectButtonIcon} 
          />
        </TouchableOpacity>

        {/* Template Count */}
        <View style={styles.categoryFilter}>
          <Text style={styles.categoryLabel}>
            {currentIndex + 1} of {allTemplates.length} templates
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 44,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 12,
  },
  flatListContent: {
    alignItems: 'center',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  previewCard: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_HEIGHT * 0.42,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#d4af37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  freeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  mockPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 16,
  },
  mockPhotoOrnate: {
    borderWidth: 4,
  },
  mockName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  mockTitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  mockButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  mockButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockSocials: {
    flexDirection: 'row',
    gap: 16,
  },
  mockSocialIcon: {
    opacity: 0.8,
  },
  ornateBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'solid',
  },
  templateInfo: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 80,
  },
  templateName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  colorCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectButtonPremium: {
    backgroundColor: '#d4af37',
  },
  selectButtonPro: {
    backgroundColor: '#10b981',
  },
  selectButtonDisabled: {
    backgroundColor: '#374151',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonIcon: {
    marginLeft: 8,
  },
  categoryFilter: {
    alignItems: 'center',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  // Pro Badge Styles
  proBadge: {
    backgroundColor: '#10b981',
  },
  proBadgeText: {
    color: '#fff',
  },
  // Lock Overlay for Pro templates
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  lockText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabPro: {
    borderWidth: 1,
    borderColor: '#10b981',
  },
  filterTabProActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabTextPro: {
    color: '#10b981',
  },
});

export default ECardTemplateGalleryScreen;
