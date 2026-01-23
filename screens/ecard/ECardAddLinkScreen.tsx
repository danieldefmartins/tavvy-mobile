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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Link types configuration
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

interface Props {
  navigation: any;
  route: any;
}

export default function ECardAddLinkScreen({ navigation, route }: Props) {
  const { onAdd } = route.params || {};
  
  const [selectedType, setSelectedType] = useState<any>(null);
  const [linkValue, setLinkValue] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [step, setStep] = useState<'select' | 'edit'>('select');

  const handleSelectType = (type: any) => {
    setSelectedType(type);
    setLinkTitle(type.name);
    setStep('edit');
  };

  const handleSave = () => {
    if (!linkValue.trim()) return;
    
    const newLink = {
      id: `${selectedType.id}-${Date.now()}`,
      platform: selectedType.id,
      value: linkValue,
      title: linkTitle || selectedType.name,
      clicks: 0,
    };
    
    if (onAdd) {
      onAdd(newLink);
    }
    navigation.goBack();
  };

  const renderSelectStep = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {LINK_TYPES.map((category) => (
        <View key={category.category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category.category}</Text>
          <View style={styles.categoryGrid}>
            {category.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.linkTypeCard}
                onPress={() => handleSelectType(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.linkTypeIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.linkTypeName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderEditStep = () => (
    <KeyboardAvoidingView 
      style={styles.editContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.editScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Type Preview */}
        <View style={styles.selectedTypePreview}>
          <View style={[styles.selectedTypeIcon, { backgroundColor: selectedType?.color + '15' }]}>
            <Ionicons name={selectedType?.icon as any} size={32} color={selectedType?.color} />
          </View>
          <Text style={styles.selectedTypeName}>{selectedType?.name}</Text>
          <TouchableOpacity onPress={() => setStep('select')}>
            <Text style={styles.changeTypeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Button Title</Text>
            <TextInput
              style={styles.input}
              placeholder={selectedType?.name || 'Link title'}
              placeholderTextColor="#BDBDBD"
              value={linkTitle}
              onChangeText={setLinkTitle}
            />
          </View>

          {/* URL/Value */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {selectedType?.id === 'email' ? 'Email Address' : 
               selectedType?.id === 'phone' ? 'Phone Number' :
               selectedType?.id === 'header' ? 'Header Text' : 'URL / Username'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={selectedType?.placeholder || 'Enter value'}
              placeholderTextColor="#BDBDBD"
              value={linkValue}
              onChangeText={setLinkValue}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={
                selectedType?.id === 'email' ? 'email-address' : 
                selectedType?.id === 'phone' || selectedType?.id === 'whatsapp' ? 'phone-pad' : 
                'default'
              }
            />
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewButton}>
              <View style={[styles.previewIcon, { backgroundColor: selectedType?.color + '15' }]}>
                <Ionicons name={selectedType?.icon as any} size={18} color={selectedType?.color} />
              </View>
              <Text style={styles.previewButtonText}>{linkTitle || selectedType?.name}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, !linkValue.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!linkValue.trim()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={linkValue.trim() ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[styles.saveButtonText, !linkValue.trim() && styles.saveButtonTextDisabled]}>
              Add Link
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => step === 'edit' ? setStep('select') : navigation.goBack()}
        >
          <Ionicons name={step === 'edit' ? 'arrow-back' : 'close'} size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'select' ? 'Add Link' : 'Edit Link'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'select' ? renderSelectStep() : renderEditStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  linkTypeCard: {
    width: '31%',
    marginHorizontal: '1.16%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  linkTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  editContainer: {
    flex: 1,
  },
  editScrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  selectedTypePreview: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
  },
  selectedTypeIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedTypeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  changeTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
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
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewSection: {
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
