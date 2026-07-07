/**
 * ScreenErrorBoundary - Per-screen crash protection
 *
 * Catches render errors inside a screen and shows a friendly fallback with
 * "Try again" and "Go back" actions instead of white-screening the app.
 *
 * Usage (preferred, at the bottom of a screen file):
 *   export default withScreenErrorBoundary(MyScreen, 'MyScreen');
 *
 * Or inline:
 *   <ScreenErrorBoundary screenName="MyScreen">
 *     <MyScreen />
 *   </ScreenErrorBoundary>
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface BoundaryProps {
  children: React.ReactNode;
  screenName?: string;
  /** Injected by the wrapper so the class component can navigate */
  onGoBack?: () => void;
  goBackLabel?: string;
  titleLabel?: string;
  messageLabel?: string;
  tryAgainLabel?: string;
}

interface BoundaryState {
  hasError: boolean;
}

class ScreenErrorBoundaryInner extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ScreenErrorBoundary] Crash in ${this.props.screenName || 'screen'}:`,
      error,
      info?.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={56} color="#9CA3AF" />
            <Text style={styles.title}>{this.props.titleLabel || 'Something went wrong'}</Text>
            <Text style={styles.message}>
              {this.props.messageLabel ||
                'This screen ran into a problem. You can try again or go back.'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={this.handleReset}>
              <Text style={styles.primaryButtonText}>
                {this.props.tryAgainLabel || 'Try again'}
              </Text>
            </TouchableOpacity>
            {this.props.onGoBack && (
              <TouchableOpacity style={styles.secondaryButton} onPress={this.props.onGoBack}>
                <Text style={styles.secondaryButtonText}>
                  {this.props.goBackLabel || 'Go back'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function ScreenErrorBoundary({
  children,
  screenName,
}: {
  children: React.ReactNode;
  screenName?: string;
}) {
  // Navigation may be unavailable if the boundary is mounted outside a
  // navigator; fail soft in that case (no Go back button).
  let navigation: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigation = useNavigation();
  } catch {
    navigation = null;
  }

  let t: ((key: string, options?: any) => string) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const translation = useTranslation();
    t = translation.t;
  } catch {
    t = null;
  }

  const handleGoBack =
    navigation && navigation.canGoBack && navigation.canGoBack()
      ? () => navigation.goBack()
      : undefined;

  return (
    <ScreenErrorBoundaryInner
      screenName={screenName}
      onGoBack={handleGoBack}
      titleLabel={t ? t('errorBoundary.title', { defaultValue: 'Something went wrong' }) : undefined}
      messageLabel={
        t
          ? t('errorBoundary.message', {
              defaultValue: 'This screen ran into a problem. You can try again or go back.',
            })
          : undefined
      }
      tryAgainLabel={t ? t('errorBoundary.tryAgain', { defaultValue: 'Try again' }) : undefined}
      goBackLabel={t ? t('errorBoundary.goBack', { defaultValue: 'Go back' }) : undefined}
    >
      {children}
    </ScreenErrorBoundaryInner>
  );
}

/**
 * HOC for wrapping screen exports:
 *   export default withScreenErrorBoundary(HomeScreen, 'HomeScreen');
 */
export function withScreenErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  screenName?: string
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ScreenErrorBoundary screenName={screenName}>
      <Component {...props} />
    </ScreenErrorBoundary>
  );
  Wrapped.displayName = `withScreenErrorBoundary(${screenName || Component.displayName || Component.name || 'Screen'})`;
  return Wrapped;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#8A05BE',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
