import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface DraggableImageCropperProps {
  imageUri: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:4';
  onPositionChange?: (position: { x: number; y: number }) => void;
  onConfirm?: (position: { x: number; y: number }) => void;
  onCancel?: () => void;
  initialPosition?: { x: number; y: number };
  showControls?: boolean;
  containerWidth?: number;
}

const ASPECT_RATIOS = {
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
};

export default function DraggableImageCropper({
  imageUri,
  aspectRatio = '1:1',
  onPositionChange,
  onConfirm,
  onCancel,
  initialPosition = { x: 50, y: 50 },
  showControls = true,
  containerWidth,
}: DraggableImageCropperProps) {
  const [position, setPosition] = useState(initialPosition);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const panRef = useRef(new Animated.ValueXY()).current;
  const lastPosition = useRef(initialPosition);

  // Calculate container dimensions based on aspect ratio
  const screenWidth = containerWidth || Dimensions.get('window').width - 40;
  const ratio = ASPECT_RATIOS[aspectRatio];
  const previewWidth = screenWidth;
  const previewHeight = previewWidth / ratio;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panRef.setOffset({
          x: panRef.x._value,
          y: panRef.y._value,
        });
        panRef.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position based on drag
        const deltaXPercent = (gestureState.dx / previewWidth) * -100;
        const deltaYPercent = (gestureState.dy / previewHeight) * -100;
        
        const newX = Math.max(0, Math.min(100, lastPosition.current.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100, lastPosition.current.y + deltaYPercent));
        
        setPosition({ x: newX, y: newY });
        onPositionChange?.({ x: newX, y: newY });
      },
      onPanResponderRelease: () => {
        panRef.flattenOffset();
        lastPosition.current = position;
      },
    })
  ).current;

  const handleQuickPosition = (x: number, y: number) => {
    setPosition({ x, y });
    lastPosition.current = { x, y };
    onPositionChange?.({ x, y });
  };

  const handleConfirm = () => {
    onConfirm?.(position);
  };

  const quickPresets = [
    { label: '↖', x: 0, y: 0 },
    { label: '↑', x: 50, y: 0 },
    { label: '↗', x: 100, y: 0 },
    { label: '←', x: 0, y: 50 },
    { label: '●', x: 50, y: 50 },
    { label: '→', x: 100, y: 50 },
    { label: '↙', x: 0, y: 100 },
    { label: '↓', x: 50, y: 100 },
    { label: '↘', x: 100, y: 100 },
  ];

  return (
    <View style={styles.container}>
      {/* Aspect Ratio Label */}
      <Text style={styles.aspectLabel}>
        {aspectRatio} Preview - Drag to position
      </Text>

      {/* Draggable Preview */}
      <View
        style={[
          styles.previewContainer,
          {
            width: previewWidth,
            height: previewHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.previewImage,
            {
              objectPosition: `${position.x}% ${position.y}%`,
            },
          ]}
          resizeMode="cover"
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source;
            setImageSize({ width, height });
          }}
        />
        
        {/* Drag Hint Overlay */}
        <View style={styles.dragHintOverlay}>
          <View style={styles.dragHintBadge}>
            <Ionicons name="move" size={16} color="#fff" />
            <Text style={styles.dragHintText}>Drag to adjust</Text>
          </View>
        </View>
      </View>

      {/* Position Display */}
      <Text style={styles.positionText}>
        Position: {position.x.toFixed(0)}% x {position.y.toFixed(0)}%
      </Text>

      {/* Quick Presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick Presets</Text>
        <View style={styles.presetsGrid}>
          {quickPresets.map((preset) => (
            <TouchableOpacity
              key={`${preset.x}-${preset.y}`}
              style={[
                styles.presetButton,
                position.x === preset.x && position.y === preset.y && styles.presetButtonActive,
              ]}
              onPress={() => handleQuickPosition(preset.x, preset.y)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  position.x === preset.x && position.y === preset.y && styles.presetButtonTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      {showControls && (
        <View style={styles.actionsContainer}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {onConfirm && (
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Save Position</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  aspectLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  dragHintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dragHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dragHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  positionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  presetsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  presetsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  presetButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  presetButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
