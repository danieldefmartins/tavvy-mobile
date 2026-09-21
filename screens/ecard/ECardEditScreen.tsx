import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import FocusedStatusBar from '../../components/FocusedStatusBar';
import type { ParamListBase as DynamicStackParams } from '@react-navigation/native';
import type { NativeStackNavigationProp as DynamicStackNavigation } from '@react-navigation/native-stack';
/**
 * ECardEditScreen -- Thin shell wrapping EditorProvider + EditorLayout.
 * Ported from web: pages/app/ecard/[cardId]/edit.tsx
 *
 * Gets cardId from route params, loads the card via EditorContext,
 * then renders EditorLayout for the full editing experience.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { EditorProvider, useEditor } from '../../lib/ecard/EditorContext';
import { useECardEntitlement } from '../../hooks/useECardEntitlement';
import CardStudioLayout from '../../components/ecard/editor/CardStudioLayout';

const ACCENT = '#00C853';

// ── Inner shell (must be inside EditorProvider) ───────────────────────────────

function EditorShell() {
  const copy = useReleaseCopy();
  const navigation = useNavigation<DynamicStackNavigation<DynamicStackParams>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ECardEdit'>>();
  const { cardId } = route.params;

  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: planLoading, error: planError, refresh: retryPlan } = useECardEntitlement();
  const { isDark } = useThemeContext();
  const { state, loadCard } = useEditor();

  const [initialLoading, setInitialLoading] = useState(true);

  // ── Auth guard + card load ──────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    if (cardId) {
      loadCard(cardId, user.id).finally(() => setInitialLoading(false));
    }
  }, [cardId, user, authLoading, loadCard, navigation]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (initialLoading || authLoading || planLoading) {
    const bg = isDark ? '#000000' : '#FAFAFA';
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (state.loadError) {
    const bg = isDark ? '#000000' : '#FAFAFA';
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>
          {state.loadError}
        </Text>
        <TouchableOpacity style={[styles.backButton, { marginBottom: 12 }]} onPress={() => { if (!user) return; setInitialLoading(true); void loadCard(cardId, user.id).finally(() => setInitialLoading(false)); }}><Text style={styles.backButtonText}>{copy("Retry loading card")}</Text></TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ECardHome');
            }
          }}
        >
          <Text style={styles.backButtonText}>{copy("Back to Cards")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (planError) return <SafeAreaView style={[styles.centered, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}><Text style={{ color: isDark ? '#FFFFFF' : '#111827', marginBottom: 16 }}>{planError}</Text><TouchableOpacity style={styles.backButton} onPress={() => void retryPlan()}><Text style={styles.backButtonText}>{copy("Retry plan check")}</Text></TouchableOpacity></SafeAreaView>;

  // ── Editor ──────────────────────────────────────────────────────────────────

  return (
    <CardStudioLayout
      isDark={isDark}
      isPro={isPro}
      userId={user?.id}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ECardHome');
        }
      }}
      onPreview={() => {
        navigation.navigate('ECardPreview', { cardId, studioPreview: true, cardData: state.card, links: state.links, pendingUploads: state.pendingUploads.size });
      }}
    />
  );
}

// ── Screen (wraps in EditorProvider) ──────────────────────────────────────────

export default function ECardEditScreen() {
  const { isDark } = useThemeContext();
  return (
    <EditorProvider>
      <FocusedStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <EditorShell />
    </EditorProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
