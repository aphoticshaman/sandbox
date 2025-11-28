/**
 * Error Boundary - VeilPath WitchTok x Victorian Gothic
 * Graceful error handling with cosmic aesthetic
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

// Import VeilPath Design System
import { COSMIC } from './VeilPathDesign';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>

            <Text style={styles.errorTitle}>
              Something Went Wrong
            </Text>

            <Text style={styles.errorText}>
              The veil has been disrupted. Please try again.
            </Text>

            <Text style={styles.errorDetails}>
              {this.state.error?.toString()}
            </Text>

            <TouchableOpacity onPress={this.handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COSMIC.midnightVoid,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderWidth: 2,
    borderColor: COSMIC.crystalPink,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.crystalPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  errorText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
  },
  resetButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
});
