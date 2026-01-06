// TavvY Design System - Apple-Inspired Color Scheme
// Supports Light and Dark modes with centralized color management

import { useColorScheme } from 'react-native';

// ===== CORE PALETTE =====
const palette = {
  // Primary Brand Color (Apple Blue)
  blue: '#0A84FF',
  blueLight: '#E1F0FF',
  blueDark: '#0066CC',

  // Signal Colors
  signalPositive: '#0A84FF',      // Blue for positive signals
  signalNeutral: '#8E8E93',       // Gray for neutral/vibe signals  
  signalNegative: '#FF9500',      // Orange for watch out signals

  // Semantic Colors
  success: '#34C759',
  successLight: '#D1FAE5',
  warning: '#FF9500',
  warningLight: '#FEF3C7',
  error: '#FF3B30',
  errorLight: '#FEE2E2',

  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  
  // Light Mode Grays
  gray50: '#F9FAFB',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#D1D1D6',
  gray400: '#C7C7CC',
  gray500: '#8E8E93',
  gray600: '#636366',
  gray700: '#48484A',
  gray800: '#3A3A3C',
  gray900: '#1C1C1E',

  // Dark Mode Specific
  darkBackground: '#000000',
  darkSurface: '#1C1C1E',
  darkSurfaceElevated: '#2C2C2E',
  darkSeparator: '#38383A',
};

// ===== LIGHT THEME =====
export const lightTheme = {
  // Backgrounds
  background: palette.white,
  surface: palette.gray100,
  surfaceElevated: palette.white,
  
  // Text
  text: palette.black,
  textSecondary: palette.gray500,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  
  // Borders & Separators
  border: palette.gray200,
  separator: palette.gray200,
  
  // Interactive Elements
  primary: palette.blue,
  primaryLight: palette.blueLight,
  
  // Tab Bar
  tabBarBackground: 'rgba(255, 255, 255, 0.92)',
  tabBarActive: palette.blue,
  tabBarInactive: palette.gray500,
  
  // Cards
  cardBackground: palette.white,
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Signals
  signalPositive: palette.signalPositive,
  signalNeutral: palette.signalNeutral,
  signalNegative: palette.signalNegative,
  
  // Status
  success: palette.success,
  successLight: palette.successLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  error: palette.error,
  errorLight: palette.errorLight,
  
  // Map
  mapOverlay: 'rgba(255, 255, 255, 0.92)',
  
  // Bottom Sheet
  bottomSheetBackground: palette.gray100,
  bottomSheetHandle: palette.gray300,
  
  // Input
  inputBackground: palette.gray100,
  inputBorder: palette.gray300,
  inputPlaceholder: palette.gray500,
  
  // Photo Overlay Gradient
  photoGradientStart: 'transparent',
  photoGradientEnd: 'rgba(0, 0, 0, 0.7)',
};

// ===== DARK THEME =====
export const darkTheme = {
  // Backgrounds
  background: palette.darkBackground,
  surface: palette.darkSurface,
  surfaceElevated: palette.darkSurfaceElevated,
  
  // Text
  text: palette.white,
  textSecondary: palette.gray500,
  textTertiary: palette.gray600,
  textInverse: palette.black,
  
  // Borders & Separators
  border: palette.darkSeparator,
  separator: palette.darkSeparator,
  
  // Interactive Elements
  primary: palette.blue,
  primaryLight: 'rgba(10, 132, 255, 0.2)',
  
  // Tab Bar
  tabBarBackground: 'rgba(28, 28, 30, 0.92)',
  tabBarActive: palette.blue,
  tabBarInactive: palette.gray500,
  
  // Cards
  cardBackground: palette.darkSurface,
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  // Signals
  signalPositive: palette.signalPositive,
  signalNeutral: palette.gray600,
  signalNegative: palette.signalNegative,
  
  // Status
  success: palette.success,
  successLight: 'rgba(52, 199, 89, 0.2)',
  warning: palette.warning,
  warningLight: 'rgba(255, 149, 0, 0.2)',
  error: palette.error,
  errorLight: 'rgba(255, 59, 48, 0.2)',
  
  // Map
  mapOverlay: 'rgba(28, 28, 30, 0.92)',
  
  // Bottom Sheet
  bottomSheetBackground: palette.darkSurface,
  bottomSheetHandle: palette.gray600,
  
  // Input
  inputBackground: palette.darkSurfaceElevated,
  inputBorder: palette.darkSeparator,
  inputPlaceholder: palette.gray500,
  
  // Photo Overlay Gradient
  photoGradientStart: 'transparent',
  photoGradientEnd: 'rgba(0, 0, 0, 0.8)',
};

// ===== LEGACY COLORS (for backward compatibility) =====
// These map to the new system for existing components
export const Colors = {
  // Primary colors
  primary: palette.blue,
  secondary: palette.gray500,
  
  // Backgrounds
  background: palette.white,
  surface: palette.gray100,
  
  // Text
  text: palette.black,
  textSecondary: palette.gray500,
  
  // Borders
  border: palette.gray200,
  inputBorder: palette.gray300,
  
  // Status colors
  error: palette.error,
  success: palette.success,
  warning: palette.warning,
  
  // Basic colors
  white: palette.white,
  black: palette.black,
  
  // Tab bar
  tabBarActive: palette.blue,
  tabBarInactive: palette.gray500,

  // Review Semantic Themes (Updated to match new design)
  positive: {
    primary: palette.signalPositive,
    light: palette.blueLight,
    text: palette.blue,
  },
  vibe: {
    primary: palette.signalNeutral,
    light: palette.gray200,
    text: palette.gray600,
  },
  negative: {
    primary: palette.signalNegative,
    light: palette.warningLight,
    text: '#CC7700',
  },
};

// ===== THEME HOOK =====
export const useTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// ===== SIGNAL COLORS HELPER =====
export const getSignalColor = (type: 'positive' | 'neutral' | 'negative', theme: typeof lightTheme) => {
  switch (type) {
    case 'positive':
      return theme.signalPositive;
    case 'neutral':
      return theme.signalNeutral;
    case 'negative':
      return theme.signalNegative;
    default:
      return theme.signalNeutral;
  }
};

// ===== DESIGN TOKENS =====
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Large titles
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  // Title 1
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  // Title 2
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  // Title 3
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  // Headline
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  // Body
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  // Callout
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  // Subhead
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  // Caption 1
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Caption 2
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

// ===== SHADOWS =====
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
