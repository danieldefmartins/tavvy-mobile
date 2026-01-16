import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.586;
const SCAN_AREA_WIDTH = width * 0.85;
const SCAN_AREA_HEIGHT = SCAN_AREA_WIDTH / CARD_ASPECT_RATIO;

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
}

export default function BusinessCardScannerScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleScan = async () => {
    if (cameraRef.current && !isScanning) {
      setIsScanning(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });

        // Simulate OCR Processing (In production, send to Google Cloud Vision API)
        setTimeout(() => {
          const mockData: ScannedBusinessCard = {
            name: "The Coffee House",
            address: "123 Main St, Seattle, WA 98101",
            phone: "(206) 555-0123",
            website: "www.coffeehouse.com"
          };

          setIsScanning(false);
          
          if (route.params?.onScanComplete) {
            route.params.onScanComplete(mockData);
            navigation.goBack();
          } else {
            Alert.alert("Scanned Data", JSON.stringify(mockData, null, 2));
          }
        }, 2000);

      } catch (error) {
        setIsScanning(false);
        Alert.alert('Error', 'Failed to scan card');
      }
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
                  <Text style={styles.scanningText}>Processing...</Text>
                </View>
              )}
            </View>
            <Text style={styles.instructionText}>
              Align business card within the frame
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleScan} 
              style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
              disabled={isScanning}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
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
