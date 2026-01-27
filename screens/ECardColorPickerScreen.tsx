import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getTemplateById, ColorScheme, Template } from '../config/eCardTemplates';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteParams {
  templateId: string;
  mode: 'create' | 'edit';
  cardId?: string;
  existingData?: any;
  existingLinks?: any[];
  existingFeaturedSocials?: any[];
  preserveData?: boolean;
}

const ECardColorPickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const template = getTemplateById(params.templateId);
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>(
    template?.colorSchemes[0]?.id || ''
  );

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Template not found</Text>
      </SafeAreaView>
    );
  }

  const handleContinue = () => {
  const { t } = useTranslation();
    const colorScheme = template.colorSchemes.find(cs => cs.id === selectedColorScheme);
    
    // If preserving data (editing template), go directly to dashboard with existing data
    if (params.preserveData && params.existingData) {
      navigation.navigate('ECardDashboard', {
        templateId: params.templateId,
        colorSchemeId: selectedColorScheme,
        profile: {
          name: params.existingData.name,
          title: params.existingData.title,
          bio: params.existingData.bio,
          photo: params.existingData.profile_photo_url,
        },
        links: params.existingLinks || [],
        cardId: params.cardId,
        isNewCard: false,
        openAppearance: true, // Open appearance tab to show new template
      });
      return;
    }
    
    // Navigate to the NEW Linktree-style onboarding flow for new cards
    navigation.navigate('ECardOnboardingPlatforms', {
      templateId: params.templateId,
      colorSchemeId: selectedColorScheme,
      templateConfig: {
        template,
        colorScheme,
      },
      mode: params.mode,
    });
  };

  const renderColorSchemeCard = (colorScheme: ColorScheme, index: number) => {
    const isSelected = selectedColorScheme === colorScheme.id;
    const gradientColors = [colorScheme.primary, colorScheme.secondary];

    return (
      <TouchableOpacity
        key={colorScheme.id}
        style={[styles.colorCard, isSelected && styles.colorCardSelected]}
        onPress={() => setSelectedColorScheme(colorScheme.id)}
        activeOpacity={0.8}
      >
        {/* Mini Preview */}
        <LinearGradient
          colors={gradientColors as any}
          style={styles.miniPreview}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Mini Profile */}
          <View style={[styles.miniPhoto, { borderColor: colorScheme.accent }]}>
            <Ionicons name="person" size={16} color={colorScheme.textSecondary} />
          </View>
          
          {/* Mini Text */}
          <View style={styles.miniTextContainer}>
            <View style={[styles.miniTextLine, { backgroundColor: colorScheme.text, width: 50 }]} />
            <View style={[styles.miniTextLine, { backgroundColor: colorScheme.textSecondary, width: 35 }]} />
          </View>

          {/* Mini Buttons */}
          <View style={styles.miniButtons}>
            {[1, 2, 3].map((_, i) => (
              <View
                key={i}
                style={[styles.miniButton, { backgroundColor: colorScheme.accent }]}
              />
            ))}
          </View>
        </LinearGradient>

        {/* Color Scheme Name */}
        <View style={styles.colorInfo}>
          <Text style={styles.colorName}>{colorScheme.name}</Text>
          
          {/* Color Swatches */}
          <View style={styles.swatches}>
            <View style={[styles.swatch, { backgroundColor: colorScheme.primary }]} />
            <View style={[styles.swatch, { backgroundColor: colorScheme.secondary }]} />
            <View style={[styles.swatch, { backgroundColor: colorScheme.accent }]} />
          </View>
        </View>

        {/* Selected Indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedColor = template.colorSchemes.find(cs => cs.id === selectedColorScheme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{template.name} Template</Text>
          <Text style={styles.headerSubtitle}>Choose your colors</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Large Preview */}
      <View style={styles.previewContainer}>
        {selectedColor && (
          <LinearGradient
            colors={[selectedColor.primary, selectedColor.secondary] as any}
            style={styles.largePreview}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Mock Photo */}
            <View style={[
              styles.previewPhoto,
              { borderColor: selectedColor.accent || 'rgba(255,255,255,0.3)' }
            ]}>
              <Ionicons name="person" size={32} color={selectedColor.textSecondary} />
            </View>

            {/* Mock Name */}
            <Text style={[styles.previewName, { color: selectedColor.text }]}>Your Name</Text>
            <Text style={[styles.previewTitle, { color: selectedColor.textSecondary }]}>Your Title</Text>

            {/* Mock Buttons */}
            <View style={styles.previewButtons}>
              {['call', 'chatbubble', 'mail'].map((icon, i) => (
                <View
                  key={i}
                  style={[
                    styles.previewButton,
                    {
                      backgroundColor: selectedColor.accent,
                      borderRadius: template.layout.buttonStyle === 'pill' ? 20 : 12,
                    }
                  ]}
                >
                  <Ionicons name={icon as any} size={18} color={selectedColor.text} />
                </View>
              ))}
            </View>

            {/* Border for luxury templates */}
            {template.layout.showBorder && template.layout.borderStyle === 'ornate' && (
              <View style={[styles.previewBorder, { borderColor: selectedColor.border }]} />
            )}
          </LinearGradient>
        )}
      </View>

      {/* Color Schemes Grid */}
      <View style={styles.colorSchemesContainer}>
        <Text style={styles.sectionTitle}>Color Schemes</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorSchemesList}
        >
          {template.colorSchemes.map((cs, index) => renderColorSchemeCard(cs, index))}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue with {selectedColor?.name}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  largePreview: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderRadius: 16,
  },
  colorSchemesContainer: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  colorSchemesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  colorCard: {
    width: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCardSelected: {
    borderColor: '#22c55e',
  },
  miniPreview: {
    height: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 6,
  },
  miniTextContainer: {
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  miniTextLine: {
    height: 4,
    borderRadius: 2,
  },
  miniButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  miniButton: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  colorInfo: {
    padding: 10,
    alignItems: 'center',
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  swatches: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ECardColorPickerScreen;
