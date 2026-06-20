import React from 'react';
import { View, Button, Share, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

const OneClickShareButton = ({ cardUrl }: { cardUrl: string }) => {
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out my digital business card: ${cardUrl}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      alert('Error sharing the card: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button onPress={onShare} title="Share My Card" color={Colors.purple} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    alignItems: 'center',
  },
});

export default OneClickShareButton;
