/**
 * Form Block Preview Component
 * Shows a preview of the form on the card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBlockData {
  formType: 'native' | 'gohighlevel' | 'typeform' | 'jotform' | 'googleforms' | 'calendly' | 'webhook';
  title: string;
  description?: string;
  buttonText: string;
  fields?: FormField[];
  successMessage?: string;
  ghlFormId?: string;
  ghlLocationId?: string;
  ghlWebhookUrl?: string;
  ghlEmbedCode?: string;
  embedUrl?: string;
  embedCode?: string;
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
}

interface FormBlockPreviewProps {
  data: FormBlockData;
  accentColor?: string;
  cardSlug?: string;
  cardOwnerName?: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
  { id: '3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: false },
  { id: '4', type: 'textarea', label: 'Message', placeholder: 'How can I help you?', required: false },
];

export const FormBlockPreview: React.FC<FormBlockPreviewProps> = ({
  data,
  accentColor = '#6366f1',
  cardSlug,
  cardOwnerName,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const fields = data.fields || DEFAULT_FIELDS;

  const handleSubmit = async () => {
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !formData[f.id])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      Alert.alert('Required Fields', `Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const submitData = {
        ...formData,
        source: 'tavvy_card',
        cardSlug,
        cardOwnerName,
        submittedAt: new Date().toISOString(),
      };

      // Determine where to send
      let webhookUrl = data.webhookUrl;
      if (data.formType === 'gohighlevel' && data.ghlWebhookUrl) {
        webhookUrl = data.ghlWebhookUrl;
      }

      if (webhookUrl) {
        const method = data.webhookMethod || 'POST';
        
        if (method === 'POST') {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitData),
          });
        } else {
          const params = new URLSearchParams(submitData as any).toString();
          await fetch(`${webhookUrl}?${params}`);
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openExternalForm = () => {
    const url = data.embedUrl;
    if (url) {
      Linking.openURL(url);
    }
  };

  // Show success message
  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={[styles.successContainer, { backgroundColor: `${accentColor}15` }]}>
          <View style={[styles.successIcon, { backgroundColor: accentColor }]}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>
            {data.successMessage || "We'll be in touch soon."}
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setIsSubmitted(false);
              setFormData({});
            }}
          >
            <Text style={[styles.resetButtonText, { color: accentColor }]}>
              Submit Another
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render embedded form (GHL, Typeform, etc.)
  if (showEmbed && (data.ghlEmbedCode || data.embedCode || data.embedUrl)) {
    const embedHtml = data.ghlEmbedCode || data.embedCode;
    const embedUrl = data.embedUrl;

    if (embedHtml) {
      return (
        <View style={styles.container}>
          <View style={styles.embedHeader}>
            <TouchableOpacity onPress={() => setShowEmbed(false)}>
              <Ionicons name="close-circle" size={28} color="#666" />
            </TouchableOpacity>
          </View>
          <WebView
            style={styles.webview}
            source={{ html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; padding: 0; }
                  iframe { width: 100%; height: 100vh; border: none; }
                </style>
              </head>
              <body>${embedHtml}</body>
              </html>
            `}}
            javaScriptEnabled
          />
        </View>
      );
    }

    if (embedUrl) {
      return (
        <View style={styles.container}>
          <View style={styles.embedHeader}>
            <TouchableOpacity onPress={() => setShowEmbed(false)}>
              <Ionicons name="close-circle" size={28} color="#666" />
            </TouchableOpacity>
          </View>
          <WebView
            style={styles.webview}
            source={{ uri: embedUrl }}
            javaScriptEnabled
          />
        </View>
      );
    }
  }

  // For external forms, show a button to open
  if (['typeform', 'jotform', 'googleforms', 'calendly'].includes(data.formType) && data.embedUrl) {
    return (
      <View style={styles.container}>
        {data.title && <Text style={styles.title}>{data.title}</Text>}
        {data.description && <Text style={styles.description}>{data.description}</Text>}
        
        <TouchableOpacity
          style={[styles.externalButton, { backgroundColor: accentColor }]}
          onPress={() => setShowEmbed(true)}
        >
          <Ionicons
            name={
              data.formType === 'calendly' ? 'calendar' :
              data.formType === 'typeform' ? 'chatbubbles' :
              'document-text'
            }
            size={20}
            color="#fff"
          />
          <Text style={styles.externalButtonText}>
            {data.formType === 'calendly' ? 'Book Appointment' :
             data.buttonText || 'Open Form'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.openExternalLink}
          onPress={openExternalForm}
        >
          <Text style={[styles.openExternalText, { color: accentColor }]}>
            Open in browser
          </Text>
          <Ionicons name="open-outline" size={14} color={accentColor} />
        </TouchableOpacity>
      </View>
    );
  }

  // For GHL embed, show button to open embed
  if (data.formType === 'gohighlevel' && data.ghlEmbedCode && !data.ghlWebhookUrl) {
    return (
      <View style={styles.container}>
        {data.title && <Text style={styles.title}>{data.title}</Text>}
        {data.description && <Text style={styles.description}>{data.description}</Text>}
        
        <TouchableOpacity
          style={[styles.externalButton, { backgroundColor: accentColor }]}
          onPress={() => setShowEmbed(true)}
        >
          <Ionicons name="rocket" size={20} color="#fff" />
          <Text style={styles.externalButtonText}>
            {data.buttonText || 'Open Form'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Native form or webhook form
  return (
    <View style={styles.container}>
      {data.title && <Text style={styles.title}>{data.title}</Text>}
      {data.description && <Text style={styles.description}>{data.description}</Text>}
      
      <View style={styles.form}>
        {fields.map(field => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            
            {field.type === 'textarea' ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData[field.id] || ''}
                onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
                placeholder={field.placeholder}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={formData[field.id] || ''}
                onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
                placeholder={field.placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={
                  field.type === 'email' ? 'email-address' :
                  field.type === 'phone' ? 'phone-pad' :
                  'default'
                }
                autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
              />
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: accentColor }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitButtonText}>
                {data.buttonText || 'Send Message'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f9fafb',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: 20,
    padding: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  externalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  openExternalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
  },
  openExternalText: {
    fontSize: 13,
    marginRight: 4,
  },
  embedHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  webview: {
    flex: 1,
    minHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default FormBlockPreview;
