/**
 * TavvY Review Translation Component
 * 
 * Shows reviews in original language with toggle to view auto-translated version.
 * Preserves authenticity while enabling global accessibility.
 * 
 * File: src/components/ReviewTranslation.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLanguage } from '../i18n';

interface ReviewTranslationProps {
  originalText: string;
  originalLanguage: string; // ISO language code (e.g., 'es', 'fr')
  reviewId: string;
  onTranslate?: (text: string, targetLang: string) => Promise<string>;
}

// Language code to name mapping for display
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  nl: 'Dutch',
  ru: 'Russian',
  ar: 'Arabic',
  tr: 'Turkish',
  hi: 'Hindi',
  id: 'Indonesian',
  th: 'Thai',
  vi: 'Vietnamese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

const ReviewTranslation: React.FC<ReviewTranslationProps> = ({
  originalText,
  originalLanguage,
  reviewId,
  onTranslate,
}) => {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if translation is needed
  const needsTranslation = originalLanguage !== currentLanguage.code;

  // Reset translation when review changes
  useEffect(() => {
    setTranslatedText(null);
    setShowTranslation(false);
    setError(null);
  }, [reviewId, originalText]);

  const handleToggleTranslation = async () => {
    if (!needsTranslation) return;

    if (showTranslation) {
      // Switch back to original
      setShowTranslation(false);
      return;
    }

    // If we already have the translation, just show it
    if (translatedText) {
      setShowTranslation(true);
      return;
    }

    // Fetch translation
    setIsLoading(true);
    setError(null);

    try {
      if (onTranslate) {
        const translated = await onTranslate(originalText, currentLanguage.code);
        setTranslatedText(translated);
        setShowTranslation(true);
      } else {
        // Default mock translation (replace with actual API call)
        // In production, this would call your translation API
        await new Promise(resolve => setTimeout(resolve, 500));
        setTranslatedText(`[Translated to ${currentLanguage.name}] ${originalText}`);
        setShowTranslation(true);
      }
    } catch (err) {
      setError(t('errors.somethingWentWrong'));
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayText = showTranslation && translatedText ? translatedText : originalText;
  const originalLanguageName = LANGUAGE_NAMES[originalLanguage] || originalLanguage;

  return (
    <View style={styles.container}>
      {/* Review Text */}
      <Text style={styles.reviewText}>{displayText}</Text>

      {/* Translation Controls */}
      {needsTranslation && (
        <View style={styles.translationControls}>
          {/* Language indicator */}
          <View style={styles.languageIndicator}>
            <Ionicons 
              name="language" 
              size={14} 
              color="#8E8E93" 
            />
            <Text style={styles.languageText}>
              {showTranslation 
                ? t('reviews.translatedReview')
                : `${t('reviews.originalReview')} (${originalLanguageName})`
              }
            </Text>
          </View>

          {/* Toggle button */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleToggleTranslation}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Ionicons 
                  name={showTranslation ? "document-text-outline" : "language"} 
                  size={16} 
                  color="#007AFF" 
                />
                <Text style={styles.toggleText}>
                  {showTranslation 
                    ? t('reviews.showOriginal')
                    : t('reviews.showTranslation')
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

// Auto-translate setting toggle for user preferences
export const AutoTranslateToggle: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}> = ({ enabled, onToggle }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.autoTranslateRow}
      onPress={() => onToggle(!enabled)}
      activeOpacity={0.7}
    >
      <View style={styles.autoTranslateLeft}>
        <Ionicons name="language" size={22} color="#007AFF" />
        <Text style={styles.autoTranslateLabel}>
          {t('reviews.autoTranslate')}
        </Text>
      </View>
      <View style={[
        styles.toggle,
        enabled ? styles.toggleEnabled : styles.toggleDisabled
      ]}>
        <View style={[
          styles.toggleKnob,
          enabled ? styles.toggleKnobEnabled : styles.toggleKnobDisabled
        ]} />
      </View>
    </TouchableOpacity>
  );
};

// Hook for managing translation preferences
export const useTranslationPreference = () => {
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Load preference from storage on mount
  useEffect(() => {
    // TODO: Load from AsyncStorage
    // const loadPreference = async () => {
    //   const saved = await AsyncStorage.getItem('@tavvy_auto_translate');
    //   setAutoTranslate(saved === 'true');
    // };
    // loadPreference();
  }, []);

  const toggleAutoTranslate = async (enabled: boolean) => {
    setAutoTranslate(enabled);
    // TODO: Save to AsyncStorage
    // await AsyncStorage.setItem('@tavvy_auto_translate', enabled.toString());
  };

  return { autoTranslate, toggleAutoTranslate };
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
  },
  translationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  toggleText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
  // Auto-translate toggle styles
  autoTranslateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  autoTranslateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoTranslateLabel: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
  },
  toggleEnabled: {
    backgroundColor: '#34C759',
  },
  toggleDisabled: {
    backgroundColor: '#E5E5EA',
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobEnabled: {
    transform: [{ translateX: 20 }],
  },
  toggleKnobDisabled: {
    transform: [{ translateX: 0 }],
  },
});

export default ReviewTranslation;
