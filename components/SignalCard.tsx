import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SignalCardProps {
  label: string;
  icon: string;
  tapCount: number;
  onTap: () => void;
  color: string;
}

export default function SignalCard({ label, icon, tapCount, onTap, color }: SignalCardProps) {
  const isSelected = tapCount > 0;
  
  const getFireEmojis = () => {
    if (tapCount === 0) return '';
    if (tapCount === 1) return '🔥';
    if (tapCount === 2) return '🔥🔥';
    return '🔥🔥🔥';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && { backgroundColor: color }
      ]}
      onPress={onTap}
      activeOpacity={0.7}
    >
      {isSelected && (
        <View style={[styles.checkmark, { borderColor: color }]}>
          <Text style={[styles.checkmarkText, { color: color }]}>✓</Text>
        </View>
      )}
      
      <Text style={styles.icon}>{icon}</Text>
      
      <Text style={[
        styles.label,
        isSelected && styles.labelSelected
      ]}>
        {label}
      </Text>
      
      {isSelected && (
        <Text style={styles.fireEmojis}>{getFireEmojis()}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  fireEmojis: {
    fontSize: 18,
    marginTop: 6,
    position: 'absolute',
    bottom: 10,
  },
});
 