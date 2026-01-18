import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

type AppItem = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route?: string;
  comingSoon?: boolean;
};

const apps: AppItem[] = [
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: 'flash',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    route: 'QuickFinds',
    comingSoon: true,
  },
  {
    id: 'paths',
    name: 'Paths',
    icon: 'git-branch',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    comingSoon: true,
  },
  {
    id: 'happening',
    name: 'Happening',
    icon: 'sparkles',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    comingSoon: true,
  },
  {
    id: 'map-lens',
    name: 'Map Lens',
    icon: 'scan',
    color: '#10B981',
    bgColor: '#D1FAE5',
    comingSoon: true,
  },
  {
    id: 'pros',
    name: 'Pros',
    icon: 'briefcase',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    route: 'ProsHome',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'bookmark',
    color: '#F87171',
    bgColor: '#FEE2E2',
    route: 'SavedMain',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person',
    color: '#6B7280',
    bgColor: '#E5E7EB',
    route: 'ProfileMain',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    color: '#10B981',
    bgColor: '#D1FAE5',
    route: 'UniversalAdd',
  },
];

export default function AppsHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loginMode, setLoginMode] = useState<'personal' | 'pro'>('personal');

  const handleAppPress = (app: AppItem) => {
    if (app.comingSoon) {
      // Show coming soon message or do nothing
      return;
    }
    if (app.route) {
      navigation.navigate(app.route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Apps</Text>
          <Text style={styles.subtitle}>Tools & shortcuts</Text>
        </View>

        {/* Login Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMode === 'personal' && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMode('personal')}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={loginMode === 'personal' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.toggleText,
                loginMode === 'personal' && styles.toggleTextActive,
              ]}
            >
              Personal Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMode === 'pro' && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMode('pro')}
          >
            <Ionicons
              name="briefcase-outline"
              size={18}
              color={loginMode === 'pro' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.toggleText,
                loginMode === 'pro' && styles.toggleTextActive,
              ]}
            >
              Pro Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Apps Grid */}
        <View style={styles.appsGrid}>
          {apps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appItem}
              onPress={() => handleAppPress(app)}
              activeOpacity={app.comingSoon ? 1 : 0.7}
            >
              <View style={[styles.appIcon, { backgroundColor: app.bgColor }]}>
                <Ionicons name={app.icon} size={28} color={app.color} />
              </View>
              <Text style={styles.appName}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon Message */}
        <Text style={styles.comingSoonText}>More tools coming soon</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  toggleButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#3B82F6',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 20,
  },
  appItem: {
    width: '28%',
    alignItems: 'center',
    marginBottom: 10,
  },
  appIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  comingSoonText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 30,
  },
});
