/**
 * ECardDashboardScreen -- LEGACY REDIRECT
 *
 * This screen was the original 3,000+ line monolithic editor.
 * It has been replaced by ECardEditScreen + EditorLayout.
 *
 * This file now exists solely to redirect any remaining navigation
 * references (e.g. from ECardOnboardingComplete, MyCardsScreen, etc.)
 * to the new ECardEdit flow.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';

interface Props {
  navigation: any;
  route: any;
}

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const params = route.params || {};
  const cardId = params.cardId;

  useEffect(() => {
    if (cardId) {
      // Replace this screen in the stack with the new editor
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'ECardHub' },
            { name: 'ECardEdit', params: { cardId } },
          ],
        })
      );
    } else {
      // No card ID — go to hub
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ECardHub' }],
        })
      );
    }
  }, [cardId, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00C853" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});
