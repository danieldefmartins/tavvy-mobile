import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
  route: any;
}

export default function ECardOnboardingCompleteScreen({ navigation, route }: Props) {
  const { templateId, colorSchemeId, profile, links } = route.params || {};
  const confettiRef = useRef<any>(null);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Trigger confetti
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);

    // Animate card
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleViewCard = () => {
    // Navigate to the dashboard/editor
    navigation.navigate('ECardDashboard', {
      templateId,
      colorSchemeId,
      profile,
      links,
      isNewCard: true,
    });
  };

  const handleCustomize = () => {
    navigation.navigate('ECardDashboard', {
      templateId,
      colorSchemeId,
      profile,
      links,
      isNewCard: true,
      openAppearance: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Confetti */}
      <ConfettiCannon
        ref={confettiRef}
        count={100}
        origin={{ x: width / 2, y: -20 }}
        autoStart={false}
        fadeOut
        fallSpeed={2500}
        colors={['#00C853', '#00E676', '#69F0AE', '#B9F6CA', '#FFD700', '#FF6B6B']}
      />

      <View style={styles.content}>
        {/* Celebration Text */}
        <Animated.View 
          style={[
            styles.celebrationContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Looking good!</Text>
          <Text style={styles.subtitle}>
            Your card is ready. Share it with the world or customize it further.
          </Text>
        </Animated.View>

        {/* Preview Card */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            {/* Profile Section */}
            {profile?.image ? (
              <Image source={{ uri: profile.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
            )}
            <Text style={styles.profileName}>{profile?.name || 'Your Name'}</Text>
            {profile?.title ? (
              <Text style={styles.profileTitle}>{profile.title}</Text>
            ) : null}
            {profile?.bio ? (
              <Text style={styles.profileBio} numberOfLines={2}>{profile.bio}</Text>
            ) : null}

            {/* Links Preview */}
            {links && links.length > 0 && (
              <View style={styles.linksPreview}>
                {links.slice(0, 3).map((link: any, index: number) => (
                  <View key={index} style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>
                      {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    </Text>
                  </View>
                ))}
                {links.length > 3 && (
                  <Text style={styles.moreLinks}>+{links.length - 3} more</Text>
                )}
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{links?.length || 0}</Text>
            <Text style={styles.statLabel}>Links</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Template</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="infinite" size={24} color="#00C853" />
            <Text style={styles.statLabel}>Possibilities</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.customizeButton}
          onPress={handleCustomize}
          activeOpacity={0.8}
        >
          <Ionicons name="color-palette-outline" size={20} color="#00C853" />
          <Text style={styles.customizeButtonText}>Customize</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={handleViewCard}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00C853', '#00E676']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.viewButtonText}>View my card</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  previewCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  linksPreview: {
    width: '100%',
    marginTop: 20,
    gap: 8,
  },
  linkButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  moreLinks: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00C853',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  customizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  viewButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
