import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translation files
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import pt from './locales/pt/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import it from './locales/it/translation.json';
import nl from './locales/nl/translation.json';
import ru from './locales/ru/translation.json';
import ar from './locales/ar/translation.json';
import tr from './locales/tr/translation.json';
import hi from './locales/hi/translation.json';
import id from './locales/id/translation.json';
import th from './locales/th/translation.json';
import vi from './locales/vi/translation.json';
import ja from './locales/ja/translation.json';
import ko from './locales/ko/translation.json';
import zh from './locales/zh/translation.json';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = '@tavvy_language_preference';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
];

// Resources object for i18next
const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  nl: { translation: nl },
  ru: { translation: ru },
  ar: { translation: ar },
  tr: { translation: tr },
  hi: { translation: hi },
  id: { translation: id },
  th: { translation: th },
  vi: { translation: vi },
  ja: { translation: ja },
  ko: { translation: ko },
  zh: { translation: zh },
};

// Get the best matching language from device locale
const getDeviceLanguage = (): string => {
  try {
    // Handle both old and new expo-localization API
    const deviceLocale = Localization.locale || 
                         (Localization.getLocales && Localization.getLocales()[0]?.languageCode) ||
                         'en';
    
    // Safely handle the locale string
    if (!deviceLocale || typeof deviceLocale !== 'string') {
      return 'en';
    }
    
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Check if we support this language
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    return isSupported ? languageCode : 'en';
  } catch (error) {
    console.log('Error getting device language:', error);
    return 'en';
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Load saved language preference on app start
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

// Change language and persist preference
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

// Get current language info
export const getCurrentLanguage = () => {
  const currentCode = i18n.language;
  return SUPPORTED_LANGUAGES.find(lang => lang.code === currentCode) || SUPPORTED_LANGUAGES[0];
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  const currentLang = getCurrentLanguage();
  return currentLang.rtl;
};

export default i18n;
