/**
 * Form Block Editor Component
 * Allows users to add lead capture forms with various integrations
 * 
 * Supported Integrations:
 * - Native Tavvy Form (simple lead capture)
 * - Go High Level (GHL) - Embed or webhook
 * - Typeform
 * - JotForm
 * - Google Forms
 * - Calendly
 * - Custom Webhook
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
}

interface FormBlockData {
  formType: 'native' | 'gohighlevel' | 'typeform' | 'jotform' | 'googleforms' | 'calendly' | 'webhook';
  title: string;
  description?: string;
  buttonText: string;
  
  // Native form fields
  fields?: FormField[];
  successMessage?: string;
  
  // Go High Level
  ghlFormId?: string;
  ghlLocationId?: string;
  ghlWebhookUrl?: string;
  ghlEmbedCode?: string;
  
  // External embeds
  embedUrl?: string;
  embedCode?: string;
  
  // Webhook
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
}

interface FormBlockEditorProps {
  data: FormBlockData;
  onChange: (data: FormBlockData) => void;
  accentColor?: string;
}

const FORM_TYPES = [
  { id: 'native', name: 'Tavvy Form', icon: 'document-text', description: 'Simple lead capture' },
  { id: 'gohighlevel', name: 'Go High Level', icon: 'rocket', description: 'GHL forms & webhooks' },
  { id: 'typeform', name: 'Typeform', icon: 'chatbubbles', description: 'Interactive forms' },
  { id: 'jotform', name: 'JotForm', icon: 'clipboard', description: 'Powerful forms' },
  { id: 'googleforms', name: 'Google Forms', icon: 'logo-google', description: 'Free forms' },
  { id: 'calendly', name: 'Calendly', icon: 'calendar', description: 'Scheduling' },
  { id: 'webhook', name: 'Custom Webhook', icon: 'code-slash', description: 'Send to any URL' },
];

const DEFAULT_FIELDS: FormField[] = [
  { id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
  { id: '3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: false },
  { id: '4', type: 'textarea', label: 'Message', placeholder: 'How can I help you?', required: false },
];

export const FormBlockEditor: React.FC<FormBlockEditorProps> = ({
  data,
  onChange,
  accentColor = '#6366f1',
}) => {
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const updateData = (updates: Partial<FormBlockData>) => {
    onChange({ ...data, ...updates });
  };

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
    };
    updateData({ fields: [...(data.fields || []), newField] });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const fields = (data.fields || []).map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    updateData({ fields });
  };

  const removeField = (fieldId: string) => {
    const fields = (data.fields || []).filter(f => f.id !== fieldId);
    updateData({ fields });
  };

  const openGHLHelp = () => {
    Alert.alert(
      'Go High Level Integration',
      'To integrate with Go High Level:\n\n' +
      '1. Form Embed: Copy your GHL form embed code\n\n' +
      '2. Webhook: Use your GHL webhook URL to send leads directly to your CRM\n\n' +
      'Find these in your GHL account under:\nSites → Forms → [Your Form] → Embed/Webhook',
      [
        { text: 'Learn More', onPress: () => Linking.openURL('https://help.gohighlevel.com/') },
        { text: 'OK' },
      ]
    );
  };

  const renderFormTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Form Type</Text>
      <View style={styles.formTypeGrid}>
        {FORM_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.formTypeCard,
              data.formType === type.id && { borderColor: accentColor, backgroundColor: `${accentColor}15` },
            ]}
            onPress={() => updateData({ formType: type.id as FormBlockData['formType'] })}
          >
            <View style={[styles.formTypeIcon, data.formType === type.id && { backgroundColor: accentColor }]}>
              <Ionicons
                name={type.icon as any}
                size={20}
                color={data.formType === type.id ? '#fff' : '#666'}
              />
            </View>
            <Text style={[styles.formTypeName, data.formType === type.id && { color: accentColor }]}>
              {type.name}
            </Text>
            <Text style={styles.formTypeDesc}>{type.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNativeFormEditor = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Form Fields</Text>
      <Text style={styles.sectionHint}>Customize the fields on your lead capture form</Text>
      
      {(data.fields || DEFAULT_FIELDS).map((field, index) => (
        <View key={field.id} style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldInfo}>
              <Ionicons
                name={
                  field.type === 'email' ? 'mail' :
                  field.type === 'phone' ? 'call' :
                  field.type === 'textarea' ? 'document-text' :
                  'text'
                }
                size={18}
                color="#666"
              />
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {field.required && <Text style={styles.requiredBadge}>Required</Text>}
            </View>
            <View style={styles.fieldActions}>
              <TouchableOpacity
                style={styles.fieldAction}
                onPress={() => {
                  setEditingField(field);
                  setShowFieldEditor(true);
                }}
              >
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fieldAction}
                onPress={() => removeField(field.id)}
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addFieldButton} onPress={addField}>
        <Ionicons name="add-circle" size={20} color={accentColor} />
        <Text style={[styles.addFieldText, { color: accentColor }]}>Add Field</Text>
      </TouchableOpacity>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Success Message</Text>
        <TextInput
          style={styles.textInput}
          value={data.successMessage || 'Thank you! We\'ll be in touch soon.'}
          onChangeText={(text) => updateData({ successMessage: text })}
          placeholder="Message shown after form submission"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderGHLEditor = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Go High Level Settings</Text>
        <TouchableOpacity onPress={openGHLHelp}>
          <Ionicons name="help-circle" size={22} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.ghlOptions}>
        <TouchableOpacity
          style={[
            styles.ghlOption,
            !data.ghlWebhookUrl && { borderColor: accentColor, backgroundColor: `${accentColor}15` },
          ]}
          onPress={() => updateData({ ghlWebhookUrl: undefined })}
        >
          <Ionicons name="code-slash" size={24} color={!data.ghlWebhookUrl ? accentColor : '#666'} />
          <Text style={[styles.ghlOptionTitle, !data.ghlWebhookUrl && { color: accentColor }]}>
            Embed Form
          </Text>
          <Text style={styles.ghlOptionDesc}>Paste your GHL form embed code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.ghlOption,
            data.ghlWebhookUrl && { borderColor: accentColor, backgroundColor: `${accentColor}15` },
          ]}
          onPress={() => updateData({ ghlWebhookUrl: data.ghlWebhookUrl || '' })}
        >
          <Ionicons name="git-network" size={24} color={data.ghlWebhookUrl ? accentColor : '#666'} />
          <Text style={[styles.ghlOptionTitle, data.ghlWebhookUrl && { color: accentColor }]}>
            Webhook
          </Text>
          <Text style={styles.ghlOptionDesc}>Send leads directly to GHL</Text>
        </TouchableOpacity>
      </View>
      
      {!data.ghlWebhookUrl ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>GHL Form Embed Code</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={data.ghlEmbedCode || ''}
            onChangeText={(text) => updateData({ ghlEmbedCode: text })}
            placeholder='<iframe src="https://api.leadconnectorhq.com/widget/form/..." ...'
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.inputHint}>
            Find this in GHL: Sites → Forms → [Your Form] → Embed
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>GHL Webhook URL</Text>
            <TextInput
              style={styles.textInput}
              value={data.ghlWebhookUrl || ''}
              onChangeText={(text) => updateData({ ghlWebhookUrl: text })}
              placeholder="https://services.leadconnectorhq.com/hooks/..."
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.inputHint}>
              Find this in GHL: Automation → Webhooks
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location ID (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={data.ghlLocationId || ''}
              onChangeText={(text) => updateData({ ghlLocationId: text })}
              placeholder="Your GHL Location ID"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>
          
          {/* Show native form fields for webhook mode */}
          {renderNativeFormEditor()}
        </>
      )}
    </View>
  );

  const renderEmbedEditor = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {data.formType === 'typeform' ? 'Typeform' :
         data.formType === 'jotform' ? 'JotForm' :
         data.formType === 'googleforms' ? 'Google Forms' :
         data.formType === 'calendly' ? 'Calendly' : 'Form'} Settings
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Embed URL or Code</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={data.embedUrl || data.embedCode || ''}
          onChangeText={(text) => {
            if (text.startsWith('<')) {
              updateData({ embedCode: text, embedUrl: undefined });
            } else {
              updateData({ embedUrl: text, embedCode: undefined });
            }
          }}
          placeholder={
            data.formType === 'typeform' ? 'https://yourname.typeform.com/to/xxxxx' :
            data.formType === 'jotform' ? 'https://form.jotform.com/xxxxx' :
            data.formType === 'googleforms' ? 'https://docs.google.com/forms/d/e/xxxxx/viewform' :
            data.formType === 'calendly' ? 'https://calendly.com/yourname/meeting' :
            'Paste your form URL or embed code'
          }
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          autoCapitalize="none"
        />
      </View>
      
      {data.formType === 'calendly' && (
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={18} color="#f59e0b" />
          <Text style={styles.tipText}>
            Calendly will show your availability calendar so visitors can book directly.
          </Text>
        </View>
      )}
    </View>
  );

  const renderWebhookEditor = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Custom Webhook</Text>
      <Text style={styles.sectionHint}>Send form submissions to any URL (Zapier, Make, custom API, etc.)</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Webhook URL</Text>
        <TextInput
          style={styles.textInput}
          value={data.webhookUrl || ''}
          onChangeText={(text) => updateData({ webhookUrl: text })}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Method</Text>
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodOption,
              (data.webhookMethod || 'POST') === 'POST' && { backgroundColor: accentColor },
            ]}
            onPress={() => updateData({ webhookMethod: 'POST' })}
          >
            <Text style={[
              styles.methodText,
              (data.webhookMethod || 'POST') === 'POST' && { color: '#fff' },
            ]}>POST</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodOption,
              data.webhookMethod === 'GET' && { backgroundColor: accentColor },
            ]}
            onPress={() => updateData({ webhookMethod: 'GET' })}
          >
            <Text style={[
              styles.methodText,
              data.webhookMethod === 'GET' && { color: '#fff' },
            ]}>GET</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Show native form fields for webhook */}
      {renderNativeFormEditor()}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Form Title & Description */}
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Form Title</Text>
          <TextInput
            style={styles.textInput}
            value={data.title || ''}
            onChangeText={(text) => updateData({ title: text })}
            placeholder="Get in Touch"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={data.description || ''}
            onChangeText={(text) => updateData({ description: text })}
            placeholder="Fill out the form below and I'll get back to you within 24 hours."
            placeholderTextColor="#999"
            multiline
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Button Text</Text>
          <TextInput
            style={styles.textInput}
            value={data.buttonText || ''}
            onChangeText={(text) => updateData({ buttonText: text })}
            placeholder="Send Message"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      {/* Form Type Selector */}
      {renderFormTypeSelector()}
      
      {/* Type-specific editors */}
      {data.formType === 'native' && renderNativeFormEditor()}
      {data.formType === 'gohighlevel' && renderGHLEditor()}
      {['typeform', 'jotform', 'googleforms', 'calendly'].includes(data.formType) && renderEmbedEditor()}
      {data.formType === 'webhook' && renderWebhookEditor()}
      
      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipItem}>• Keep forms short - 3-4 fields max for best conversion</Text>
        <Text style={styles.tipItem}>• Use Go High Level webhook to auto-add leads to your CRM</Text>
        <Text style={styles.tipItem}>• Calendly is great for service pros who need to book appointments</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  formTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  formTypeCard: {
    width: '48%',
    margin: '1%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  formTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  formTypeDesc: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  fieldCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
  },
  requiredBadge: {
    fontSize: 10,
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: '600',
  },
  fieldActions: {
    flexDirection: 'row',
  },
  fieldAction: {
    padding: 8,
    marginLeft: 4,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 16,
  },
  addFieldText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  ghlOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ghlOption: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ghlOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  ghlOptionDesc: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 10,
    lineHeight: 18,
  },
  methodSelector: {
    flexDirection: 'row',
  },
  methodOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tipsSection: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default FormBlockEditor;
