import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// TYPES
// ============================================

interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

interface QuickInfoBarProps {
  isOpen: boolean;
  closingTime?: string;
  signalsCount: number;
  photosCount: number;
  driveTime: string;
  latitude: number;
  longitude: number;
  placeName: string;
  placeAddress: string;
  operatingHours: OperatingHours[];
  onPhotosPress: () => void;
  onSignalsPress: () => void;
}

// ============================================
// NAVIGATION OPTIONS MODAL
// ============================================

interface NavigationModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  placeName: string;
  placeAddress: string;
}

const NavigationModal: React.FC<NavigationModalProps> = ({
  visible,
  onClose,
  latitude,
  longitude,
  placeName,
  placeAddress,
}) => {
  const encodedName = encodeURIComponent(placeName);
  const encodedAddress = encodeURIComponent(placeAddress);

  const navigationOptions = [
    {
      id: 'tavvy',
      name: 'Tavvy Navigation',
      icon: 'navigate',
      color: '#14b8a6',
      onPress: () => {
        // Internal Tavvy navigation - could open in-app map
        Alert.alert('Tavvy Navigation', 'Opening Tavvy turn-by-turn navigation...');
        onClose();
      },
    },
    {
      id: 'apple',
      name: 'Apple Maps',
      icon: 'map',
      color: '#007AFF',
      onPress: () => {
        const url = `maps://app?daddr=${latitude},${longitude}&q=${encodedName}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // Fallback to web
            Linking.openURL(`https://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedName}`);
          }
        });
        onClose();
      },
    },
    {
      id: 'google',
      name: 'Google Maps',
      icon: 'logo-google',
      color: '#4285F4',
      onPress: () => {
        const url = Platform.select({
          ios: `comgooglemaps://?daddr=${latitude},${longitude}&q=${encodedName}`,
          android: `google.navigation:q=${latitude},${longitude}`,
        });
        Linking.canOpenURL(url!).then((supported) => {
          if (supported) {
            Linking.openURL(url!);
          } else {
            // Fallback to web
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`);
          }
        });
        onClose();
      },
    },
    {
      id: 'waze',
      name: 'Waze',
      icon: 'car-sport',
      color: '#33CCFF',
      onPress: () => {
        const url = `waze://?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // Fallback to web
            Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`);
          }
        });
        onClose();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Get Directions</Text>
          <Text style={styles.modalSubtitle}>{placeName}</Text>
          
          <View style={styles.navigationOptions}>
            {navigationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.navigationOption}
                onPress={option.onPress}
              >
                <View style={[styles.navigationIconContainer, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={28} color={option.color} />
                </View>
                <Text style={styles.navigationOptionText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================
// OPERATING HOURS MODAL
// ============================================

interface HoursModalProps {
  visible: boolean;
  onClose: () => void;
  operatingHours: OperatingHours[];
  placeName: string;
  isOpen: boolean;
}

const HoursModal: React.FC<HoursModalProps> = ({
  visible,
  onClose,
  operatingHours,
  placeName,
  isOpen,
}) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Operating Hours</Text>
          <Text style={styles.modalSubtitle}>{placeName}</Text>
          
          <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
            <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
            <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
              {isOpen ? 'Currently Open' : 'Currently Closed'}
            </Text>
          </View>

          <ScrollView style={styles.hoursContainer}>
            {operatingHours.map((hours, index) => (
              <View 
                key={index} 
                style={[
                  styles.hoursRow,
                  hours.day === today && styles.hoursRowToday,
                ]}
              >
                <Text style={[
                  styles.dayText,
                  hours.day === today && styles.dayTextToday,
                ]}>
                  {hours.day}
                  {hours.day === today && ' (Today)'}
                </Text>
                <Text style={[
                  styles.timeText,
                  hours.isClosed && styles.closedText,
                  hours.day === today && styles.timeTextToday,
                ]}>
                  {hours.isClosed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================
// MAIN QUICK INFO BAR COMPONENT
// ============================================

const QuickInfoBar: React.FC<QuickInfoBarProps> = ({
  isOpen,
  closingTime,
  signalsCount,
  photosCount,
  driveTime,
  latitude,
  longitude,
  placeName,
  placeAddress,
  operatingHours,
  onPhotosPress,
  onSignalsPress,
}) => {
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  return (
    <>
      <View style={styles.quickInfoBar}>
        {/* Open/Closed Status - Clickable */}
        <TouchableOpacity 
          style={styles.quickInfoItem}
          onPress={() => setShowHoursModal(true)}
        >
          <Ionicons 
            name="time-outline" 
            size={24} 
            color={isOpen ? '#10b981' : '#ef4444'} 
          />
          <Text style={[styles.quickInfoValue, isOpen ? styles.openText : styles.closedTextSmall]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.quickInfoLabel}>
            {isOpen && closingTime ? `Until ${closingTime}` : 'See hours'}
          </Text>
        </TouchableOpacity>

        {/* Signals Count - Clickable */}
        <TouchableOpacity 
          style={styles.quickInfoItem}
          onPress={onSignalsPress}
        >
          <Ionicons name="star" size={24} color="#f59e0b" />
          <Text style={styles.quickInfoValue}>{signalsCount.toLocaleString()}</Text>
          <Text style={styles.quickInfoLabel}>Signals</Text>
        </TouchableOpacity>

        {/* Photos Count - Clickable */}
        <TouchableOpacity 
          style={styles.quickInfoItem}
          onPress={onPhotosPress}
        >
          <Ionicons name="camera" size={24} color="#6366f1" />
          <Text style={styles.quickInfoValue}>{photosCount.toLocaleString()}</Text>
          <Text style={styles.quickInfoLabel}>Photos</Text>
        </TouchableOpacity>

        {/* Drive Time - Clickable */}
        <TouchableOpacity 
          style={styles.quickInfoItem}
          onPress={() => setShowNavigationModal(true)}
        >
          <Ionicons name="car" size={24} color="#ef4444" />
          <Text style={styles.quickInfoValue}>{driveTime}</Text>
          <Text style={styles.quickInfoLabel}>Drive</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Modal */}
      <NavigationModal
        visible={showNavigationModal}
        onClose={() => setShowNavigationModal(false)}
        latitude={latitude}
        longitude={longitude}
        placeName={placeName}
        placeAddress={placeAddress}
      />

      {/* Hours Modal */}
      <HoursModal
        visible={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        operatingHours={operatingHours}
        placeName={placeName}
        isOpen={isOpen}
      />
    </>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Quick Info Bar
  quickInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  openText: {
    color: '#10b981',
  },
  closedTextSmall: {
    color: '#ef4444',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // Navigation Options
  navigationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navigationOption: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 12,
  },
  navigationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  navigationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Hours Modal
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusOpen: {
    backgroundColor: '#d1fae5',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotOpen: {
    backgroundColor: '#10b981',
  },
  dotClosed: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textOpen: {
    color: '#10b981',
  },
  textClosed: {
    color: '#ef4444',
  },
  hoursContainer: {
    maxHeight: 300,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hoursRowToday: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  dayText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dayTextToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  timeText: {
    fontSize: 15,
    color: '#666',
  },
  timeTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  closedText: {
    color: '#ef4444',
  },

  // Cancel Button
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
});
