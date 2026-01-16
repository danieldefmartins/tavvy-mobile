import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Lazy import MapLibre - only loaded when component mounts
let MapLibreGL: any = null;
let mapLibreInitialized = false;

const initializeMapLibre = async (): Promise<boolean> => {
  if (mapLibreInitialized && MapLibreGL) {
    return true;
  }
  
  try {
    // Dynamic import to defer loading
    const module = await import('@maplibre/maplibre-react-native');
    MapLibreGL = module.default;
    
    // Initialize MapLibre - required before any MapView is rendered
    MapLibreGL.setAccessToken(null);
    
    // Try to set connected state
    try {
      await MapLibreGL.setConnected(true);
    } catch (e) {
      console.log('MapLibre setConnected warning:', e);
    }
    
    mapLibreInitialized = true;
    console.log('✅ MapLibre initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ MapLibre initialization failed:', error);
    return false;
  }
};

interface LazyMapViewProps {
  style?: any;
  styleURL?: string;
  logoEnabled?: boolean;
  attributionEnabled?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onDidFailLoadingMap?: () => void;
  children?: React.ReactNode;
  mapKey?: string;
}

export interface LazyMapViewRef {
  getMapLibreGL: () => any;
  isReady: () => boolean;
}

const LazyMapView = forwardRef<LazyMapViewRef, LazyMapViewProps>((props, ref) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    getMapLibreGL: () => MapLibreGL,
    isReady: () => isReady,
  }));

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        const success = await initializeMapLibre();
        if (mounted) {
          if (success) {
            setIsReady(true);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('LazyMapView init error:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[props.style, styles.container]}>
        <ActivityIndicator size="large" color="#0F1233" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (hasError || !MapLibreGL) {
    return (
      <View style={[props.style, styles.container]}>
        <Ionicons name="map-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Map unavailable</Text>
      </View>
    );
  }

  const { children, mapKey, ...mapProps } = props;

  return (
    <MapLibreGL.MapView
      key={mapKey}
      {...mapProps}
    >
      {children}
    </MapLibreGL.MapView>
  );
});

// Export the MapLibre module getter for use with Camera, PointAnnotation, etc.
export const getMapLibreGL = () => MapLibreGL;
export const isMapLibreReady = () => mapLibreInitialized && MapLibreGL !== null;

// Export a hook to use MapLibre components
export const useMapLibre = () => {
  const [ready, setReady] = useState(mapLibreInitialized);
  
  useEffect(() => {
    if (!mapLibreInitialized) {
      initializeMapLibre().then(success => {
        setReady(success);
      });
    }
  }, []);
  
  return {
    MapLibreGL,
    isReady: ready,
  };
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default LazyMapView;
