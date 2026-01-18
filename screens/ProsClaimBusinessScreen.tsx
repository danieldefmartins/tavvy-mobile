import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useTranslation } from 'react-i18next';

type VerificationMethod = 'phone' | 'email' | 'document';

export default function ProsClaimBusinessScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('phone');
  const [verificationCode, setVerificationCode] = useState('');

  const handleBack = () => { if (step > 1) setStep(step - 1); else navigation.goBack(); };
  const handleNext = () => {
    if (step === 1) { if (!businessName) { Alert.alert('Required', 'Please enter your business name.'); return; } setStep(2); }
    else if (step === 2) { if (!businessPhone && !businessEmail) { Alert.alert('Required', 'Please enter contact information.'); return; } setStep(3); }
    else if (step === 3) { setStep(4); }
    else if (step === 4) { if (verificationCode.length !== 6) { Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.'); return; }
      Alert.alert('Success!', 'Your business has been claimed. Welcome to TavvY Pros!', [{ text: 'Get Started', onPress: () => navigation.navigate('ProsDashboard') }]);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Your Business</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.progressWrapper}><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View><Text style={styles.stepIndicator}>Step {step} of 4</Text></View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your business name?</Text>
            <Text style={styles.stepSubtitle}>Enter the name customers would search for</Text>
            <TextInput style={styles.input} placeholder="e.g., Smith Plumbing Services" placeholderTextColor="#9CA3AF" value={businessName} onChangeText={setBusinessName} />
          </View>
        )}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Business contact information</Text>
            <Text style={styles.stepSubtitle}>We'll use this to verify your business</Text>
            <Text style={styles.inputLabel}>Business Phone</Text>
            <TextInput style={styles.input} placeholder="(555) 123-4567" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={businessPhone} onChangeText={setBusinessPhone} />
            <Text style={styles.inputLabel}>Business Email</Text>
            <TextInput style={styles.input} placeholder="contact@yourbusiness.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={businessEmail} onChangeText={setBusinessEmail} />
          </View>
        )}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How would you like to verify?</Text>
            <Text style={styles.stepSubtitle}>Choose a verification method</Text>
            {[{ id: 'phone' as VerificationMethod, icon: 'call', title: 'Phone Call', description: 'Receive a call with verification code' },
              { id: 'email' as VerificationMethod, icon: 'mail', title: 'Email', description: 'Receive code via email' },
              { id: 'document' as VerificationMethod, icon: 'document-text', title: 'Business Document', description: 'Upload a business license or utility bill' }
            ].map((method) => (
              <TouchableOpacity key={method.id} style={[styles.methodCard, verificationMethod === method.id && styles.methodCardSelected]} onPress={() => setVerificationMethod(method.id)}>
                <View style={styles.methodIcon}><Ionicons name={method.icon as any} size={24} color={verificationMethod === method.id ? ProsColors.primary : '#6B7280'} /></View>
                <View style={styles.methodContent}><Text style={styles.methodTitle}>{method.title}</Text><Text style={styles.methodDescription}>{method.description}</Text></View>
                <View style={[styles.radioButton, verificationMethod === method.id && styles.radioButtonSelected]}>{verificationMethod === method.id && <View style={styles.radioButtonInner} />}</View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.verificationIcon}><Ionicons name="shield-checkmark" size={48} color={ProsColors.primary} /></View>
            <Text style={styles.stepTitle}>Enter verification code</Text>
            <Text style={styles.stepSubtitle}>We sent a 6-digit code to {verificationMethod === 'phone' ? businessPhone : businessEmail}</Text>
            <TextInput style={styles.codeInput} placeholder="000000" placeholderTextColor="#9CA3AF" keyboardType="number-pad" maxLength={6} value={verificationCode} onChangeText={setVerificationCode} />
            <TouchableOpacity style={styles.resendButton}><Text style={styles.resendText}>Didn't receive a code? Resend</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}><Text style={styles.nextButtonText}>{step === 4 ? 'Verify & Claim' : 'Continue'}</Text><Ionicons name={step === 4 ? 'checkmark-circle' : 'arrow-forward'} size={20} color="#FFFFFF" /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  progressWrapper: { paddingHorizontal: 20, paddingVertical: 16 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ProsColors.primary, borderRadius: 3 },
  stepIndicator: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  content: { flex: 1, paddingHorizontal: 20 },
  stepContent: { paddingVertical: 24 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  methodCardSelected: { backgroundColor: '#EFF6FF', borderColor: ProsColors.primary },
  methodIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  methodDescription: { fontSize: 13, color: '#6B7280' },
  radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioButtonSelected: { borderColor: ProsColors.primary },
  radioButtonInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: ProsColors.primary },
  verificationIcon: { alignSelf: 'center', marginBottom: 24 },
  codeInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 16, fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', letterSpacing: 8 },
  resendButton: { marginTop: 16, alignSelf: 'center' },
  resendText: { color: ProsColors.primary, fontSize: 14, fontWeight: '500' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  nextButton: { backgroundColor: ProsColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
