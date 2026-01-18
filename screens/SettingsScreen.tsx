// ============================================================================
// SETTINGS SCREEN
// ============================================================================
// Settings screen with Language selector, Theme toggle, and other preferences
// Place this file in: screens/SettingsScreen.tsx
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { InlineLanguageSelector } from '../components/LanguageSelector';
import { AutoTranslateToggle } from '../components/ReviewTranslation';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useThemeContext();
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.background,
    },
    header: {
      borderBottomColor: theme.border,
    },
    headerTitle: {
      color: theme.text,
    },
    sectionTitle: {
      color: theme.textSecondary,
    },
    settingItem: {
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
    },
    settingLabel: {
      color: theme.text,
    },
    settingValue: {
      color: theme.textSecondary,
    },
    dangerText: {
      color: '#FF3B30',
    },
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.navigate('AppsMain' as never);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
          {t('settings.settings')}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ========== LANGUAGE SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {t('settings.language').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <InlineLanguageSelector />
          </View>
        </View>

        {/* ========== APPEARANCE SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {t('settings.theme').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={isDark ? 'moon' : 'sunny'} 
                  size={22} 
                  color={theme.primary} 
                />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {t('settings.darkMode')}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ========== REVIEWS SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {t('places.reviews').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <AutoTranslateToggle 
              enabled={autoTranslate} 
              onToggle={setAutoTranslate} 
            />
          </View>
        </View>

        {/* ========== NOTIFICATIONS SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {t('settings.notifications').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {t('settings.notifications')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== SUPPORT SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {t('settings.helpSupport').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.settingRow, styles.settingRowBorder]}
              onPress={() => navigation.navigate('HelpSupport' as never)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle" size={22} color={theme.brandOrange} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {t('settings.contactSupport')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingRow, styles.settingRowBorder]}
              onPress={() => navigation.navigate('CommunityGuidelines' as never)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="document-text" size={22} color={theme.signalPros} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {t('settings.communityGuidelines')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark" size={22} color={theme.signalUniverse} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {t('settings.privacyPolicy')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== ACCOUNT SECTION ========== */}
        {user && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
              {t('settings.account').toUpperCase()}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={handleSignOut}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out" size={22} color="#FF3B30" />
                  <Text style={[styles.settingLabel, dynamicStyles.dangerText]}>
                    {t('auth.signOut')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Version */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>
            {t('common.version', { version: '1.0.0' })}
          </Text>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>
            {t('common.tagline')}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
