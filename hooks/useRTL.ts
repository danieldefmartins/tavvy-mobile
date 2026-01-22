/**
 * Tavvy RTL (Right-to-Left) Support Hook
 * 
 * Provides utilities for handling RTL layouts for Arabic language.
 * 
 * File: src/hooks/useRTL.ts
 */

import { useEffect, useState } from 'react';
import { I18nManager, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isRTL as checkIsRTL, getCurrentLanguage } from '../i18n';

/**
 * Hook to get current RTL state and related utilities
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    const currentLang = getCurrentLanguage();
    setIsRTL(currentLang.rtl);
  }, [i18n.language]);

  /**
   * Get flex direction based on RTL state
   */
  const flexDirection = (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse'): ViewStyle['flexDirection'] => {
    if (!isRTL) return direction;
    
    switch (direction) {
      case 'row':
        return 'row-reverse';
      case 'row-reverse':
        return 'row';
      default:
        return direction;
    }
  };

  /**
   * Get text alignment based on RTL state
   */
  const textAlign = (align: 'left' | 'right' | 'center' | 'auto'): TextStyle['textAlign'] => {
    if (!isRTL || align === 'center' || align === 'auto') return align;
    
    return align === 'left' ? 'right' : 'left';
  };

  /**
   * Get margin/padding start value
   */
  const marginStart = (value: number): ViewStyle => {
    return isRTL ? { marginRight: value } : { marginLeft: value };
  };

  /**
   * Get margin/padding end value
   */
  const marginEnd = (value: number): ViewStyle => {
    return isRTL ? { marginLeft: value } : { marginRight: value };
  };

  /**
   * Get padding start value
   */
  const paddingStart = (value: number): ViewStyle => {
    return isRTL ? { paddingRight: value } : { paddingLeft: value };
  };

  /**
   * Get padding end value
   */
  const paddingEnd = (value: number): ViewStyle => {
    return isRTL ? { paddingLeft: value } : { paddingRight: value };
  };

  /**
   * Transform icon name for RTL (e.g., chevron-forward -> chevron-back)
   */
  const transformIcon = (iconName: string): string => {
    if (!isRTL) return iconName;
    
    const rtlIconMap: Record<string, string> = {
      'chevron-forward': 'chevron-back',
      'chevron-back': 'chevron-forward',
      'arrow-forward': 'arrow-back',
      'arrow-back': 'arrow-forward',
      'caret-forward': 'caret-back',
      'caret-back': 'caret-forward',
    };
    
    return rtlIconMap[iconName] || iconName;
  };

  /**
   * Get absolute position for RTL
   */
  const absolutePosition = (position: 'left' | 'right', value: number): ViewStyle => {
    if (!isRTL) {
      return position === 'left' ? { left: value } : { right: value };
    }
    return position === 'left' ? { right: value } : { left: value };
  };

  return {
    isRTL,
    flexDirection,
    textAlign,
    marginStart,
    marginEnd,
    paddingStart,
    paddingEnd,
    transformIcon,
    absolutePosition,
  };
};

/**
 * Create RTL-aware styles
 */
export const createRTLStyles = <T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>,
  isRTL: boolean
): T => {
  if (!isRTL) return styles as T;

  const rtlStyles: any = {};

  for (const key in styles) {
    const style = styles[key] as any;
    rtlStyles[key] = { ...style };

    // Transform flex direction
    if (style.flexDirection === 'row') {
      rtlStyles[key].flexDirection = 'row-reverse';
    } else if (style.flexDirection === 'row-reverse') {
      rtlStyles[key].flexDirection = 'row';
    }

    // Transform text alignment
    if (style.textAlign === 'left') {
      rtlStyles[key].textAlign = 'right';
    } else if (style.textAlign === 'right') {
      rtlStyles[key].textAlign = 'left';
    }

    // Transform margins
    if (style.marginLeft !== undefined && style.marginRight === undefined) {
      rtlStyles[key].marginRight = style.marginLeft;
      delete rtlStyles[key].marginLeft;
    } else if (style.marginRight !== undefined && style.marginLeft === undefined) {
      rtlStyles[key].marginLeft = style.marginRight;
      delete rtlStyles[key].marginRight;
    }

    // Transform paddings
    if (style.paddingLeft !== undefined && style.paddingRight === undefined) {
      rtlStyles[key].paddingRight = style.paddingLeft;
      delete rtlStyles[key].paddingLeft;
    } else if (style.paddingRight !== undefined && style.paddingLeft === undefined) {
      rtlStyles[key].paddingLeft = style.paddingRight;
      delete rtlStyles[key].paddingRight;
    }

    // Transform absolute positions
    if (style.left !== undefined && style.right === undefined) {
      rtlStyles[key].right = style.left;
      delete rtlStyles[key].left;
    } else if (style.right !== undefined && style.left === undefined) {
      rtlStyles[key].left = style.right;
      delete rtlStyles[key].right;
    }
  }

  return rtlStyles as T;
};

/**
 * RTL-aware View component wrapper
 */
export const RTLView = {
  /**
   * Get row style that respects RTL
   */
  row: (additionalStyles?: ViewStyle): ViewStyle => ({
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    ...additionalStyles,
  }),

  /**
   * Get row-reverse style that respects RTL
   */
  rowReverse: (additionalStyles?: ViewStyle): ViewStyle => ({
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    ...additionalStyles,
  }),
};

export default useRTL;
