/**
 * TavvY Language Selector Component
 * 
 * A reusable component for selecting app language.
 * Can be used in Settings screen or as a modal.
 * 
 * File: src/components/LanguageSelector.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../i18n';
import * as Updates from 'expo-updates';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChange?: (languageCode: string) => void;
}

interface LanguageItemProps {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  isSelected: boolean;
  onSelect: (code: string, rtl: boolean) => void;
}

const LanguageItem: React.FC<LanguageItemProps> = ({
  code,
  name,
  nativeName,
  flag,
  rtl,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[styles.languageItem, isSelected && styles.selectedItem]}
      onPress={() => onSelect(code, rtl)}
      activeOpacity={0.7}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.languageText}>
          <Text style={[styles.nativeName, isSelected && styles.selectedText]}>
            {nativeName}
          </Text>
          <Text style={styles.englishName}>{name}</Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const [selectedCode, setSelectedCode] = useState(currentLanguage.code);
  const [isChanging, setIsChanging] = useState(false);

  const handleSelectLanguage = async (code: string, rtl: boolean) => {
    if (code === selectedCode || isChanging) return;

    setIsChanging(true);
    setSelectedCode(code);

    try {
      await changeLanguage(code);
      
      // Handle RTL layout change
      const currentRTL = I18nManager.isRTL;
      if (rtl !== currentRTL) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        
        // Reload the app to apply RTL changes
        // Note: In production, you might want to show a confirmation dialog
        if (Updates.reloadAsync) {
          await Updates.reloadAsync();
        }
      }

      onLanguageChange?.(code);
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
      setSelectedCode(currentLanguage.code);
    } finally {
      setIsChanging(false);
    }
  };

  const renderLanguageItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[0] }) => (
    <LanguageItem
      code={item.code}
      name={item.name}
      nativeName={item.nativeName}
      flag={item.flag}
      rtl={item.rtl}
      isSelected={selectedCode === item.code}
      onSelect={handleSelectLanguage}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('settings.selectLanguage')}</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={SUPPORTED_LANGUAGES}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

// Inline Language Selector for Settings Screen
export const InlineLanguageSelector: React.FC<{
  onLanguageChange?: (languageCode: string) => void;
}> = ({ onLanguageChange }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLanguage = getCurrentLanguage();

  return (
    <>
      <TouchableOpacity
        style={styles.inlineSelector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.inlineSelectorLeft}>
          <Ionicons name="language" size={22} color="#007AFF" />
          <Text style={styles.inlineSelectorLabel}>{t('settings.language')}</Text>
        </View>
        <View style={styles.inlineSelectorRight}>
          <Text style={styles.inlineSelectorValue}>
            {currentLanguage.flag} {currentLanguage.nativeName}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </View>
      </TouchableOpacity>

      <LanguageSelector
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onLanguageChange={onLanguageChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 36,
  },
  listContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  selectedItem: {
    backgroundColor: '#E8F4FD',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageText: {
    flexDirection: 'column',
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  selectedText: {
    color: '#007AFF',
  },
  englishName: {
    fontSize: 13,
    color: '#8E8E93',
  },
  separator: {
    height: 8,
  },
  // Inline Selector Styles
  inlineSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
  },
  inlineSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineSelectorLabel: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  inlineSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineSelectorValue: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 4,
  },
});

export default LanguageSelector;
