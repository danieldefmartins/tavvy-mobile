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
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  fireEmojis: {
    fontSize: 20,
    marginTop: 8,
    position: 'absolute',
    bottom: 12,
  },
});
