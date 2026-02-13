import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// Theme configurations
const THEMES = [
  {
    id: 'classic-gradient',
    name: 'Classic Gradient',
    isPro: false,
    colors: ['#667eea', '#764ba2'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    isPro: false,
    colors: ['#00C9FF', '#92FE9D'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'sunset-vibes',
    name: 'Sunset Vibes',
    isPro: false,
    colors: ['#FF512F', '#F09819'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight',
    isPro: false,
    colors: ['#1A1A1A', '#333333'],
    textColor: '#fff',
    buttonStyle: 'outline',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    isPro: false,
    colors: ['#FFFFFF', '#F5F5F5'],
    textColor: '#1A1A1A',
    buttonStyle: 'outline',
  },
  {
    id: 'forest-green',
    name: 'Forest',
    isPro: false,
    colors: ['#134E5E', '#71B280'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    isPro: true,
    colors: ['#F4C4F3', '#FC67FA'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    isPro: true,
    colors: ['#0F0C29', '#302B63', '#24243E'],
    textColor: '#00FF88',
    buttonStyle: 'outline',
  },
  {
    id: 'candy-pop',
    name: 'Candy Pop',
    isPro: true,
    colors: ['#FF6B6B', '#FFE66D'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    isPro: true,
    colors: ['#00D2FF', '#3A7BD5', '#9B59B6'],
    textColor: '#fff',
    buttonStyle: 'fill',
  },
  {
    id: 'luxury-black',
    name: 'Luxury Black',
    isPro: true,
    colors: ['#0D0D0D', '#1A1A1A'],
    textColor: '#D4AF37',
    buttonStyle: 'outline',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    isPro: true,
    colors: ['#a8edea', '#fed6e3', '#d299c2'],
    textColor: '#333',
    buttonStyle: 'fill',
  },
];

interface Props {
  navigation: any;
  route: any;
}

export default function ECardThemesScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { onSelect, currentTheme } = route.params || {};
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'classic-gradient');

  const handleSelectTheme = (theme: any) => {
    if (theme.isPro) {
      // Show premium upsell
      navigation.navigate('ECardPremiumUpsell', {
        feature: 'theme',
        themeName: theme.name,
      });
      return;
    }
    setSelectedTheme(theme.id);
    if (onSelect) {
      onSelect(theme);
    }
  };

  const handleApply = () => {
    const theme = THEMES.find(t => t.id === selectedTheme);
    if (onSelect && theme) {
      onSelect(theme);
    }
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>Themes</Text>
        <TouchableOpacity onPress={handleApply}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Free Themes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Themes</Text>
          <View style={styles.themesGrid}>
            {THEMES.filter(t => !t.isPro).map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardSelected,
                ]}
                onPress={() => handleSelectTheme(theme)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.colors as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.themePreview}
                >
                  {/* Mini Preview */}
                  <View style={styles.miniPreview}>
                    <View style={[styles.miniAvatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <View style={[styles.miniName, { backgroundColor: theme.textColor === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }]} />
                    <View style={[styles.miniTitle, { backgroundColor: theme.textColor === '#fff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]} />
                    <View style={styles.miniButtons}>
                      {[1, 2, 3].map((i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.miniButton,
                            theme.buttonStyle === 'fill' 
                              ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                              : { borderWidth: 1, borderColor: theme.textColor === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }
                          ]} 
                        />
                      ))}
                    </View>
                  </View>
                </LinearGradient>
                {selectedTheme === theme.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#00C853" />
                  </View>
                )}
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pro Themes */}
        <View style={styles.section}>
          <View style={styles.proHeader}>
            <Text style={styles.sectionTitle}>Pro Themes</Text>
            <View style={styles.proBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
          <View style={styles.themesGrid}>
            {THEMES.filter(t => t.isPro).map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={styles.themeCard}
                onPress={() => handleSelectTheme(theme)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.colors as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.themePreview}
                >
                  {/* Mini Preview */}
                  <View style={styles.miniPreview}>
                    <View style={[styles.miniAvatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <View style={[styles.miniName, { backgroundColor: theme.textColor === '#fff' || theme.textColor === '#D4AF37' || theme.textColor === '#00FF88' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }]} />
                    <View style={[styles.miniTitle, { backgroundColor: theme.textColor === '#fff' || theme.textColor === '#D4AF37' || theme.textColor === '#00FF88' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]} />
                    <View style={styles.miniButtons}>
                      {[1, 2, 3].map((i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.miniButton,
                            theme.buttonStyle === 'fill' 
                              ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                              : { borderWidth: 1, borderColor: theme.textColor }
                          ]} 
                        />
                      ))}
                    </View>
                  </View>
                  {/* Pro Lock */}
                  <View style={styles.proLock}>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                  </View>
                </LinearGradient>
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unlock Pro Banner */}
        <TouchableOpacity 
          style={styles.unlockBanner}
          onPress={() => navigation.navigate('ECardPremiumUpsell')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.unlockGradient}
          >
            <Ionicons name="star" size={28} color="#fff" />
            <View style={styles.unlockText}>
              <Text style={styles.unlockTitle}>Unlock All Pro Themes</Text>
              <Text style={styles.unlockSubtitle}>Get access to 20+ premium themes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  themeCard: {
    width: CARD_WIDTH,
    marginHorizontal: 10,
    marginBottom: 20,
    position: 'relative',
  },
  themeCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  themePreview: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  miniPreview: {
    alignItems: 'center',
    width: '100%',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  miniName: {
    width: 48,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  miniTitle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  miniButtons: {
    width: '100%',
    gap: 6,
  },
  miniButton: {
    width: '100%',
    height: 16,
    borderRadius: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  proLock: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 6,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  unlockBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  unlockText: {
    flex: 1,
  },
  unlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  unlockSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
