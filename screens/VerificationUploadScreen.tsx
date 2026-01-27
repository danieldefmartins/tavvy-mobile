import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

interface DocumentUpload {
  type: 'license' | 'insurance' | 'bonding' | 'additional';
  uri: string;
  name: string;
  mimeType?: string;
}

interface VerificationData {
  id?: string;
  license_document_url?: string;
  insurance_document_url?: string;
  bonding_document_url?: string;
  additional_documents?: string[];
  license_number?: string;
  license_state?: string;
  business_name?: string;
  verification_status: string;
  is_licensed_verified: boolean;
  is_insured_verified: boolean;
  is_bonded_verified: boolean;
  is_tavvy_verified: boolean;
}

export default function VerificationUploadScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  
  // Document uploads
  const [licenseDoc, setLicenseDoc] = useState<DocumentUpload | null>(null);
  const [insuranceDoc, setInsuranceDoc] = useState<DocumentUpload | null>(null);
  const [bondingDoc, setBondingDoc] = useState<DocumentUpload | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<DocumentUpload[]>([]);

  useEffect(() => {
    loadVerificationData();
  }, [user]);

  const loadVerificationData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setVerificationData(data);
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async (type: 'license' | 'insurance' | 'bonding' | 'additional') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const doc: DocumentUpload = {
        type,
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        mimeType: result.assets[0].mimeType,
      };

      switch (type) {
        case 'license':
          setLicenseDoc(doc);
          break;
        case 'insurance':
          setInsuranceDoc(doc);
          break;
        case 'bonding':
          setBondingDoc(doc);
          break;
        case 'additional':
          setAdditionalDocs(prev => [...prev, doc]);
          break;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const pickImage = async (type: 'license' | 'insurance' | 'bonding' | 'additional') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const doc: DocumentUpload = {
        type,
        uri: result.assets[0].uri,
        name: `${type}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      };

      switch (type) {
        case 'license':
          setLicenseDoc(doc);
          break;
        case 'insurance':
          setInsuranceDoc(doc);
          break;
        case 'bonding':
          setBondingDoc(doc);
          break;
        case 'additional':
          setAdditionalDocs(prev => [...prev, doc]);
          break;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const showUploadOptions = (type: 'license' | 'insurance' | 'bonding' | 'additional') => {
    Alert.alert(
      'Upload Document',
      'Choose how you want to upload your document',
      [
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Gallery', onPress: () => pickImage(type) },
        { text: 'Choose PDF', onPress: () => pickDocument(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async (type: 'license' | 'insurance' | 'bonding' | 'additional') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const doc: DocumentUpload = {
        type,
        uri: result.assets[0].uri,
        name: `${type}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      };

      switch (type) {
        case 'license':
          setLicenseDoc(doc);
          break;
        case 'insurance':
          setInsuranceDoc(doc);
          break;
        case 'bonding':
          setBondingDoc(doc);
          break;
        case 'additional':
          setAdditionalDocs(prev => [...prev, doc]);
          break;
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadDocument = async (doc: DocumentUpload): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = doc.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${doc.type}_${Date.now()}.${fileExt}`;

      const response = await fetch(doc.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, blob, {
          contentType: doc.mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!licenseDoc && !insuranceDoc && !bondingDoc && additionalDocs.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document for verification.');
      return;
    }

    setIsSaving(true);

    try {
      // Upload all documents
      const uploadPromises: Promise<{ type: string; url: string | null }>[] = [];

      if (licenseDoc) {
        uploadPromises.push(
          uploadDocument(licenseDoc).then(url => ({ type: 'license', url }))
        );
      }
      if (insuranceDoc) {
        uploadPromises.push(
          uploadDocument(insuranceDoc).then(url => ({ type: 'insurance', url }))
        );
      }
      if (bondingDoc) {
        uploadPromises.push(
          uploadDocument(bondingDoc).then(url => ({ type: 'bonding', url }))
        );
      }
      for (const doc of additionalDocs) {
        uploadPromises.push(
          uploadDocument(doc).then(url => ({ type: 'additional', url }))
        );
      }

      const results = await Promise.all(uploadPromises);

      // Prepare update data
      const updateData: any = {
        user_id: user.id,
        verification_status: 'pending',
        updated_at: new Date().toISOString(),
      };

      const additionalUrls: string[] = verificationData?.additional_documents || [];

      for (const result of results) {
        if (result.url) {
          switch (result.type) {
            case 'license':
              updateData.license_document_url = result.url;
              break;
            case 'insurance':
              updateData.insurance_document_url = result.url;
              break;
            case 'bonding':
              updateData.bonding_document_url = result.url;
              break;
            case 'additional':
              additionalUrls.push(result.url);
              break;
          }
        }
      }

      if (additionalUrls.length > 0) {
        updateData.additional_documents = additionalUrls;
      }

      // Upsert verification record
      const { error } = await supabase
        .from('user_verifications')
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) throw error;

      Alert.alert(
        'Documents Submitted',
        'Your verification documents have been submitted for review. We will notify you once they are verified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting documents:', error);
      Alert.alert('Error', 'Failed to submit documents. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeDocument = (type: 'license' | 'insurance' | 'bonding', index?: number) => {
    switch (type) {
      case 'license':
        setLicenseDoc(null);
        break;
      case 'insurance':
        setInsuranceDoc(null);
        break;
      case 'bonding':
        setBondingDoc(null);
        break;
    }
    if (type === 'additional' && index !== undefined) {
      setAdditionalDocs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const renderDocumentUpload = (
    title: string,
    description: string,
    type: 'license' | 'insurance' | 'bonding',
    doc: DocumentUpload | null,
    existingUrl?: string,
    isVerified?: boolean
  ) => (
    <View style={styles.documentSection}>
      <View style={styles.documentHeader}>
        <View style={styles.documentTitleRow}>
          <Text style={styles.documentTitle}>{title}</Text>
          {isVerified && (
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.verifiedTagText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.documentDescription}>{description}</Text>
      </View>

      {doc ? (
        <View style={styles.uploadedDoc}>
          <View style={styles.uploadedDocInfo}>
            <Ionicons 
              name={doc.mimeType?.includes('pdf') ? 'document-text' : 'image'} 
              size={24} 
              color="#667eea" 
            />
            <Text style={styles.uploadedDocName} numberOfLines={1}>{doc.name}</Text>
          </View>
          <TouchableOpacity onPress={() => removeDocument(type)}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : existingUrl ? (
        <View style={styles.existingDoc}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={styles.existingDocText}>Document uploaded</Text>
          <TouchableOpacity 
            style={styles.replaceButton}
            onPress={() => showUploadOptions(type)}
          >
            <Text style={styles.replaceButtonText}>Replace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => showUploadOptions(type)}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#667eea" />
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Verified</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={32} color="#059669" />
          <View style={styles.infoBannerText}>
            <Text style={styles.infoBannerTitle}>Why Get Verified?</Text>
            <Text style={styles.infoBannerDescription}>
              Verified badges build trust with potential clients. Upload your business documents 
              and our team will review them within 24-48 hours.
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        {verificationData?.verification_status === 'pending' && (
          <View style={styles.statusBanner}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>Your documents are under review</Text>
          </View>
        )}

        {/* Document Uploads */}
        {renderDocumentUpload(
          'Business License',
          'State or local business license, contractor license, or professional certification',
          'license',
          licenseDoc,
          verificationData?.license_document_url,
          verificationData?.is_licensed_verified
        )}

        {renderDocumentUpload(
          'Insurance Certificate',
          'General liability insurance, professional liability, or workers compensation',
          'insurance',
          insuranceDoc,
          verificationData?.insurance_document_url,
          verificationData?.is_insured_verified
        )}

        {renderDocumentUpload(
          'Bonding Certificate',
          'Surety bond or fidelity bond documentation',
          'bonding',
          bondingDoc,
          verificationData?.bonding_document_url,
          verificationData?.is_bonded_verified
        )}

        {/* Additional Documents */}
        <View style={styles.documentSection}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle}>Additional Documents</Text>
            <Text style={styles.documentDescription}>
              Any other certifications, awards, or credentials you'd like to share
            </Text>
          </View>

          {additionalDocs.map((doc, index) => (
            <View key={index} style={styles.uploadedDoc}>
              <View style={styles.uploadedDocInfo}>
                <Ionicons 
                  name={doc.mimeType?.includes('pdf') ? 'document-text' : 'image'} 
                  size={24} 
                  color="#667eea" 
                />
                <Text style={styles.uploadedDocName} numberOfLines={1}>{doc.name}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setAdditionalDocs(prev => prev.filter((_, i) => i !== index));
              }}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => showUploadOptions('additional')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#667eea" />
            <Text style={styles.uploadButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          <LinearGradient 
            colors={['#059669', '#10B981']} 
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.submitText}>Submit for Verification</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you confirm that all documents are authentic and belong to your business.
          Verification typically takes 24-48 hours.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  infoBannerDescription: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 8,
    fontWeight: '500',
  },
  documentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  documentDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '500',
    marginLeft: 8,
  },
  uploadedDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  uploadedDocInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedDocName: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  existingDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
  },
  existingDocText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  replaceButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  replaceButtonText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
