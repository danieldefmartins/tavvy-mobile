import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

type RouteParams = {
  ProsLeadDetail: { leadId: string | number };
};

export default function ProsLeadDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ProsLeadDetail'>>();
  const { leadId } = route.params ?? ({} as any);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lead Details</Text>
      <Text style={styles.text}>leadId: {String(leadId ?? '')}</Text>
      <Text style={styles.hint}>
        TODO: Fetch lead details from Supabase and render full lead details.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  text: { fontSize: 16, marginBottom: 10 },
  hint: { fontSize: 14, opacity: 0.7, lineHeight: 20 },
});
