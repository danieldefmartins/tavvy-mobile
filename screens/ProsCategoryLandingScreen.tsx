import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  categoryId: string;
  categoryName: string;
};

export default function ProsCategoryLandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { categoryId, categoryName } = route.params || { categoryId: 'general', categoryName: 'Home Services' };

  const howItWorks = [
    { step: 1, title: 'Tell us what you need', description: 'Answer a few quick questions about your project', icon: 'chatbubble-ellipses' },
    { step: 2, title: 'Get matched with pros', description: 'We\'ll connect you with top-rated local professionals', icon: 'people' },
    { step: 3, title: 'Compare and hire', description: 'Review quotes, profiles, and reviews to find the best fit', icon: 'checkmark-circle' },
  ];

  const popularServices = ['Repair', 'Installation', 'Maintenance', 'Inspection', 'Consultation', 'Emergency'];

  const handleGetQuotes = () => {
    navigation.navigate('ProsRequestStep1', { categoryId, categoryName });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{categoryName}</Text>
            <Text style={styles.heroSubtitle}>Find trusted professionals near you</Text>
            <TouchableOpacity style={styles.heroButton} onPress={handleGetQuotes}>
              <Text style={styles.heroButtonText}>Get Free Quotes</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Tavvy Works</Text>
          {howItWorks.map((item) => (
            <View key={item.step} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
              <View style={styles.stepIcon}>
                <Ionicons name={item.icon as any} size={24} color={ProsColors.primary} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <View style={styles.tagsContainer}>
            {popularServices.map((service, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>{service}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Tavvy</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <Ionicons name="shield-checkmark" size={28} color={ProsColors.primary} />
              <Text style={styles.benefitTitle}>Verified Pros</Text>
              <Text style={styles.benefitText}>All professionals are vetted and reviewed</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="cash" size={28} color={ProsColors.primary} />
              <Text style={styles.benefitTitle}>Free Quotes</Text>
              <Text style={styles.benefitText}>Compare prices with no obligation</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="star" size={28} color={ProsColors.primary} />
              <Text style={styles.benefitTitle}>Real Reviews</Text>
              <Text style={styles.benefitText}>Read honest feedback from customers</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="flash" size={28} color={ProsColors.primary} />
              <Text style={styles.benefitTitle}>Fast Response</Text>
              <Text style={styles.benefitText}>Get quotes within hours, not days</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSubtitle}>Get free quotes from top-rated {categoryName.toLowerCase()} pros</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetQuotes}>
            <Text style={styles.ctaButtonText}>Get Free Quotes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 280, backgroundColor: ProsColors.primary, justifyContent: 'flex-end' },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { padding: 24 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
  heroButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignSelf: 'flex-start', gap: 8 },
  heroButtonText: { fontSize: 16, fontWeight: '600', color: ProsColors.primary },
  section: { padding: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  stepCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: ProsColors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  stepNumberText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  stepDescription: { fontSize: 14, color: '#6B7280' },
  stepIcon: { marginLeft: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  tagText: { color: ProsColors.primary, fontWeight: '500', fontSize: 14 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitCard: { width: '47%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, alignItems: 'center' },
  benefitTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 8, marginBottom: 4 },
  benefitText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  ctaSection: { backgroundColor: '#F3F4F6', padding: 24, margin: 16, borderRadius: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  ctaSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  ctaButton: { backgroundColor: ProsColors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  ctaButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
