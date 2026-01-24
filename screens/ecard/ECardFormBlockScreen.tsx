import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

// Form provider configurations
const FORM_PROVIDERS = [
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    icon: 'rocket-outline',
    color: '#FF6B35',
    description: 'CRM & Marketing Automation',
    placeholder: 'https://link.yourdomain.com/widget/form/...',
    helpText: 'Paste your GoHighLevel form embed URL',
    premium: false,
  },
  {
    id: 'typeform',
    name: 'Typeform',
    icon: 'chatbubbles-outline',
    color: '#262627',
    description: 'Beautiful conversational forms',
    placeholder: 'https://yourname.typeform.com/to/...',
    helpText: 'Paste your Typeform share URL',
    premium: false,
  },
  {
    id: 'google',
    name: 'Google Forms',
    icon: 'document-text-outline',
    color: '#673AB7',
    description: 'Free form builder',
    placeholder: 'https://docs.google.com/forms/d/e/.../viewform',
    helpText: 'Paste your Google Form share link',
    premium: false,
  },
  {
    id: 'jotform',
    name: 'JotForm',
    icon: 'clipboard-outline',
    color: '#FF6100',
    description: 'Powerful form builder',
    placeholder: 'https://form.jotform.com/...',
    helpText: 'Paste your JotForm share URL',
    premium: false,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    icon: 'calendar-outline',
    color: '#006BFF',
    description: 'Schedule meetings',
    placeholder: 'https://calendly.com/yourname/...',
    helpText: 'Paste your Calendly scheduling link',
    premium: false,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'business-outline',
    color: '#FF7A59',
    description: 'CRM forms & meetings',
    placeholder: 'https://share.hsforms.com/...',
    helpText: 'Paste your HubSpot form or meeting link',
    premium: true,
  },
  {
    id: 'custom',
    name: 'Custom Embed',
    icon: 'code-slash-outline',
    color: '#22C55E',
    description: 'Any embed URL',
    placeholder: 'https://...',
    helpText: 'Paste any embeddable form URL',
    premium: true,
  },
  {
    id: 'native',
    name: 'Built-in Contact Form',
    icon: 'mail-outline',
    color: '#3B82F6',
    description: 'Collect leads directly',
    placeholder: '',
    helpText: 'Create a native contact form',
    premium: false,
  },
];

interface FormConfig {
  provider: string;
  url: string;
  title: string;
  buttonText: string;
  enabled: boolean;
  fields?: string[]; // For native form
  webhookUrl?: string; // For native form
  emailNotification?: boolean;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardFormBlockScreen({ navigation, route }: Props) {
  const { cardId, existingConfig } = route.params || {};
  const { user, isPro } = useAuth();
  
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    existingConfig?.provider || null
  );
  const [formUrl, setFormUrl] = useState(existingConfig?.url || '');
  const [formTitle, setFormTitle] = useState(existingConfig?.title || 'Contact Me');
  const [buttonText, setButtonText] = useState(existingConfig?.buttonText || 'Get in Touch');
  const [isEnabled, setIsEnabled] = useState(existingConfig?.enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Native form settings
  const [collectName, setCollectName] = useState(true);
  const [collectEmail, setCollectEmail] = useState(true);
  const [collectPhone, setCollectPhone] = useState(true);
  const [collectMessage, setCollectMessage] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState(existingConfig?.webhookUrl || '');
  const [emailNotification, setEmailNotification] = useState(
    existingConfig?.emailNotification ?? true
  );

  const selectedProviderConfig = FORM_PROVIDERS.find(p => p.id === selectedProvider);

  const handleProviderSelect = (providerId: string) => {
    const provider = FORM_PROVIDERS.find(p => p.id === providerId);
    if (provider?.premium && !isPro) {
      Alert.alert(
        'Pro Feature',
        `${provider.name} integration is available for Pro users. Upgrade to unlock this feature.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('ECardPremiumUpsell') },
        ]
      );
      return;
    }
    setSelectedProvider(providerId);
    setFormUrl('');
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (selectedProvider !== 'native' && !validateUrl(formUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid form URL.');
      return;
    }

    setIsSaving(true);

    try {
      const fields = [];
      if (collectName) fields.push('name');
      if (collectEmail) fields.push('email');
      if (collectPhone) fields.push('phone');
      if (collectMessage) fields.push('message');

      const formConfig: FormConfig = {
        provider: selectedProvider!,
        url: formUrl,
        title: formTitle,
        buttonText: buttonText,
        enabled: isEnabled,
        ...(selectedProvider === 'native' && {
          fields,
          webhookUrl,
          emailNotification,
        }),
      };

      const { error } = await supabase
        .from('digital_cards')
        .update({ form_block: formConfig })
        .eq('id', cardId);

      if (error) throw error;

      Alert.alert('Success', 'Form block saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving form block:', error);
      Alert.alert('Error', 'Failed to save form block. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      'Remove Form Block',
      'Are you sure you want to remove the form from your card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const { error } = await supabase
                .from('digital_cards')
                .update({ form_block: null })
                .eq('id', cardId);

              if (error) throw error;
              navigation.goBack();
            } catch (error) {
              console.error('Error removing form block:', error);
              Alert.alert('Error', 'Failed to remove form block.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderProviderSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Form Provider</Text>
      <View style={styles.providersGrid}>
        {FORM_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.providerCard,
              selectedProvider === provider.id && styles.selectedProviderCard,
            ]}
            onPress={() => handleProviderSelect(provider.id)}
          >
            {provider.premium && !isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
            <View style={[styles.providerIcon, { backgroundColor: provider.color + '20' }]}>
              <Ionicons name={provider.icon as any} size={24} color={provider.color} />
            </View>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerDesc} numberOfLines={1}>
              {provider.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFormConfig = () => {
    if (!selectedProviderConfig) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configure Form</Text>
        
        {/* Form Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Form Title</Text>
          <TextInput
            style={styles.input}
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder="e.g., Contact Me, Get a Quote"
          />
        </View>

        {/* Button Text */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Button Text</Text>
          <TextInput
            style={styles.input}
            value={buttonText}
            onChangeText={setButtonText}
            placeholder="e.g., Get in Touch, Book Now"
          />
        </View>

        {selectedProvider === 'native' ? (
          // Native form configuration
          <>
            <Text style={styles.subsectionTitle}>Form Fields</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Name</Text>
              <Switch value={collectName} onValueChange={setCollectName} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Email</Text>
              <Switch value={collectEmail} onValueChange={setCollectEmail} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Phone</Text>
              <Switch value={collectPhone} onValueChange={setCollectPhone} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Message</Text>
              <Switch value={collectMessage} onValueChange={setCollectMessage} />
            </View>

            <Text style={styles.subsectionTitle}>Notifications</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Email me when someone submits</Text>
              <Switch value={emailNotification} onValueChange={setEmailNotification} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Webhook URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={webhookUrl}
                onChangeText={setWebhookUrl}
                placeholder="https://your-webhook-url.com/..."
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.helpText}>
                Send form submissions to your CRM or automation tool
              </Text>
            </View>
          </>
        ) : (
          // External form URL
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{selectedProviderConfig.name} URL</Text>
            <TextInput
              style={styles.input}
              value={formUrl}
              onChangeText={setFormUrl}
              placeholder={selectedProviderConfig.placeholder}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helpText}>{selectedProviderConfig.helpText}</Text>
          </View>
        )}

        {/* Enable/Disable Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show form on card</Text>
          <Switch value={isEnabled} onValueChange={setIsEnabled} />
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Form Block</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProviderSelection()}
        {renderFormConfig()}
        
        {existingConfig && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.removeButtonText}>Remove Form Block</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      {selectedProvider && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.savingButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Form Block</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 12,
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  providerCard: {
    width: '47%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedProviderCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  providerDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
