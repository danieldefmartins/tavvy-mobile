/**
 * ECardStudioScreen — New Card Studio editor screen.
 *
 * Drop-in replacement for ECardEditScreen that uses the new
 * CardStudioLayout (bottom-sheet tab-based) instead of the old
 * accordion-based EditorLayout.
 *
 * Same data flow: EditorProvider → loadCard → useAutoSave → CardStudioLayout.
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
import { EditorProvider, useEditor } from '../../lib/ecard/EditorContext';
import { useAutoSave } from '../../lib/ecard/useAutoSave';
import { CardStudioLayout } from '../../components/ecard/studio';

const AMBER = '#FF9F0A';

// ── Inner shell (must be inside EditorProvider) ──────────────────────────────
function StudioShell() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ECardEdit'>>();
  const { cardId } = route.params;
  const { user, loading: authLoading, isPro } = useAuth();
  const { state, loadCard } = useEditor();
  const [initialLoading, setInitialLoading] = useState(true);

  // Auto-save hook
  const { isSaving, saveNow } = useAutoSave({
    userId: user?.id,
    isPro,
  });

  // ── Auth guard + card load ─────────────────────────────────────────────────
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

  // ── Loading state ──────────────────────────────────────────────────────────
  if (initialLoading || authLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={AMBER} />
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (state.loadError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{state.loadError}</Text>
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

  // ── Studio ─────────────────────────────────────────────────────────────────
  return (
    <CardStudioLayout
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ECardHome' as never);
        }
      }}
      onSave={saveNow}
      isSaving={isSaving}
      isPro={isPro}
      cardTitle={state.card?.full_name || state.card?.title || 'Edit Card'}
    />
  );
}

// ── Screen (wraps in EditorProvider) ─────────────────────────────────────────
export default function ECardStudioScreen() {
  return (
    <EditorProvider>
      <StudioShell />
    </EditorProvider>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#1C1C1E',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    color: '#EF4444',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: AMBER,
  },
  backButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
