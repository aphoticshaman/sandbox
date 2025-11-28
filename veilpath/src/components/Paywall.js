/**
 * Paywall Component
 * Uses custom paywall UI (RevenueCat UI library removed due to compatibility issues)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';

// Note: RevenueCat UI library functions removed due to Android build issues
// Use CustomPaywall component below instead

/**
 * Custom Paywall Component (fallback if native UI not available)
 */
export function CustomPaywall({ onClose, onPurchaseSuccess }) {
  const {
    offerings,
    purchase,
    restore,
    isLoading,
    monthlyPackage,
    yearlyPackage,
    lifetimePackage
  } = useSubscription();

  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (package_) => {
    if (!package_) return;

    setPurchasing(true);
    try {
      const result = await purchase(package_);

      if (result.success) {
        Alert.alert(
          'Welcome to Pro!',
          'Your subscription is now active. Enjoy all premium features!',
          [{ text: 'OK', onPress: () => onPurchaseSuccess?.() }]
        );
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else if (result.error) {
        Alert.alert('Purchase Failed', result.error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const result = await restore();

      if (result.success && result.isPro) {
        Alert.alert(
          'Restored!',
          'Your subscription has been restored.',
          [{ text: 'OK', onPress: () => onPurchaseSuccess?.() }]
        );
      } else if (result.success && !result.restored) {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      } else if (result.error) {
        Alert.alert('Restore Failed', result.error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading || !offerings) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      <Text style={styles.title}>VeilPath Pro</Text>
      <Text style={styles.subtitle}>Unlock all premium features</Text>

      <View style={styles.features}>
        <Text style={styles.feature}>✓ Unlimited daily readings</Text>
        <Text style={styles.feature}>✓ AI Vera conversations</Text>
        <Text style={styles.feature}>✓ Advanced spread analysis</Text>
        <Text style={styles.feature}>✓ Reading history insights</Text>
        <Text style={styles.feature}>✓ Priority support</Text>
      </View>

      <View style={styles.packages}>
        {monthlyPackage && (
          <TouchableOpacity
            style={styles.packageButton}
            onPress={() => handlePurchase(monthlyPackage)}
            disabled={purchasing}
          >
            <Text style={styles.packageTitle}>Monthly</Text>
            <Text style={styles.packagePrice}>
              {monthlyPackage.product.priceString}/month
            </Text>
          </TouchableOpacity>
        )}

        {yearlyPackage && (
          <TouchableOpacity
            style={[styles.packageButton, styles.popularPackage]}
            onPress={() => handlePurchase(yearlyPackage)}
            disabled={purchasing}
          >
            <Text style={styles.popularBadge}>BEST VALUE</Text>
            <Text style={styles.packageTitle}>Yearly</Text>
            <Text style={styles.packagePrice}>
              {yearlyPackage.product.priceString}/year
            </Text>
            <Text style={styles.savings}>Save 40%</Text>
          </TouchableOpacity>
        )}

        {lifetimePackage && (
          <TouchableOpacity
            style={styles.packageButton}
            onPress={() => handlePurchase(lifetimePackage)}
            disabled={purchasing}
          >
            <Text style={styles.packageTitle}>Lifetime</Text>
            <Text style={styles.packagePrice}>
              {lifetimePackage.product.priceString}
            </Text>
            <Text style={styles.savings}>One-time purchase</Text>
          </TouchableOpacity>
        )}
      </View>

      {purchasing && (
        <ActivityIndicator style={styles.purchasingIndicator} color="#8B5CF6" />
      )}

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={purchasing}
      >
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Subscriptions automatically renew unless canceled at least 24 hours before
        the end of the current period.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1A',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 30
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 30
  },
  feature: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 12
  },
  packages: {
    alignSelf: 'stretch',
    marginBottom: 20
  },
  packageButton: {
    backgroundColor: '#1F1635',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  popularPackage: {
    borderColor: '#8B5CF6',
    borderWidth: 2
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#8B5CF6',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  packageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  packagePrice: {
    color: '#8B5CF6',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4
  },
  savings: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4
  },
  purchasingIndicator: {
    marginVertical: 10
  },
  restoreButton: {
    padding: 15
  },
  restoreText: {
    color: '#8B5CF6',
    fontSize: 14
  },
  disclaimer: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 10
  }
});

export default CustomPaywall;
