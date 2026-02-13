import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

// NFC Manager will be conditionally imported
let NfcManager: any = null;
let NfcTech: any = null;
let Ndef: any = null;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default;
  NfcTech = nfcModule.NfcTech;
  Ndef = nfcModule.Ndef;
} catch (e) {
  // NFC not available
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardNFCWriteScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { cardSlug, cardName } = route.params || {};
  const cardUrl = `https://tavvy.com/${cardSlug}`;
  
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);
  const [isNfcEnabled, setIsNfcEnabled] = useState<boolean | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    checkNfcSupport();
    return () => {
      if (NfcManager) {
        NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (isWriting) {
      // Pulse animation while writing
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isWriting]);

  const checkNfcSupport = async () => {
    if (!NfcManager) {
      setIsNfcSupported(false);
      return;
    }

    try {
      const supported = await NfcManager.isSupported();
      setIsNfcSupported(supported);
      
      if (supported) {
        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();
        setIsNfcEnabled(enabled);
      }
    } catch (error) {
      console.error('NFC check error:', error);
      setIsNfcSupported(false);
    }
  };

  const writeNfcTag = async () => {
    if (!NfcManager || !isNfcSupported || !isNfcEnabled) {
      Alert.alert('NFC Not Available', 'Please enable NFC in your device settings.');
      return;
    }

    setIsWriting(true);
    setWriteSuccess(false);

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Create NDEF message with URL
      const bytes = Ndef.encodeMessage([
        Ndef.uriRecord(cardUrl),
      ]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        setWriteSuccess(true);
        Alert.alert(
          'Success!',
          `Your card URL has been written to the NFC tag.\n\nAnyone can tap this tag to view your card at:\n${cardUrl}`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('NFC write error:', error);
      if (error.message?.includes('cancelled')) {
        // User cancelled
      } else {
        Alert.alert(
          'Write Failed',
          'Could not write to the NFC tag. Make sure the tag is writable and try again.'
        );
      }
    } finally {
      setIsWriting(false);
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {}
    }
  };

  const cancelWrite = async () => {
    setIsWriting(false);
    if (NfcManager) {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {}
    }
  };

  const renderNfcNotSupported = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Ionicons name="wifi-outline" size={60} color="#F97316" style={{ transform: [{ rotate: '90deg' }] }} />
      </View>
      <Text style={styles.title}>NFC Not Available</Text>
      <Text style={styles.subtitle}>
        {!NfcManager 
          ? 'NFC functionality requires a development build. This feature will be available in the production app.'
          : 'Your device does not support NFC.'}
      </Text>
      
      <View style={styles.alternativesSection}>
        <Text style={styles.alternativesTitle}>Other ways to share your card:</Text>
        
        <TouchableOpacity 
          style={styles.alternativeOption}
          onPress={() => {
            navigation.goBack();
            // The QR code option is available on the main screen
          }}
        >
          <View style={styles.alternativeIcon}>
            <Ionicons name="qr-code-outline" size={24} color="#22C55E" />
          </View>
          <View style={styles.alternativeText}>
            <Text style={styles.alternativeLabel}>QR Code</Text>
            <Text style={styles.alternativeDesc}>Let others scan to view your card</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.alternativeOption}
          onPress={() => {
            navigation.goBack();
            // Share link option
          }}
        >
          <View style={styles.alternativeIcon}>
            <Ionicons name="share-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.alternativeText}>
            <Text style={styles.alternativeLabel}>Share Link</Text>
            <Text style={styles.alternativeDesc}>Send your card URL via text or email</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNfcDisabled = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Ionicons name="wifi-outline" size={60} color="#F97316" />
      </View>
      <Text style={styles.title}>NFC is Disabled</Text>
      <Text style={styles.subtitle}>
        Please enable NFC in your device settings to write to NFC tags.
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => {
          if (Platform.OS === 'android' && NfcManager) {
            NfcManager.goToNfcSetting();
          } else {
            Alert.alert('Enable NFC', 'Please go to Settings > NFC and enable it.');
          }
        }}
      >
        <Text style={styles.primaryButtonText}>Open NFC Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWriteMode = () => (
    <View style={styles.centerContent}>
      <Animated.View style={[styles.nfcIconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.nfcIconGradient}
        >
          <Ionicons name="wifi" size={50} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
        </LinearGradient>
      </Animated.View>
      
      <Text style={styles.title}>Ready to Write</Text>
      <Text style={styles.subtitle}>
        Hold your phone near an NFC tag to write your card URL.
      </Text>
      
      <View style={styles.urlPreview}>
        <Ionicons name="link-outline" size={20} color="#22C55E" />
        <Text style={styles.urlText}>{cardUrl}</Text>
      </View>

      {isWriting && (
        <View style={styles.writingIndicator}>
          <ActivityIndicator size="small" color="#22C55E" />
          <Text style={styles.writingText}>Waiting for NFC tag...</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.primaryButton, isWriting && styles.cancelButton]}
        onPress={isWriting ? cancelWrite : writeNfcTag}
      >
        <Text style={styles.primaryButtonText}>
          {isWriting ? 'Cancel' : 'Start Writing'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.subtitle}>Checking NFC support...</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Write to NFC Tag</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {isNfcSupported === null ? renderLoading() :
         !isNfcSupported ? renderNfcNotSupported() :
         !isNfcEnabled ? renderNfcDisabled() :
         renderWriteMode()}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How it works:</Text>
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>1</Text>
          </View>
          <Text style={styles.instructionText}>Get a blank NFC tag or card</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>2</Text>
          </View>
          <Text style={styles.instructionText}>Tap "Start Writing" and hold your phone near the tag</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>3</Text>
          </View>
          <Text style={styles.instructionText}>Share your card by letting others tap the tag!</Text>
        </View>
      </View>
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
    zIndex: 10,
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  nfcIconContainer: {
    marginBottom: 24,
  },
  nfcIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  urlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  writingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  writingText: {
    fontSize: 14,
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  
  // Alternatives section styles
  alternativesSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alternativeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alternativeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alternativeText: {
    flex: 1,
  },
  alternativeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  alternativeDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
});
