import React, { useCallback, useRef } from 'react';
import { StatusBar, StatusBarProps, StatusBarStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/** A retained navigation screen must not override the visible screen's status bar. */
export default function FocusedStatusBar(props: StatusBarProps) {
  const focused = useIsFocused();
  return focused ? <StatusBar {...props} /> : null;
}

/** iOS may restore its presenting controller's style after dismissing a Modal. */
export function useRestoreFocusedStatusBar(barStyle: StatusBarStyle) {
  const focused = useIsFocused();
  const current = useRef({ focused, barStyle });
  current.current = { focused, barStyle };
  return useCallback(() => {
    if (current.current.focused) StatusBar.setBarStyle(current.current.barStyle, false);
  }, []);
}
