import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: Network.NetworkStateType | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Network Provider that monitors connectivity and shows offline banner.
 * Uses expo-network which is already included in Expo.
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: null,
  });
  const [showBanner, setShowBanner] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable ?? true;
      
      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType: state.type ?? null,
      });

      // Show banner when offline
      if (!isConnected || !isInternetReachable) {
        if (!showBanner) {
          setShowBanner(true);
          Animated.timing(bannerAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // Hide banner when back online
        if (showBanner) {
          Animated.timing(bannerAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowBanner(false));
        }
      }
    } catch (error) {
      console.warn('[Network] Error checking network state:', error);
    }
  };

  useEffect(() => {
    // Check initial state
    checkNetwork();

    // Poll network state every 10 seconds
    checkIntervalRef.current = setInterval(checkNetwork, 10000);

    // Also check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNetwork();
      }
    });

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription.remove();
    };
  }, [showBanner]);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
      
      {/* Offline Banner */}
      {showBanner && (
        <Animated.View 
          style={[
            styles.banner,
            {
              opacity: bannerAnim,
              transform: [{
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              }],
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel="No internet connection"
        >
          <Ionicons name="cloud-offline" size={18} color="#fff" />
          <Text style={styles.bannerText}>
            {!networkState.isConnected 
              ? 'No internet connection' 
              : 'Connection is unstable'}
          </Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default NetworkProvider;
