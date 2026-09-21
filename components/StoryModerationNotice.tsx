import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';

/** Route-compatible landing for the retired merchant moderation screens. */
export default function StoryModerationNotice() {
  const navigation = useNavigation();
  const { isDark } = useThemeContext();
  const textColor = isDark ? '#FFFFFF' : '#1B2B5B';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0D0D1A' : '#FFFFFF' }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
        <Ionicons name="shield-checkmark-outline" size={40} color="#0D9488" />
        <Text style={{ color: textColor, fontSize: 24, fontWeight: '700', marginTop: 18 }}>Customer story reports</Text>
        <Text style={{ color: textColor, fontSize: 16, lineHeight: 24, marginTop: 14 }}>
          Reports are sent to Tavvy for review. To report a concern, open the story and choose Report.
        </Text>
        <Text style={{ color: textColor, fontSize: 16, lineHeight: 24, marginTop: 14 }}>
          Restaurant accounts can manage their own highlights. Customer report decisions are handled by Tavvy.
        </Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}
          style={{ alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, backgroundColor: '#0D9488', marginTop: 24 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
