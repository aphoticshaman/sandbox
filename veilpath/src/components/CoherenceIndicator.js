/**
 * CoherenceIndicator - Visual Coherence State Display
 *
 * A subtle, non-intrusive indicator showing current coherence state.
 * Integrates with the momentum-gated coherence engine.
 *
 * Modes:
 * - 'minimal': Just a colored dot
 * - 'compact': Dot + state name
 * - 'detailed': Full R value, momentum, persona
 *
 * The indicator pulses gently with φ-timing to maintain presence
 * without causing distraction.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { THEME } from '../theme/theme';
import { useCoherence } from '../contexts/CoherenceContext';
import { PHI } from '../core/PhiTiming';
import { COSMIC } from './VeilPathDesign';

// ═══════════════════════════════════════════════════════════
// STATE COLORS (Matching coherence states)
// ═══════════════════════════════════════════════════════════

const STATE_COLORS = {
  crystalline: COSMIC.etherealCyan,  // Cyan - crystal clarity
  fluid: COSMIC.deepAmethyst,        // Violet - flowing energy
  turbulent: COSMIC.candleFlame,     // Orange - active change
  collapse: '#FF4444',               // Red - needs attention (keep distinct)
};

const STATE_LABELS = {
  crystalline: 'Crystalline',
  fluid: 'Fluid',
  turbulent: 'Turbulent',
  collapse: 'Collapse',
};

const STATE_ICONS = {
  crystalline: '◆',
  fluid: '◇',
  turbulent: '◈',
  collapse: '◉',
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function CoherenceIndicator({ mode = 'compact', style }) {
  const { R, state, momentum, persona, noiseLevel } = useCoherence();

  // Pulse animation (φ-timed breathing)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation with golden ratio timing
    const breathDuration = 1618; // φ × 1000ms

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: breathDuration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: breathDuration / PHI,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const color = STATE_COLORS[state] || STATE_COLORS.fluid;
  const icon = STATE_ICONS[state] || '◇';

  // ─────────────────────────────────────────────────────
  // MINIMAL MODE - Just a glowing dot
  // ─────────────────────────────────────────────────────
  if (mode === 'minimal') {
    return (
      <Animated.View
        style={[
          styles.minimalDot,
          { backgroundColor: color, transform: [{ scale: pulseAnim }] },
          style,
        ]}
      />
    );
  }

  // ─────────────────────────────────────────────────────
  // COMPACT MODE - Dot + label
  // ─────────────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <Animated.View
          style={[
            styles.compactDot,
            { backgroundColor: color, transform: [{ scale: pulseAnim }] },
          ]}
        />
        <Text style={[styles.compactLabel, { color }]}>
          {icon} {STATE_LABELS[state]}
        </Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────
  // DETAILED MODE - Full metrics
  // ─────────────────────────────────────────────────────
  const rPercent = Math.round(R * 100);
  const momentumSign = momentum >= 0 ? '+' : '';
  const momentumPercent = Math.round(momentum * 100);

  return (
    <View style={[styles.detailedContainer, { borderColor: color }, style]}>
      {/* Header with state */}
      <View style={styles.detailedHeader}>
        <Animated.View
          style={[
            styles.detailedDot,
            { backgroundColor: color, transform: [{ scale: pulseAnim }] },
          ]}
        />
        <Text style={[styles.detailedState, { color }]}>
          {icon} {STATE_LABELS[state]}
        </Text>
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{rPercent}%</Text>
          <Text style={styles.metricLabel}>R</Text>
        </View>
        <View style={styles.metric}>
          <Text
            style={[
              styles.metricValue,
              { color: momentum >= 0 ? '#4CAF50' : '#FF5722' },
            ]}
          >
            {momentumSign}{momentumPercent}%
          </Text>
          <Text style={styles.metricLabel}>dR/dt</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{persona}</Text>
          <Text style={styles.metricLabel}>Persona</Text>
        </View>
      </View>

      {/* R bar */}
      <View style={styles.rBarContainer}>
        <View style={[styles.rBarFill, { width: `${rPercent}%`, backgroundColor: color }]} />
        {/* Threshold markers */}
        <View style={[styles.thresholdMarker, { left: '50%' }]} />
        <View style={[styles.thresholdMarker, { left: '80%' }]} />
        <View style={[styles.thresholdMarker, { left: '95%' }]} />
      </View>

      {/* Noise level */}
      <Text style={styles.noiseLabel}>
        KGANIS ξ: {(noiseLevel * 100).toFixed(0)}%
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Minimal mode
  minimalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Compact mode
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Detailed mode
  detailedContainer: {
    padding: 12,
    backgroundColor: 'rgba(26, 10, 46, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  detailedState: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  rBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  noiseLabel: {
    fontSize: 10,
    color: THEME.colors.neutral[500],
    textAlign: 'center',
  },
});

export default CoherenceIndicator;
