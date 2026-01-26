/**
 * Tavvy Universal Add Screen V3
 * 
 * Complete implementation of the Universal Add flow:
 * - Step 1: GPS auto-populate location with Yes/No confirmation
 * - Step 2: Business type selection (Physical/Service/On-the-go)
 * - Step 3: Content type selection (Business, Event, RV, Quick Add, etc.)
 * - Step 4: Category and details
 * - Step 5: Photos
 * - Step 6: Review and submit
 * 
 * Features:
 * - Auto-save as you go
 * - Resume incomplete drafts
 * - Offline mode support
 * - Taps reward on completion
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
  TextInput, Dimensions, Image, FlatList, ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useDrafts, ContentType, ContentSubtype, ContentDraft } from '../hooks/useDrafts';
import { useLocation, LocationData } from '../hooks/useLocation';
import ECardAddressAutocomplete, { AddressData } from '../components/ecard/AddressAutocomplete';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'location' | 'business_type' | 'content_type' | 'details' | 'photos' | 'review';

interface BusinessType {
  id: ContentSubtype;
  title: string;
  description: string;
  icon: string;
}

interface ContentTypeOption {
  id: ContentType;
  title: string;
  description: string;
  icon: string;
  subtypes?: { id: ContentSubtype; title: string; icon: string }[];
}

const BUSINESS_TYPES: BusinessType[] = [
  { id: 'physical', title: 'Business with a Physical Place', description: 'Restaurant, store, office, etc.', icon: 'storefront-outline' },
  { id: 'service', title: 'Service Business', description: 'Plumber, consultant, freelancer, etc.', icon: 'construct-outline' },
  { id: 'on_the_go', title: 'On-the-Go Business', description: 'Food truck, mobile service, pop-up, etc.', icon: 'car-outline' },
];

const CONTENT_TYPES: ContentTypeOption[] = [
  { id: 'business', title: 'Business', description: 'Add a business or place', icon: 'business-outline' },
  { id: 'event', title: 'Event', description: 'Add an event or happening', icon: 'calendar-outline' },
  { id: 'rv_campground', title: 'RV & Campground', description: 'Add camping or RV spot', icon: 'bonfire-outline',
    subtypes: [
      { id: 'rv_park', title: 'RV Park', icon: 'car-sport-outline' },
      { id: 'campground', title: 'Campground', icon: 'bonfire-outline' },
      { id: 'boondocking', title: 'Boondocking Spot', icon: 'map-outline' },
      { id: 'overnight_parking', title: 'Overnight Parking', icon: 'car-outline' },
    ],
  },
  { id: 'quick_add', title: 'Quick Add', description: 'Restroom, parking, ATM, etc.', icon: 'flash-outline',
    subtypes: [
      { id: 'restroom', title: 'Restroom', icon: 'water-outline' },
      { id: 'parking', title: 'Parking', icon: 'car-outline' },
      { id: 'atm', title: 'ATM', icon: 'card-outline' },
      { id: 'water_fountain', title: 'Water Fountain', icon: 'water-outline' },
      { id: 'pet_relief', title: 'Pet Relief Area', icon: 'paw-outline' },
      { id: 'photo_spot', title: 'Photo Spot', icon: 'camera-outline' },
    ],
  },
];

const STEPS: Step[] = ['location', 'business_type', 'content_type', 'details', 'photos', 'review'];

export default function UniversalAddScreenV3() {
  const navigation = useNavigation();
  const { 
    currentDraft, pendingDraft, isLoading, isSaving, isOnline,
    createDraft, updateDraft, deleteDraft, snoozeDraft, submitDraft,
    resumeDraft, dismissPendingDraft,
  } = useDrafts();
  const { location, isLoading: isLoadingLocation, requestLocation } = useLocation();

  const [currentStep, setCurrentStep] = useState<Step>('location');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<ContentSubtype | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<ContentSubtype | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [manualAddressData, setManualAddressData] = useState<AddressData>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    formattedAddress: '',
  });

  useEffect(() => {
    if (pendingDraft && !currentDraft) {
      setShowResumeModal(true);
    }
  }, [pendingDraft, currentDraft]);

  // Only request location if there's no draft after loading completes
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    // Wait for loading to complete before deciding what to do
    if (isLoading) return;
    if (hasInitialized) return;
    
    // If there's a pending draft, show the resume modal (handled by other useEffect)
    // If there's a current draft, restore it (handled by other useEffect)
    // Only request new location if there's truly no draft
    if (!currentDraft && !pendingDraft) {
      handleRequestLocation();
    }
    setHasInitialized(true);
  }, [isLoading, currentDraft, pendingDraft, hasInitialized]);

  useEffect(() => {
    if (currentDraft) {
      // Restore step based on draft status
      switch (currentDraft.status) {
        case 'draft_location': setCurrentStep('location'); break;
        case 'draft_type_selected': setCurrentStep('business_type'); break;
        case 'draft_subtype_selected': setCurrentStep('content_type'); break;
        case 'draft_details': setCurrentStep('details'); break;
        case 'draft_photos': setCurrentStep('photos'); break;
        case 'draft_review': setCurrentStep('review'); break;
        default:
          // If status is unknown, use current_step number as fallback
          if (currentDraft.current_step && currentDraft.current_step >= 1 && currentDraft.current_step <= 6) {
            setCurrentStep(STEPS[currentDraft.current_step - 1]);
          }
          break;
      }
      
      // Restore business type / subtype
      if (currentDraft.content_subtype) {
        if (['physical', 'service', 'on_the_go'].includes(currentDraft.content_subtype)) {
          setSelectedBusinessType(currentDraft.content_subtype);
        } else {
          setSelectedSubtype(currentDraft.content_subtype);
        }
      }
      if (currentDraft.content_type) setSelectedContentType(currentDraft.content_type);
      
      // Restore form data
      if (currentDraft.data) setFormData(currentDraft.data);
      
      // Restore photos
      if (currentDraft.photos && currentDraft.photos.length > 0) setPhotos(currentDraft.photos);
      
      // Restore address data for display
      if (currentDraft.address_line1 || currentDraft.city) {
        setManualAddressData({
          address1: currentDraft.address_line1 || '',
          address2: currentDraft.address_line2 || '',
          city: currentDraft.city || '',
          state: currentDraft.region || '',
          zipCode: currentDraft.postal_code || '',
          country: currentDraft.country || 'USA',
          formattedAddress: currentDraft.formatted_address || '',
          latitude: currentDraft.latitude || undefined,
          longitude: currentDraft.longitude || undefined,
        });
      }
    }
  }, [currentDraft?.id]);

  const handleRequestLocation = async () => {
    const loc = await requestLocation();
    if (loc) {
      await createDraft({
        latitude: loc.latitude, longitude: loc.longitude,
        address_line1: loc.address_line1 || undefined,
        city: loc.city || undefined, region: loc.region || undefined,
        postal_code: loc.postal_code || undefined, country: loc.country || undefined,
        formatted_address: loc.formatted_address || undefined,
      });
    }
  };

  const handleConfirmLocation = async (confirmed: boolean) => {
    if (!currentDraft) return;
    if (confirmed) {
      await updateDraft({ status: 'draft_type_selected', current_step: 2 }, true);
      setCurrentStep('business_type');
    } else {
      // Show manual address entry form
      setShowManualAddress(true);
    }
  };

  // Handle address change from eCard AddressAutocomplete component
  const handleManualAddressChange = (newAddress: AddressData) => {
    setManualAddressData(newAddress);
  };

  // Save manual address and continue to next step
  const handleSaveManualAddress = async () => {
    const { address1, city, state } = manualAddressData;
    
    if (!address1.trim() || !city.trim() || !state.trim()) {
      Alert.alert('Required', 'Please enter at least Address, City, and State.');
      return;
    }
    
    // Build formatted address
    const formattedParts = [
      manualAddressData.address1,
      manualAddressData.address2,
      manualAddressData.city,
      manualAddressData.state,
      manualAddressData.zipCode,
      manualAddressData.country,
    ].filter(Boolean);
    const formatted = formattedParts.join(', ');
    
    // Use geocoded coordinates from the selected address, NOT user's current location
    // manualAddressData.latitude/longitude come from Nominatim when user selects from autocomplete
    await updateDraft({
      address_line1: manualAddressData.address1,
      address_line2: manualAddressData.address2 || null,
      city: manualAddressData.city,
      region: manualAddressData.state || null,
      postal_code: manualAddressData.zipCode || null,
      country: manualAddressData.country || 'USA',
      formatted_address: formatted,
      latitude: manualAddressData.latitude || null,
      longitude: manualAddressData.longitude || null,
      status: 'draft_type_selected',
      current_step: 2,
    }, true);
    
    setShowManualAddress(false);
    setManualAddressData({
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formattedAddress: '',
    });
    setCurrentStep('business_type');
  };

  const handleCancelManualAddress = () => {
    setShowManualAddress(false);
    setManualAddressData({
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formattedAddress: '',
    });
  };

  const handleSelectBusinessType = async (type: ContentSubtype) => {
    setSelectedBusinessType(type);
    await updateDraft({ content_subtype: type, status: 'draft_subtype_selected', current_step: 3 }, true);
    setCurrentStep('content_type');
  };

  const handleSelectContentType = async (type: ContentType, subtype?: ContentSubtype) => {
    setSelectedContentType(type);
    if (subtype) setSelectedSubtype(subtype);
    await updateDraft({
      content_type: type, content_subtype: subtype || selectedBusinessType,
      status: 'draft_details', current_step: 4,
    }, true);
    setCurrentStep('details');
  };

  const handleUpdateFormData = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    updateDraft({ data: newData });
  };

  const handleGoToPhotos = async () => {
    await updateDraft({ data: formData, status: 'draft_photos', current_step: 5 }, true);
    setCurrentStep('photos');
  };

  const handleGoToReview = async () => {
    await updateDraft({ photos, status: 'draft_review', current_step: 6 }, true);
    setCurrentStep('review');
  };

  // Photo picker functions
  // Single function to add photos - iOS will show native action sheet
  // Launch camera to take a photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access in Settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const updatedPhotos = [...photos, ...newPhotos].slice(0, 30);
        setPhotos(updatedPhotos);
        updateDraft({ photos: updatedPhotos });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick photos from library
  const pickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access in Settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 30 - photos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const updatedPhotos = [...photos, ...newPhotos].slice(0, 30);
        setPhotos(updatedPhotos);
        updateDraft({ photos: updatedPhotos });
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    }
  };

  // Pick from files (uses document picker which can access Files app)
  const pickFromFiles = async () => {
    try {
      // On iOS, launchImageLibraryAsync with certain options can access Files
      // But for true Files access, we use the same library picker which iOS allows browsing
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 30 - photos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const updatedPhotos = [...photos, ...newPhotos].slice(0, 30);
        setPhotos(updatedPhotos);
        updateDraft({ photos: updatedPhotos });
      }
    } catch (error) {
      console.error('Error picking from files:', error);
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  // Show action sheet with Camera, Library, Files options
  const addPhotos = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Photo Library', 'Browse Files'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              takePhoto();
              break;
            case 2:
              pickFromLibrary();
              break;
            case 3:
              pickFromFiles();
              break;
          }
        }
      );
    } else {
      // Android fallback - show Alert with options
      Alert.alert(
        'Add Photos',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Photo Library', onPress: pickFromLibrary },
          { text: 'Browse Files', onPress: pickFromFiles },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    updateDraft({ photos: updatedPhotos });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitDraft();
      if (result.success) {
        Alert.alert('🎉 Success!', `Your place has been added!\n\n+${result.taps_earned || 50} Taps earned!`,
          [{ text: 'Awesome!', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeDraft = () => { if (pendingDraft) resumeDraft(pendingDraft); setShowResumeModal(false); };
  const handleDiscardDraft = async () => { if (pendingDraft) await deleteDraft(pendingDraft.id); setShowResumeModal(false); handleRequestLocation(); };
  const handleSnoozeDraft = async () => { if (pendingDraft) await snoozeDraft(24); setShowResumeModal(false); navigation.goBack(); };

  const handleBack = () => {
    const stepIndex = STEPS.indexOf(currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    } else {
      Alert.alert('Save Draft?', 'Your progress will be saved and you can continue later.',
        [
          { text: 'Discard', style: 'destructive', onPress: () => { if (currentDraft) deleteDraft(); navigation.goBack(); }},
          { text: 'Save & Exit', onPress: () => navigation.goBack() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const progress = useMemo(() => ((STEPS.indexOf(currentStep) + 1) / STEPS.length) * 100, [currentStep]);
  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 'location': return 'Confirm Location';
      case 'business_type': return 'Business Type';
      case 'content_type': return 'What are you adding?';
      case 'details': return 'Details';
      case 'photos': return 'Add Photos';
      case 'review': return 'Review';
      default: return '';
    }
  }, [currentStep]);

  const renderResumeModal = () => (
    <Modal visible={showResumeModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name="document-text-outline" size={48} color="#0A84FF" />
          <Text style={styles.modalTitle}>Continue where you left off?</Text>
          <Text style={styles.modalDescription}>
            You have an unfinished draft from {pendingDraft?.updated_at ? new Date(pendingDraft.updated_at).toLocaleDateString() : 'earlier'}.
          </Text>
          <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleResumeDraft}>
            <Text style={styles.modalButtonPrimaryText}>Yes, Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButtonSecondary} onPress={handleDiscardDraft}>
            <Text style={styles.modalButtonSecondaryText}>No, Start Fresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButtonTertiary} onPress={handleSnoozeDraft}>
            <Text style={styles.modalButtonTertiaryText}>Remind Me Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      {showManualAddress ? (
        // Manual Address Entry with eCard AddressAutocomplete
        <View style={styles.autocompleteContainer}>
          <Text style={styles.stepDescription}>Enter the place address</Text>
          
          {/* eCard-style Address Autocomplete with all fields */}
          <ECardAddressAutocomplete
            value={manualAddressData}
            onChange={handleManualAddressChange}
          />
          
          {/* Show GPS coordinates from geocoded address (not user location) */}
          {manualAddressData.latitude && manualAddressData.longitude && (
            <View style={styles.coordsNote}>
              <Ionicons name="navigate" size={16} color="#34C759" />
              <Text style={styles.coordsNoteText}>
                GPS: {manualAddressData.latitude.toFixed(6)}, {manualAddressData.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          <View style={styles.manualAddressButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelManualAddress}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.saveAddressButton, 
                (!manualAddressData.address1 || !manualAddressData.city || !manualAddressData.state) && styles.saveAddressButtonDisabled
              ]} 
              onPress={handleSaveManualAddress}
              disabled={!manualAddressData.address1 || !manualAddressData.city || !manualAddressData.state}
            >
              <Text style={styles.saveAddressButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isLoadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : currentDraft?.formatted_address ? (
        <>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={32} color="#0A84FF" />
            <Text style={styles.locationAddress}>{currentDraft.formatted_address}</Text>
            <Text style={styles.locationCoords}>({currentDraft.latitude?.toFixed(6)}, {currentDraft.longitude?.toFixed(6)})</Text>
          </View>
          <Text style={styles.confirmQuestion}>Is this the correct address?</Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={[styles.confirmButton, styles.confirmButtonYes]} onPress={() => handleConfirmLocation(true)}>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, styles.confirmButtonNo]} onPress={() => handleConfirmLocation(false)}>
              <Ionicons name="close" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={48} color="#999" />
          <Text style={styles.noLocationText}>Unable to get location</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRequestLocation}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualEntryLink} onPress={() => setShowManualAddress(true)}>
            <Text style={styles.manualEntryLinkText}>Enter address manually</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderBusinessTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>What type of business is this?</Text>
      {BUSINESS_TYPES.map((type) => (
        <TouchableOpacity key={type.id} style={[styles.optionCard, selectedBusinessType === type.id && styles.optionCardSelected]}
          onPress={() => handleSelectBusinessType(type.id)}>
          <View style={styles.optionIconContainer}><Ionicons name={type.icon as any} size={28} color="#0A84FF" /></View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{type.title}</Text>
            <Text style={styles.optionDescription}>{type.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContentTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>What would you like to add?</Text>
      {CONTENT_TYPES.map((type) => (
        <View key={type.id}>
          <TouchableOpacity style={[styles.optionCard, selectedContentType === type.id && styles.optionCardSelected]}
            onPress={() => type.subtypes ? setSelectedContentType(type.id) : handleSelectContentType(type.id)}>
            <View style={styles.optionIconContainer}><Ionicons name={type.icon as any} size={28} color="#0A84FF" /></View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{type.title}</Text>
              <Text style={styles.optionDescription}>{type.description}</Text>
            </View>
            <Ionicons name={type.subtypes ? "chevron-down" : "chevron-forward"} size={24} color="#999" />
          </TouchableOpacity>
          {type.subtypes && selectedContentType === type.id && (
            <View style={styles.subtypeContainer}>
              {type.subtypes.map((subtype) => (
                <TouchableOpacity key={subtype.id} style={[styles.subtypeCard, selectedSubtype === subtype.id && styles.subtypeCardSelected]}
                  onPress={() => handleSelectContentType(type.id, subtype.id)}>
                  <Ionicons name={subtype.icon as any} size={20} color="#0A84FF" />
                  <Text style={styles.subtypeTitle}>{subtype.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Tell us more about this place</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name *</Text>
        <TextInput style={styles.input} value={formData.name || ''} onChangeText={(text) => handleUpdateFormData('name', text)}
          placeholder="Enter name" placeholderTextColor="#999" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput style={[styles.input, styles.inputMultiline]} value={formData.description || ''}
          onChangeText={(text) => handleUpdateFormData('description', text)} placeholder="Describe this place..."
          placeholderTextColor="#999" multiline numberOfLines={4} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput style={styles.input} value={formData.phone || ''} onChangeText={(text) => handleUpdateFormData('phone', text)}
          placeholder="Phone number" placeholderTextColor="#999" keyboardType="phone-pad" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Website</Text>
        <TextInput style={styles.input} value={formData.website || ''} onChangeText={(text) => handleUpdateFormData('website', text)}
          placeholder="https://..." placeholderTextColor="#999" keyboardType="url" autoCapitalize="none" />
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={handleGoToPhotos}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderPhotosStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Add photos to help others find this place</Text>
      
      {/* Photo Grid */}
      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoThumbnail} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {/* Add Photos Button */}
      {photos.length < 30 && (
        <TouchableOpacity style={styles.addPhotoButtonSingle} onPress={addPhotos}>
          <Ionicons name="add-circle-outline" size={32} color="#0A84FF" />
          <Text style={styles.addPhotoText}>Add Photos</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.photoHint}>
        {photos.length === 0 
          ? 'Photos are optional but help others discover this place' 
          : `${photos.length}/30 photos added`}
      </Text>
      
      <TouchableOpacity style={styles.nextButton} onPress={handleGoToReview}>
        <Text style={styles.nextButtonText}>{photos.length > 0 ? 'Continue' : 'Skip Photos'}</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Review your submission</Text>
      <View style={styles.reviewCard}><Text style={styles.reviewLabel}>Location</Text><Text style={styles.reviewValue}>{currentDraft?.formatted_address || 'Not set'}</Text></View>
      <View style={styles.reviewCard}><Text style={styles.reviewLabel}>Name</Text><Text style={styles.reviewValue}>{formData.name || 'Not set'}</Text></View>
      <View style={styles.reviewCard}><Text style={styles.reviewLabel}>Type</Text><Text style={styles.reviewValue}>{selectedContentType} {selectedSubtype ? `(${selectedSubtype})` : ''}</Text></View>
      {formData.description && <View style={styles.reviewCard}><Text style={styles.reviewLabel}>Description</Text><Text style={styles.reviewValue}>{formData.description}</Text></View>}
      <View style={styles.tapsPreview}><Ionicons name="flash" size={24} color="#FFD700" /><Text style={styles.tapsText}>You'll earn +50 Taps!</Text></View>
      <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitButtonText}>Submit</Text><Ionicons name="checkmark-circle" size={20} color="#fff" /></>}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'location': return renderLocationStep();
      case 'business_type': return renderBusinessTypeStep();
      case 'content_type': return renderContentTypeStep();
      case 'details': return renderDetailsStep();
      case 'photos': return renderPhotosStep();
      case 'review': return renderReviewStep();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderResumeModal()}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitle}</Text>
        <View style={styles.headerRight}>
          {isSaving && <ActivityIndicator size="small" color="#0A84FF" />}
          {!isOnline && <View style={styles.offlineBadge}><Ionicons name="cloud-offline" size={16} color="#FF9500" /></View>}
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.progressText}>Step {STEPS.indexOf(currentStep) + 1} of {STEPS.length}</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  headerRight: { flexDirection: 'row', alignItems: 'center', width: 40 },
  offlineBadge: { marginLeft: 8 },
  progressContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  progressBar: { height: 4, backgroundColor: '#eee', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#0A84FF', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#999', marginTop: 4, textAlign: 'right' },
  content: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  stepContent: { flex: 1 },
  stepDescription: { fontSize: 16, color: '#666', marginBottom: 24 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 16 },
  locationCard: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  locationAddress: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 12 },
  locationCoords: { fontSize: 12, color: '#999', marginTop: 4 },
  confirmQuestion: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 24 },
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  confirmButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, gap: 8 },
  confirmButtonYes: { backgroundColor: '#34C759' },
  confirmButtonNo: { backgroundColor: '#FF3B30' },
  confirmButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  noLocationContainer: { alignItems: 'center', paddingVertical: 60 },
  noLocationText: { fontSize: 16, color: '#999', marginTop: 12 },
  retryButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#0A84FF', borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  optionCardSelected: { borderColor: '#0A84FF', backgroundColor: '#f0f7ff' },
  optionIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8f4ff', alignItems: 'center', justifyContent: 'center' },
  optionContent: { flex: 1, marginLeft: 12 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  subtypeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, marginLeft: 16 },
  subtypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  subtypeCardSelected: { borderColor: '#0A84FF', backgroundColor: '#e8f4ff' },
  subtypeTitle: { fontSize: 14, color: '#333', marginLeft: 6 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#eee' },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 16, marginTop: 24, gap: 8 },
  nextButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  photoButtonsRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  addPhotoButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 24, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
  addPhotoButtonSingle: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 32, marginTop: 16, borderWidth: 2, borderColor: '#0A84FF', borderStyle: 'dashed' },
  addPhotoText: { fontSize: 16, color: '#0A84FF', marginTop: 8, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  photoItem: { position: 'relative', width: (SCREEN_WIDTH - 80) / 3, height: (SCREEN_WIDTH - 80) / 3 },
  photoThumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  removePhotoButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  photoHint: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 16 },
  reviewCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  reviewValue: { fontSize: 16, color: '#333' },
  tapsPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8e1', borderRadius: 12, padding: 16, marginVertical: 24, gap: 8 },
  tapsText: { fontSize: 16, fontWeight: '600', color: '#f59e0b' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C759', borderRadius: 12, paddingVertical: 16, gap: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: SCREEN_WIDTH - 48, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 16 },
  modalDescription: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  modalButtonPrimary: { backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalButtonPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalButtonSecondary: { backgroundColor: '#f8f9fa', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalButtonSecondaryText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalButtonTertiary: { paddingVertical: 12 },
  modalButtonTertiaryText: { fontSize: 14, color: '#999' },
  // Autocomplete styles
  autocompleteContainer: { flex: 1 },
  selectedAddressCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f0fff4', borderRadius: 12, padding: 16, marginTop: 16, gap: 12 },
  selectedAddressDetails: { flex: 1 },
  selectedAddressText: { fontSize: 16, fontWeight: '600', color: '#333' },
  selectedAddressSubtext: { fontSize: 14, color: '#666', marginTop: 4 },
  selectedAddressCoords: { fontSize: 12, color: '#0A84FF', marginTop: 4 },
  address2Container: { marginTop: 16 },
  address2Label: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
  address2Input: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#ddd' },
  coordsNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderRadius: 8, padding: 12, marginTop: 16, gap: 8 },
  coordsNoteText: { fontSize: 12, color: '#0A84FF' },
  manualAddressButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveAddressButton: { flex: 2, backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveAddressButtonDisabled: { opacity: 0.5 },
  saveAddressButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  manualEntryLink: { marginTop: 16, alignItems: 'center' },
  manualEntryLinkText: { fontSize: 14, color: '#0A84FF', textDecorationLine: 'underline' },
});
