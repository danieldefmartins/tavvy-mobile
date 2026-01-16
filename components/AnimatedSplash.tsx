import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

// TavvY Navy background color
const BACKGROUND_COLOR = '#0F1233';

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onAnimationComplete }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash screen immediately
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();

    // Start the zoom animation after a brief pause to let the logo be visible
    const animationTimeout = setTimeout(() => {
      // Yelp-style zoom effect: scale up while fading out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 15, // Zoom in dramatically like Yelp
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          delay: 100, // Start fading slightly after zoom begins
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animation complete, notify parent
        onAnimationComplete();
      });
    }, 800); // Show logo for 800ms before animating

    return () => clearTimeout(animationTimeout);
  }, [scaleAnim, opacityAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6, // 60% of screen width
    height: width * 0.6, // Keep it square
  },
});

export default AnimatedSplash;
