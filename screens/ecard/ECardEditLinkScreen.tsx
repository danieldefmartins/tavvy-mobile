import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Link types configuration (same as AddLink)
const LINK_TYPES = [
  {
    category: 'Social Media',
    items: [
      { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', placeholder: 'username' },
      { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000', placeholder: '@username' },
      { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'channel' },
      { id: 'twitter', name: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2', placeholder: 'username' },
      { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', placeholder: 'username' },
      { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'username' },
      { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', placeholder: 'username' },
      { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', placeholder: 'username' },
      { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2', placeholder: 'invite code' },
    ],
  },
  {
    category: 'Music',
    items: [
      { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954', placeholder: 'profile link' },
      { id: 'apple_music', name: 'Apple Music', icon: 'musical-note', color: '#FA243C', placeholder: 'profile link' },
      { id: 'soundcloud', name: 'SoundCloud', icon: 'cloud', color: '#FF5500', placeholder: 'username' },
    ],
  },
  {
    category: 'Contact',
    items: [
      { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335', placeholder: 'your@email.com' },
      { id: 'phone', name: 'Phone', icon: 'call', color: '#34C759', placeholder: '+1 234 567 8900' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', placeholder: 'phone number' },
      { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088CC', placeholder: 'username' },
    ],
  },
  {
    category: 'Portfolio',
    items: [
      { id: 'website', name: 'Website', icon: 'globe', color: '#4A90D9', placeholder: 'yourwebsite.com' },
      { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717', placeholder: 'username' },
      { id: 'dribbble', name: 'Dribbble', icon: 'logo-dribbble', color: '#EA4C89', placeholder: 'username' },
      { id: 'behance', name: 'Behance', icon: 'color-palette', color: '#1769FF', placeholder: 'username' },
    ],
  },
  {
    category: 'Other',
    items: [
      { id: 'custom', name: 'Custom Link', icon: 'link', color: '#8E8E93', placeholder: 'https://...' },
      { id: 'header', name: 'Header / Divider', icon: 'remove', color: '#666', placeholder: 'Section title' },
    ],
  },
];

// Flatten link types for easy lookup
const ALL_LINK_TYPES = LINK_TYPES.flatMap(cat => cat.items);

interface LinkItem {
  id: string;
  platform: string;
  value: string;
  title: string;
  clicks?: number;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardEditLinkScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { link, onSave, onDelete } = route.params || {};
  
  // Find the link type configuration
  const linkTypeConfig = ALL_LINK_TYPES.find(t => t.id === link?.platform) || {
    id: 'custom',
    name: 'Custom Link',
    icon: 'link',
    color: '#8E8E93',
    placeholder: 'https://...',
  };
  
  const [linkValue, setLinkValue] = useState(link?.value || '');
  const [linkTitle, setLinkTitle] = useState(link?.title || linkTypeConfig.name);

  const handleSave = () => {
    if (!linkValue.trim()) {
      Alert.alert('Missing Value', 'Please enter a value for this link.');
      return;
    }
    
    const updatedLink: LinkItem = {
      ...link,
      value: linkValue.trim(),
      title: linkTitle.trim() || linkTypeConfig.name,
    };
    
    if (onSave) {
      onSave(updatedLink);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(link.id);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Link</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Type Preview */}
          <View style={styles.selectedTypePreview}>
            <View style={[styles.selectedTypeIcon, { backgroundColor: linkTypeConfig.color + '15' }]}>
              <Ionicons name={linkTypeConfig.icon as any} size={32} color={linkTypeConfig.color} />
            </View>
            <Text style={styles.selectedTypeName}>{linkTypeConfig.name}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Button Title</Text>
              <TextInput
                style={styles.input}
                placeholder={linkTypeConfig.name}
                placeholderTextColor="#BDBDBD"
                value={linkTitle}
                onChangeText={setLinkTitle}
              />
            </View>

            {/* URL/Value */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {linkTypeConfig.id === 'email' ? 'Email Address' : 
                 linkTypeConfig.id === 'phone' ? 'Phone Number' :
                 linkTypeConfig.id === 'header' ? 'Header Text' : 'URL / Username'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={linkTypeConfig.placeholder}
                placeholderTextColor="#BDBDBD"
                value={linkValue}
                onChangeText={setLinkValue}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={
                  linkTypeConfig.id === 'email' ? 'email-address' : 
                  linkTypeConfig.id === 'phone' || linkTypeConfig.id === 'whatsapp' ? 'phone-pad' : 
                  'default'
                }
              />
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewButton}>
                <View style={[styles.previewIcon, { backgroundColor: linkTypeConfig.color + '15' }]}>
                  <Ionicons name={linkTypeConfig.icon as any} size={18} color={linkTypeConfig.color} />
                </View>
                <Text style={styles.previewButtonText}>{linkTitle || linkTypeConfig.name}</Text>
              </View>
            </View>

            {/* Stats */}
            {link?.clicks !== undefined && (
              <View style={styles.statsSection}>
                <Text style={styles.statsLabel}>Link Statistics</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="finger-print-outline" size={20} color="#22C55E" />
                    <Text style={styles.statValue}>{link.clicks || 0}</Text>
                    <Text style={styles.statLabel}>Clicks</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  selectedTypePreview: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  selectedTypeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedTypeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewSection: {
    marginTop: 12,
    gap: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  statsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    gap: 12,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
  },
  statLabel: {
    fontSize: 12,
    color: '#166534',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
