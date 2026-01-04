import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface QuickHelpProps {
  question: string;
  options?: string[]; // Defaults to Yes/No if not provided
  onAnswer: (answer: string) => void;
}

export default function QuickHelpCard({ question, options = ['Yes', 'No', 'Not Sure'], onAnswer }: QuickHelpProps) {
  const [visible, setVisible] = useState(true);

  const handlePress = (answer: string) => {
    onAnswer(answer);
    setVisible(false); // Hide card after answering
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="help-buoy" size={16} color="white" />
        </View>
        <Text style={styles.title}>Quick Help</Text>
        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.question}>{question}</Text>
      
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity 
            key={opt} 
            style={styles.optionButton} 
            onPress={() => handlePress(opt)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.footer}>
        Help the community by answering this quick question! 🙏
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    backgroundColor: '#8B5CF6', // Purple for "Community Help"
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});