/**
 * CURRENCY DISPLAY COMPONENT
 * Shows user's Veil Shards and Moonlight balances
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import CurrencyManager, { CURRENCY_TYPE } from '../utils/CurrencyManager';

export default function CurrencyDisplay({ onPressVeilShards, style }) {
  const [veilShards, setVeilShards] = useState(0);
  const [moonlight, setMoonlight] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Load initial balances
    updateBalances();

    // Subscribe to currency changes
    const unsubscribe = CurrencyManager.subscribe((event) => {
      updateBalances();

      // Pulse animation on currency change
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return unsubscribe;
  }, []);

  const updateBalances = () => {
    const balances = CurrencyManager.getBalance();
    setVeilShards(balances.veilShards);
    setMoonlight(balances.moonlight);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Veil Shards (premium currency) */}
      <TouchableOpacity
        style={styles.currencyBox}
        onPress={onPressVeilShards}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.currencyRow}>
            <Text style={styles.icon}>💎</Text>
            <Text style={styles.amount}>{veilShards.toLocaleString()}</Text>
          </View>
          <Text style={styles.label}>Veil Shards</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Moonlight (soft currency) */}
      <View style={styles.currencyBox}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.currencyRow}>
            <Text style={styles.icon}>🌙</Text>
            <Text style={styles.amount}>{moonlight.toLocaleString()}</Text>
          </View>
          <Text style={styles.label}>Moonlight</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  currencyBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 140,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d4af37',
    fontFamily: 'monospace',
  },
  label: {
    fontSize: 11,
    color: '#8a2be2',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
});
