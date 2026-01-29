import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProsRequestStep5Screen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { requestData } = route.params || { requestData: {} };
  const { createRequest, loading } = useProsPendingRequests();
  const { user } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Check if user is logged in
  const isLoggedIn = !!user;

  const handleSubmit = async () => {
    try {
      const result = await createRequest(requestData);
      if (result) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.warn('Submission error:', error);
      Alert.alert('Submission Failed', error.message || 'Please try again.');
    }
  };

  const handleSignup = () => {
    setShowSuccessModal(false);
    navigation.navigate('SignUp', { email: requestData.email });
  };

  const handleSkip = () => {
    setShowSuccessModal(false);
    navigation.getParent()?.getParent()?.navigate('Home');
  };

  const handleViewRequests = () => {
    setShowSuccessModal(false);
    // Navigate to project status or leads screen
    navigation.navigate('ProsProjectStatus', { requestData });
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    navigation.getParent()?.getParent()?.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Submit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Ready to send your request?</Text>
        <Text style={styles.subtitle}>Review your details below before submitting to pros.</Text>

        <View style={styles.reviewCard}>
          <Text style={styles.sectionLabel}>SERVICE</Text>
          <Text style={styles.sectionValue}>{requestData.categoryName || 'Service'}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>CUSTOMER INFO</Text>
          <Text style={styles.sectionValue}>{requestData.customerName || user?.user_metadata?.display_name || 'Guest'}</Text>
          <Text style={styles.subValue}>{requestData.email || user?.email}</Text>
          <Text style={styles.subValue}>{requestData.phone}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>LOCATION</Text>
          <Text style={styles.sectionValue}>{requestData.address}</Text>
          <Text style={styles.subValue}>{requestData.city}, {requestData.state} {requestData.zipCode}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.sectionValue}>{requestData.description || 'No description provided'}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request</Text>
              <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 10 }} />
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>

      {/* Success Modal - Different content based on auth status */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#00875A" />
            </View>
            <Text style={styles.modalTitle}>Request Submitted!</Text>
            
            {isLoggedIn ? (
              // LOGGED IN USER - Show success message without signup prompt
              <>
                <Text style={styles.modalText}>
                  Your request has been sent to local pros. You'll receive notifications when pros respond.
                </Text>
                
                <TouchableOpacity style={styles.signupButton} onPress={handleViewRequests}>
                  <Text style={styles.signupButtonText}>View My Requests</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.skipButton} onPress={handleGoHome}>
                  <Text style={styles.skipButtonText}>Go to Home</Text>
                </TouchableOpacity>
              </>
            ) : (
              // GUEST USER - Show signup prompt
              <>
                <Text style={styles.modalText}>
                  Sign up now to get real-time notifications and chat directly with pros who respond to your request.
                </Text>
                
                <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                  <Text style={styles.signupButtonText}>Sign Up Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
                
                <Text style={styles.privacyNote}>
                  Your contact info stays private until you approve a pro.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  reviewCard: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 4 },
  sectionValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  subValue: { fontSize: 15, color: '#666', marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  submitButton: { backgroundColor: '#00875A', flexDirection: 'row', padding: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabledButton: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  disclaimer: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 15, marginBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center' },
  successIcon: { marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  modalText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  signupButton: { backgroundColor: '#00875A', width: '100%', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  skipButton: { width: '100%', padding: 15, alignItems: 'center' },
  skipButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  privacyNote: { fontSize: 12, color: '#999', marginTop: 20, textAlign: 'center' }
});
