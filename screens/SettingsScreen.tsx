import Constants from 'expo-constants';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { getAccountDeletionAvailability, createDeletionViewGuard } from '../lib/accountDeletion';
import { accountDeletionCopy } from '../lib/accountDeletionCopy';
import {
  AppSettings,
  getCachedAppSettings,
  loadAppSettings,
  setAppSetting,
  subscribeAppSettings,
} from '../lib/settingsPreferences';
// ============================================================================
// SETTINGS SCREEN
// ============================================================================
// Settings screen with Language selector, Theme toggle, and other preferences
// Place this file in: screens/SettingsScreen.tsx
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { InlineLanguageSelector } from '../components/LanguageSelector';
import { AutoTranslateToggle } from '../components/ReviewTranslation';
import BlockedAuthors from '../components/BlockedAuthors';
import AppearanceSelector from '../components/AppearanceSelector';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const deletionCopy = accountDeletionCopy(i18n.resolvedLanguage || i18n.language);
  const copy = useReleaseCopy();
  const { user, session, signOut } = useAuth();
  const { theme } = useThemeContext();
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [isCheckingDeletion, setIsCheckingDeletion] = useState(false);
  const deletionGuard = useRef(createDeletionViewGuard()).current;
  deletionGuard.setSession(user?.id ?? null, session?.access_token ?? null);
  useEffect(() => {
    deletionGuard.mount();
    setIsCheckingDeletion(false);
    return () => deletionGuard.dispose();
  }, [deletionGuard, user?.id, session?.access_token]);
  
  // Persisted app settings (notifications, privacy, display defaults) — see lib/settingsPreferences.ts
  const [appSettings, setAppSettingsState] = useState<AppSettings>(getCachedAppSettings());
  useEffect(() => {
    loadAppSettings().then(setAppSettingsState);
    return subscribeAppSettings(setAppSettingsState);
  }, []);
  const {
    pushNotifications,
    emailNotifications,
    liveBusinessAlerts,
    locationSharing,
    dataSharing,
    distanceUnit,
    defaultMapLayer,
  } = appSettings;
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettingsState(prev => ({ ...prev, [key]: value }));
    setAppSetting(key, value);
  };

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

  const handleDeleteAccount = async () => {
    const ticket = deletionGuard.begin();
    setIsCheckingDeletion(true);
    try {
      const availability = await getAccountDeletionAvailability();
      if (!deletionGuard.current(ticket)) return;
      if (availability.status === 'unavailable') {
        Alert.alert(
          t('auth.deleteAccount', { defaultValue: deletionCopy.title }),
          deletionCopy.unavailable + '\n\n' + deletionCopy.unchanged,
          [{ text: deletionCopy.close }],
        );
      }
    } finally {
      if (deletionGuard.current(ticket)) setIsCheckingDeletion(false);
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
        <BlockedAuthors />
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
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <AppearanceSelector />
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
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Push Notifications")}
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(value) => updateSetting('pushNotifications', value)}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Email Notifications")}
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={(value) => updateSetting('emailNotifications', value)}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="radio" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Live Business Alerts")}
                </Text>
              </View>
              <Switch
                value={liveBusinessAlerts}
                onValueChange={(value) => updateSetting('liveBusinessAlerts', value)}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ========== PRIVACY & SECURITY SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {copy('Privacy & Security').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Ionicons name="location" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Location Sharing")}
                </Text>
              </View>
              <Switch
                value={locationSharing}
                onValueChange={(value) => updateSetting('locationSharing', value)}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="analytics" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Share Usage Data")}
                </Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={(value) => updateSetting('dataSharing', value)}
                trackColor={{ false: '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ========== PREFERENCES SECTION ========== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            {copy('Preferences').toUpperCase()}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.settingRow, styles.settingRowBorder]}
              onPress={() => {
                Alert.alert(
                  copy("Distance Unit"),
                  copy("Choose your preferred distance unit"),
                  [
                    {
                      text: copy("Miles"),
                      onPress: () => updateSetting('distanceUnit', 'miles'),
                    },
                    {
                      text: copy("Kilometers"),
                      onPress: () => updateSetting('distanceUnit', 'km'),
                    },
                    { text: copy("Cancel"), style: 'cancel' },
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="speedometer" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Distance Unit")}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.settingValue, dynamicStyles.settingValue]}>
                  {distanceUnit === 'miles' ? copy("Miles") : copy("Kilometers")}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => {
                Alert.alert(
                  copy("Default Map Layer"),
                  copy("Choose your default map style"),
                  [
                    {
                      text: copy("Standard"),
                      onPress: () => updateSetting('defaultMapLayer', 'standard'),
                    },
                    {
                      text: copy("Dark"),
                      onPress: () => updateSetting('defaultMapLayer', 'dark'),
                    },
                    {
                      text: copy("Satellite"),
                      onPress: () => updateSetting('defaultMapLayer', 'satellite'),
                    },
                    { text: copy("Cancel"), style: 'cancel' },
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="map" size={22} color={theme.primary} />
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>
                  {copy("Default Map Layer")}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.settingValue, dynamicStyles.settingValue]}>
                  {copy(defaultMapLayer === 'standard' ? 'Standard' : defaultMapLayer === 'dark' ? 'Dark' : 'Satellite')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
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
              onPress={() => navigation.navigate('HelpSupport' as never)}
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
                style={[styles.settingRow, styles.settingRowBorder]}
                onPress={handleSignOut}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out" size={22} color="#FF3B30" />
                  <Text style={[styles.settingLabel, dynamicStyles.dangerText]}>
                    {t('auth.signOut')}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={handleDeleteAccount}
                disabled={isCheckingDeletion}
              >
                <View style={styles.settingLeft}>
                  {isCheckingDeletion ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Ionicons name="trash" size={22} color="#FF3B30" />
                  )}
                  <Text style={[styles.settingLabel, dynamicStyles.dangerText]}>
                    {t('auth.deleteAccount')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Version */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>
            {t('common.version', { version: Constants.expoConfig?.version || '1.0.1' })}
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
  settingValue: { fontSize: 14 },
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
