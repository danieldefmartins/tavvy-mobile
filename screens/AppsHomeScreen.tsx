import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 16;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GRID_GAP * 2)) / 3;

interface AppTool {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  backgroundColor: string;
}

const tools: AppTool[] = [
  {
    title: 'Quick Finds',
    icon: 'flash',
    route: 'QuickFinds',
    color: '#FF9500',
    backgroundColor: '#FFF3E0',
  },
  {
    title: 'Paths',
    icon: 'trail-sign',
    route: 'ExperiencePaths',
    color: '#5856D6',
    backgroundColor: '#EDE7F6',
  },
  {
    title: 'Happening',
    icon: 'sparkles',
    route: 'HappeningNow',
    color: '#FF2D55',
    backgroundColor: '#FCE4EC',
  },
  {
    title: 'Map Lens',
    icon: 'locate',
    route: 'Home',
    color: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  {
    title: 'Pros',
    icon: 'briefcase',
    route: 'Pros',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  {
    title: 'Saved',
    icon: 'bookmark',
    route: 'Saved',
    color: '#FF6B6B',
    backgroundColor: '#FFEBEE',
  },
];

export default function AppsHomeScreen() {
  const navigation = useNavigation<any>();

  const handleToolPress = (tool: AppTool) => {
    if (tool.route === 'Home' || tool.route === 'Pros') {
      // Navigate to other tabs
      navigation.navigate(tool.route);
    } else if (tool.route === 'Saved') {
      // Navigate to saved screen in menu stack
      navigation.navigate('Menu', { screen: 'SavedMain' });
    } else {
      // Navigate within Apps stack
      navigation.navigate(tool.route);
    }
  };

  const handlePersonalLogin = () => {
    navigation.navigate('Menu', { screen: 'Login' });
  };

  const handleProLogin = () => {
    navigation.navigate('Pros', { screen: 'ProsRegistration' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Apps</Text>
        <Text style={styles.subtitle}>Tools & shortcuts</Text>
      </View>

      {/* Login Buttons Row */}
      <View style={styles.loginButtonsRow}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handlePersonalLogin}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={18} color="#007AFF" />
          <Text style={styles.loginButtonText}>Personal Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.loginButton, styles.proLoginButton]}
          onPress={handleProLogin}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase-outline" size={18} color="#5856D6" />
          <Text style={[styles.loginButtonText, styles.proLoginButtonText]}>Pro Login</Text>
        </TouchableOpacity>
      </View>

      {/* Apps Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.title}
              style={styles.gridItem}
              onPress={() => handleToolPress(tool)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: tool.backgroundColor }]}>
                <Ionicons name={tool.icon} size={32} color={tool.color} />
              </View>
              <Text style={styles.itemTitle} numberOfLines={1}>{tool.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonText}>More tools coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 4,
    color: '#8E8E93',
    fontSize: 15,
  },
  loginButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  loginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  proLoginButton: {
    borderColor: '#5856D6',
    backgroundColor: '#F8F6FF',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  proLoginButtonText: {
    color: '#5856D6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingTop: 16,
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  comingSoonSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
