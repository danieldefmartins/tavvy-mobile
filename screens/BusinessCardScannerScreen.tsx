import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.586;
const SCAN_AREA_WIDTH = width * 0.85;
const SCAN_AREA_HEIGHT = SCAN_AREA_WIDTH / CARD_ASPECT_RATIO;

// OCR.space API configuration
const OCR_API_KEY = 'K84783289688957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

interface BusinessCardScannerScreenProps {
  navigation: any;
  route: {
    params: {
      onScanComplete: (data: ScannedBusinessCard) => void;
    };
  };
}

export interface ScannedBusinessCard {
  name: string;
  address: string;
  phone: string;
  website?: string;
  email?: string;
  rawText?: string;
}

/**
 * Parse OCR text to extract business card information
 */
function parseBusinessCardText(text: string): ScannedBusinessCard {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let name = '';
  let address = '';
  let phone = '';
  let website = '';
  let email = '';
  
  // Patterns for extraction
  const phonePattern = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const websitePattern = /(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?/gi;
  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl|circle|cir)[\s,]*(?:[\w\s]+)?(?:,\s*)?(?:[A-Z]{2})?\s*\d{5}(?:-\d{4})?/gi;
  const zipPattern = /[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi;
  
  const fullText = text;
  
  // Extract phone numbers
  const phoneMatches = fullText.match(phonePattern);
  if (phoneMatches && phoneMatches.length > 0) {
    phone = phoneMatches[0];
  }
  
  // Extract email
  const emailMatches = fullText.match(emailPattern);
  if (emailMatches && emailMatches.length > 0) {
    email = emailMatches[0];
  }
  
  // Extract website
  const websiteMatches = fullText.match(websitePattern);
  if (websiteMatches && websiteMatches.length > 0) {
    // Filter out email domains
    const websites = websiteMatches.filter(w => !w.includes('@'));
    if (websites.length > 0) {
      website = websites[0];
      if (!website.startsWith('www.') && !website.startsWith('http')) {
        website = 'www.' + website;
      }
    }
  }
  
  // Extract address - look for lines with numbers and common street suffixes
  const addressMatches = fullText.match(addressPattern);
  if (addressMatches && addressMatches.length > 0) {
    address = addressMatches[0];
  } else {
    // Try to find address by looking for zip codes and building address from nearby lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line contains a zip code pattern
      if (zipPattern.test(line) || /\d{5}/.test(line)) {
        // This line likely contains part of an address
        // Look at previous line too
        if (i > 0) {
          address = lines[i - 1] + ', ' + line;
        } else {
          address = line;
        }
        break;
      }
      // Check for street indicators
      if (/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court)/i.test(line)) {
        address = line;
        // Check if next line has city/state/zip
        if (i + 1 < lines.length && /[A-Z]{2}\s*\d{5}|,\s*[A-Z]{2}/i.test(lines[i + 1])) {
          address += ', ' + lines[i + 1];
        }
        break;
      }
    }
  }
  
  // Extract business name - usually the first prominent line that's not contact info
  for (const line of lines) {
    // Skip if it looks like contact info
    if (phonePattern.test(line)) continue;
    if (emailPattern.test(line)) continue;
    if (websitePattern.test(line)) continue;
    if (/\d{5}/.test(line)) continue; // Skip lines with zip codes
    if (/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard)/i.test(line)) continue;
    
    // Skip very short lines or lines that look like titles
    if (line.length < 3) continue;
    
    // This is likely the business name or person name
    if (!name) {
      name = line;
    }
    break;
  }
  
  // If we still don't have a name, use the first non-empty line
  if (!name && lines.length > 0) {
    name = lines[0];
  }
  
  return {
    name: name || '',
    address: address || '',
    phone: phone || '',
    website: website || '',
    email: email || '',
    rawText: text,
  };
}

/**
 * Call OCR.space API to extract text from image
 */
async function performOCR(imageUri: string): Promise<string> {
  try {
    // Read the image file and convert to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine the file type from the URI
    const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for business cards
    
    console.log('Sending image to OCR.space API...');
    
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OCR API returned status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('OCR API Response:', JSON.stringify(result, null, 2));
    
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || 'OCR processing failed');
    }
    
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const parsedText = result.ParsedResults[0].ParsedText;
      if (parsedText) {
        return parsedText;
      }
    }
    
    throw new Error('No text found in the image');
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

export default function BusinessCardScannerScreen({ navigation, route }: BusinessCardScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  const handleScan = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera reference not available');
      return;
    }

    if (!cameraReady) {
      Alert.alert('Error', 'Camera is not ready yet. Please wait a moment.');
      return;
    }

    if (isScanning) {
      return;
    }

    setIsScanning(true);
    setScanStatus('Taking photo...');
    
    try {
      console.log('Attempting to take picture...');
      
      // Add a small delay to ensure camera is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      console.log('Photo taken successfully:', photo.uri);
      setScanStatus('Processing image...');

      // Perform OCR on the captured image
      const extractedText = await performOCR(photo.uri);
      console.log('Extracted text:', extractedText);
      
      setScanStatus('Extracting information...');
      
      // Parse the extracted text to get business card data
      const businessCardData = parseBusinessCardText(extractedText);
      console.log('Parsed business card data:', businessCardData);

      setIsScanning(false);
      setScanStatus('');
      
      // Check if we got meaningful data
      if (!businessCardData.name && !businessCardData.phone && !businessCardData.address) {
        Alert.alert(
          'Scan Result',
          'Could not extract clear information from the business card. The raw text was:\n\n' + extractedText.substring(0, 200) + '...',
          [
            { text: 'Try Again', onPress: () => {} },
            { 
              text: 'Use Anyway', 
              onPress: () => {
                if (route.params?.onScanComplete) {
                  route.params.onScanComplete(businessCardData);
                  navigation.goBack();
                }
              }
            },
          ]
        );
        return;
      }
      
      if (route.params?.onScanComplete) {
        route.params.onScanComplete(businessCardData);
        navigation.goBack();
      } else {
        Alert.alert(
          "Scanned Data",
          `Name: ${businessCardData.name}\nAddress: ${businessCardData.address}\nPhone: ${businessCardData.phone}\nWebsite: ${businessCardData.website || 'N/A'}\nEmail: ${businessCardData.email || 'N/A'}`
        );
      }
    } catch (error) {
      setIsScanning(false);
      setScanStatus('');
      console.error('Scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Scan Failed', `Could not process the business card: ${errorMessage}\n\nPlease try again with better lighting and ensure the card is clearly visible.`);
    }
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2DD4BF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.closeButton, { marginTop: 12, backgroundColor: '#666' }]}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={cameraRef}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Business Card</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#2DD4BF" />
                  <Text style={styles.scanningText}>{scanStatus || 'Processing...'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.instructionText}>
              Align business card within the frame
            </Text>
            {!cameraReady && (
              <Text style={styles.readyingText}>Initializing camera...</Text>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleScan} 
              style={[
                styles.captureButton, 
                (isScanning || !cameraReady) && styles.captureButtonDisabled
              ]}
              disabled={isScanning || !cameraReady}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            {!cameraReady && (
              <Text style={styles.readyingButtonText}>Camera initializing...</Text>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_AREA_WIDTH,
    height: SCAN_AREA_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#2DD4BF',
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  scanningText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
  },
  instructionText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    opacity: 0.8,
  },
  readyingText: {
    color: '#2DD4BF',
    marginTop: 10,
    fontSize: 12,
    opacity: 0.6,
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  readyingButtonText: {
    color: '#2DD4BF',
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  closeButton: {
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
