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
import EditorLayout from '../../components/ecard/editor/EditorLayout';

const ACCENT = '#00C853';

// ── Inner shell (must be inside EditorProvider) ───────────────────────────────

function EditorShell() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ECardEdit'>>();
  const { cardId } = route.params;

  const { user, loading: authLoading, isPro } = useAuth();
  const { isDark } = useThemeContext();
  const { state, loadCard } = useEditor();

  const [initialLoading, setInitialLoading] = useState(true);

  // ── Auth guard + card load ──────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      return;
    }

    if (cardId) {
      loadCard(cardId).finally(() => setInitialLoading(false));
    }
  }, [cardId, user, authLoading, loadCard, navigation]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (initialLoading || authLoading) {
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ECardHome' as never);
            }
          }}
        >
          <Text style={styles.backButtonText}>Back to Cards</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Editor ──────────────────────────────────────────────────────────────────

  return (
    <EditorLayout
      isDark={isDark}
      isPro={isPro}
      userId={user?.id}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ECardHome' as never);
        }
      }}
      onPreview={() => {
        navigation.navigate('ECardPreview' as never, { cardId } as never);
      }}
    />
  );
}

// ── Screen (wraps in EditorProvider) ──────────────────────────────────────────

export default function ECardEditScreen() {
  return (
    <EditorProvider>
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
