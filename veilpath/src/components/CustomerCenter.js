/**
 * Customer Center Component
 * For managing subscriptions, viewing purchase history, etc.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getManagementURL } from '../services/revenueCatService';

export function CustomerCenter({ onClose }) {
  const {
    isPro,
    customerInfo,
    activeSubscription,
    hasLifetime,
    restore,
    isLoading
  } = useSubscription();

  const handleManageSubscription = async () => {
    try {
      const url = await getManagementURL();
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription, go to your device Settings > Subscriptions.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open subscription management.');
    }
  };

  const handleRestore = async () => {
    const result = await restore();
    if (result.success && result.isPro) {
      Alert.alert('Success', 'Your purchases have been restored!');
    } else if (result.success && !result.restored) {
      Alert.alert('No Purchases', 'No previous purchases were found.');
    } else {
      Alert.alert('Error', result.error || 'Failed to restore purchases.');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@veilpath.app?subject=VeilPath%20Pro%20Support');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Account</Text>

      {/* Subscription Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Plan</Text>
          <Text style={styles.statusValue}>
            {hasLifetime ? 'Lifetime Pro' : isPro ? 'Pro' : 'Free'}
          </Text>
        </View>

        {isPro && !hasLifetime && activeSubscription && (
          <>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Product</Text>
              <Text style={styles.statusValue}>{activeSubscription}</Text>
            </View>

            {customerInfo?.entitlements?.active?.pro?.expirationDate && (
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Renews On</Text>
                <Text style={styles.statusValue}>
                  {formatDate(customerInfo.entitlements.active.pro.expirationDate)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {isPro && !hasLifetime && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageSubscription}
          >
            <Text style={styles.actionText}>Manage Subscription</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <Text style={styles.actionText}>Restore Purchases</Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleContactSupport}
        >
          <Text style={styles.actionText}>Contact Support</Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Purchase History */}
      {customerInfo?.allPurchasedProductIdentifiers?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          {customerInfo.allPurchasedProductIdentifiers.map((productId, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyText}>{productId}</Text>
            </View>
          ))}
        </View>
      )}

      {/* User ID for support */}
      {customerInfo?.originalAppUserId && (
        <View style={styles.userIdSection}>
          <Text style={styles.userIdLabel}>User ID (for support)</Text>
          <Text style={styles.userId}>{customerInfo.originalAppUserId}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1A',
    padding: 20
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  closeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 60,
    marginBottom: 30
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F1635',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 14
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F1635',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  actionText: {
    color: '#fff',
    fontSize: 16
  },
  actionArrow: {
    color: '#8B5CF6',
    fontSize: 18
  },
  historyItem: {
    backgroundColor: '#1F1635',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6
  },
  historyText: {
    color: '#D1D5DB',
    fontSize: 14
  },
  userIdSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1F1635',
    borderRadius: 8
  },
  userIdLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4
  },
  userId: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'monospace'
  }
});

export default CustomerCenter;
