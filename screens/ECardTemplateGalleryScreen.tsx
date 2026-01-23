import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TEMPLATES, Template, getFreeTemplates, getPremiumTemplates } from '../config/eCardTemplates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  mode?: 'create' | 'edit';
  cardId?: string;
  existingData?: any;
}

const ECardTemplateGalleryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams || {};
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const allTemplates = TEMPLATES;

  const handleSelectTemplate = (template: Template) => {
    // Navigate to color scheme picker
    navigation.navigate('ECardColorPicker', {
      templateId: template.id,
      mode: params.mode || 'create',
      cardId: params.cardId,
      existingData: params.existingData,
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
            {/* Premium Badge */}
            {item.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#000" />
                <Text style={styles.premiumBadgeText}>$4.99/mo</Text>
              </View>
            )}

            {/* Free Badge */}
            {!item.isPremium && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
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
                  backgroundColor: allTemplates[index].isPremium ? '#d4af37' : '#fff',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Select Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            currentTemplate?.isPremium && styles.selectButtonPremium,
          ]}
          onPress={() => currentTemplate && handleSelectTemplate(currentTemplate)}
        >
          <Text style={styles.selectButtonText}>
            {currentTemplate?.isPremium ? 'Select Premium Template' : 'Use This Template'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.selectButtonIcon} />
        </TouchableOpacity>

        {/* Category Filter */}
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
    marginBottom: 20,
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
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 24,
    padding: 24,
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
    marginTop: 24,
    alignItems: 'center',
  },
  templateName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  colorCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
});

export default ECardTemplateGalleryScreen;
