/**
 * CardSettingsScreen.tsx
 * Settings for individual digital cards including custom domain
 * Path: screens/CardSettingsScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CARD_URL_BASE = 'https://tavvy.com/';

interface CardSettings {
  id: string;
  slug: string;
  card_name: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
}

export default function CardSettingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const { isPro } = useAuth();
  
  const cardId = route.params?.cardId;
  const initialCard = route.params?.card;

  const [isLoading, setIsLoading] = useState(!initialCard);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cardName, setCardName] = useState(initialCard?.card_name || '');
  const [customDomain, setCustomDomain] = useState(initialCard?.custom_domain || '');
  const [isVerified, setIsVerified] = useState(initialCard?.custom_domain_verified || false);
  const [slug, setSlug] = useState(initialCard?.slug || '');

  useEffect(() => {
    if (!initialCard && cardId) {
      fetchCardSettings();
    }
  }, [cardId, initialCard]);

  const fetchCardSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, slug, card_name, custom_domain, custom_domain_verified')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      setSlug(data.slug);
      setCardName(data.card_name || '');
      setCustomDomain(data.custom_domain || '');
      setIsVerified(data.custom_domain_verified || false);
    } catch (error) {
      console.error('Error fetching card settings:', error);
      Alert.alert('Error', 'Failed to load card settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cardId) return;

    setIsSaving(true);
    try {
      // Clean domain input
      let cleanDomain = customDomain.trim().toLowerCase();
      // Remove protocol if present
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
      // Remove trailing slash
      cleanDomain = cleanDomain.replace(/\/$/, '');

      const { error } = await supabase
        .from('digital_cards')
        .update({
          card_name: cardName.trim() || null,
          custom_domain: cleanDomain || null,
          custom_domain_verified: cleanDomain ? isVerified : false,
        })
        .eq('id', cardId);

      if (error) throw error;

      Alert.alert('Success', 'Card settings saved!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomain.trim()) {
      Alert.alert('Error', 'Please enter a domain first.');
      return;
    }

    setIsVerifying(true);
    try {
      // Clean domain
      let cleanDomain = customDomain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
      cleanDomain = cleanDomain.replace(/\/$/, '');

      // In a real implementation, you would:
      // 1. Call an edge function to check DNS records
      // 2. Verify CNAME points to tavvy.com
      // For now, we'll simulate the check

      // Simulated DNS check - in production, use an edge function
      const response = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=CNAME`);
      const data = await response.json();

      // Check if CNAME points to tavvy.com
      const hasTavvyCname = data.Answer?.some((record: any) => 
        record.data?.toLowerCase().includes('tavvy.com')
      );

      if (hasTavvyCname) {
        // Update verification status
        await supabase
          .from('digital_cards')
          .update({ 
            custom_domain: cleanDomain,
            custom_domain_verified: true 
          })
          .eq('id', cardId);

        setIsVerified(true);
        setCustomDomain(cleanDomain);
        Alert.alert('Success', 'Domain verified successfully! Your card is now accessible at ' + cleanDomain);
      } else {
        Alert.alert(
          'Domain Not Verified',
          'The CNAME record was not found. Please make sure you\'ve added the CNAME record pointing to tavvy.com and wait for DNS propagation (can take up to 48 hours).',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      Alert.alert(
        'Verification Failed',
        'Could not verify the domain. Please check your DNS settings and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Text copied to clipboard.');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Card Settings</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Card Settings</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#00C853" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Card Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Card Name</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Give this card a name to help you identify it (e.g., "Work Card", "Personal Card")
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
              color: theme.text,
              borderColor: theme.border,
            }]}
            value={cardName}
            onChangeText={setCardName}
            placeholder="Enter card name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Card URL */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Card URL</Text>
          <View style={[styles.urlBox, { backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5' }]}>
            <Ionicons name="link-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.urlText, { color: theme.text }]}>
              {CARD_URL_BASE}{slug}
            </Text>
            <TouchableOpacity onPress={() => copyToClipboard(CARD_URL_BASE + slug)}>
              <Ionicons name="copy-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Domain */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Custom Domain</Text>
            {!isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          
          {isPro ? (
            <>
              <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                Use your own domain for this card (e.g., card.yourdomain.com)
              </Text>
              
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
                  color: theme.text,
                  borderColor: isVerified ? '#00C853' : theme.border,
                }]}
                value={customDomain}
                onChangeText={(text) => {
                  setCustomDomain(text);
                  setIsVerified(false);
                }}
                placeholder="card.yourdomain.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#00C853" />
                  <Text style={styles.verifiedText}>Domain Verified</Text>
                </View>
              )}

              {customDomain.trim() && !isVerified && (
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={handleVerifyDomain}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                      <Text style={styles.verifyButtonText}>Verify Domain</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* DNS Instructions */}
              <View style={[styles.dnsInstructions, { backgroundColor: isDark ? '#1F1F1F' : '#F0F9FF' }]}>
                <View style={styles.dnsHeader}>
                  <Ionicons name="information-circle" size={20} color="#0EA5E9" />
                  <Text style={[styles.dnsTitle, { color: theme.text }]}>DNS Setup Instructions</Text>
                </View>
                <Text style={[styles.dnsText, { color: theme.textSecondary }]}>
                  To use a custom domain, add a CNAME record in your DNS settings:
                </Text>
                <View style={[styles.dnsRecord, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
                  <View style={styles.dnsRow}>
                    <Text style={[styles.dnsLabel, { color: theme.textSecondary }]}>Type:</Text>
                    <Text style={[styles.dnsValue, { color: theme.text }]}>CNAME</Text>
                  </View>
                  <View style={styles.dnsRow}>
                    <Text style={[styles.dnsLabel, { color: theme.textSecondary }]}>Name:</Text>
                    <Text style={[styles.dnsValue, { color: theme.text }]}>
                      {customDomain.split('.')[0] || 'card'}
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard(customDomain.split('.')[0] || 'card')}>
                      <Ionicons name="copy-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dnsRow}>
                    <Text style={[styles.dnsLabel, { color: theme.textSecondary }]}>Value:</Text>
                    <Text style={[styles.dnsValue, { color: theme.text }]}>tavvy.com</Text>
                    <TouchableOpacity onPress={() => copyToClipboard('tavvy.com')}>
                      <Ionicons name="copy-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.dnsNote, { color: theme.textSecondary }]}>
                  DNS changes can take up to 48 hours to propagate.
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.upgradeBox}
              onPress={() => navigation.navigate('ECardPremiumUpsell')}
            >
              <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
              <View style={styles.upgradeContent}>
                <Text style={[styles.upgradeTitle, { color: theme.text }]}>
                  Upgrade to Pro
                </Text>
                <Text style={[styles.upgradeDescription, { color: theme.textSecondary }]}>
                  Use your own domain for a professional look
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Card',
                'Are you sure you want to delete this card? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await supabase.from('card_links').delete().eq('card_id', cardId);
                        await supabase.from('digital_cards').delete().eq('id', cardId);
                        Alert.alert('Success', 'Card deleted.');
                        navigation.navigate('MyCards');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete card.');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete This Card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  proBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dnsInstructions: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  dnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dnsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  dnsText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  dnsRecord: {
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dnsLabel: {
    fontSize: 12,
    width: 50,
  },
  dnsValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  dnsNote: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
  upgradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
