import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SignalFilterProps {
  onFilterChange: (filterType: string, value: string) => void;
}

const vehicleTypes = ['Van', 'RV', 'Truck Camper', 'Motorhome'];
const tripPurposes = ['Full-time', 'Weekend', 'Family', 'Off-grid'];

const SignalFilter: React.FC<SignalFilterProps> = ({ onFilterChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter by Vehicle Type</Text>
      <View style={styles.filterGroup}>
        {vehicleTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.filterButton}
            onPress={() => onFilterChange('vehicleType', type)}
          >
            <Text style={styles.filterText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.title}>Filter by Trip Purpose</Text>
      <View style={styles.filterGroup}>
        {tripPurposes.map((purpose) => (
          <TouchableOpacity
            key={purpose}
            style={styles.filterButton}
            onPress={() => onFilterChange('tripPurpose', purpose)}
          >
            <Text style={styles.filterText}>{purpose}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#00C2CB',
    padding: 8,
    margin: 4,
    borderRadius: 4,
  },
  filterText: {
    color: '#fff',
  },
});

export default SignalFilter;
