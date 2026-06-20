import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

const TrendingRidesCarousel = ({ rides }) => {
  return (
    <View style={styles.carouselContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {rides.map((ride, index) => (
          <View key={index} style={styles.rideCard}>
            <Image source={{ uri: ride.image }} style={styles.rideImage} />
            <Text style={styles.rideName}>{ride.name}</Text>
            <Text style={styles.rideDescription}>{ride.description}</Text>
            <View style={styles.signalIndicators}>
              <Text style={styles.signalText}>Thrill: {ride.thrillLevel}</Text>
              <Text style={styles.signalText}>Wait: {ride.waitTime} mins</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 20,
  },
  rideCard: {
    backgroundColor: '#17013A',
    borderRadius: 16,
    marginHorizontal: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 250,
  },
  rideImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
  },
  rideName: {
    color: '#00C2CB',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  rideDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
  },
  signalIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signalText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default TrendingRidesCarousel;
