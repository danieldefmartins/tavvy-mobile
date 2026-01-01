import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TapButtonProps {
  label: string;
  emoji: string;
  tapCount: number;
  onTap: () => void;
  color: string;
}

export default function TapButton({ label, emoji, tapCount, onTap, color }: TapButtonProps) {
  const getEmoji = () => {
    if (tapCount === 0) return '⚪️';
    if (tapCount === 1) return emoji;
    if (tapCount === 2) return emoji + emoji;
    return emoji + emoji + emoji;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.button, { borderColor: color }]}
        onPress={onTap}
      >
        <Text style={styles.emoji}>{getEmoji()}</Text>
        <Text style={[styles.tapText, { color }]}>
          {tapCount === 0 ? 'Tap' : `${tapCount} tap${tapCount > 1 ? 's' : ''}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  tapText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
