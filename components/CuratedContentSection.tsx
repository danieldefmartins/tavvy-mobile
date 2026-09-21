import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import PlaceCard from './PlaceCard';

interface CuratedContentSectionProps {
  title: string;
  onPlacePress: (placeId: string) => void;
  data: Array<any>; // Replace 'any' with the specific type of your data
}

const CuratedContentSection: React.FC<CuratedContentSectionProps> = ({ title, data, onPlacePress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <PlaceCard place={item} onPress={() => onPlacePress(item.id)} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17013A',
    marginBottom: 8,
  },
});

export default CuratedContentSection;
