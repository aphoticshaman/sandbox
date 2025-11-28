/**
 * AdminDashboardScreen.js - VeilPath Coherence Control Dashboard
 *
 * Real-time visualization of the momentum-gated coherence engine.
 * Displays:
 *   - Kuramoto R (coherence value)
 *   - Momentum (dR/dt)
 *   - Dynamic thresholds (τ_t = τ_base - κ × dR/dt)
 *   - Current AI persona and parameters
 *   - Coherence history chart
 *
 * This dashboard validates the patent-locked κ=1.0 implementation
 * and provides observability into the adaptive UX system.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Core engine imports
import coherenceEngine, {
  COHERENCE_STATES,
  KAPPA,
  THRESHOLD_BASE,
} from '../core/CoherenceEngine';
import adaptiveAI from '../core/AdaptiveAI';
import { PHI, TIMING } from '../core/PhiTiming';
import { COSMIC } from '../components/VeilPathDesign';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 200;
const MAX_HISTORY_POINTS = 100;

// State colors using COSMIC design system
const STATE_COLORS = {
  crystalline: COSMIC.candleFlame,
  fluid: COSMIC.etherealCyan,
  turbulent: COSMIC.crystalPink,
  collapse: COSMIC.deepAmethyst,
};

export default function AdminDashboardScreen() {
  const [snapshot, setSnapshot] = useState(coherenceEngine.getSnapshot());
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [rrbrScore, setRrbrScore] = useState(0);
  const chartCanvasRef = useRef(null);

  // Start/stop simulation toggle
  const toggleSimulation = useCallback(() => {
    if (isRunning) {
      coherenceEngine.stop();
    } else {
      coherenceEngine.start();
    }
    setIsRunning(!isRunning);
  }, [isRunning]);

  // Update snapshot on coherence engine sample
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const newSnapshot = coherenceEngine.getSnapshot();
      setSnapshot(newSnapshot);

      // Update history for chart
      setHistory(prev => {
        const newHistory = [...prev, {
          R: newSnapshot.R,
          momentum: newSnapshot.momentum,
          tauFluid: newSnapshot.dynamicThresholds?.fluid || THRESHOLD_BASE.FLUID,
          timestamp: Date.now(),
        }];
        // Keep only last N points
        if (newHistory.length > MAX_HISTORY_POINTS) {
          return newHistory.slice(-MAX_HISTORY_POINTS);
        }
        return newHistory;
      });

      // Simulate RRBR score
      const delta = (Math.random() - 0.4) * newSnapshot.R;
      setRrbrScore(prev => {
        if (delta > 0) return prev + delta * 1.1;
        return prev + delta * 0.5;
      });
    }, TIMING.COHERENCE_SAMPLE_INTERVAL / 2);

    return () => clearInterval(updateInterval);
  }, []);

  // Get persona from adaptive AI
  const persona = adaptiveAI.getCurrentProfile();

  // Format momentum with sign
  const formatMomentum = (m) => {
    const sign = m >= 0 ? '+' : '';
    return `${sign}${m.toFixed(4)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0d1117', '#161b22', '#0d1117']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            VeilPath Coherence Engine
          </Text>
          <Text style={styles.subtitle}>κ = {KAPPA} (Patent-Locked)</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: STATE_COLORS[snapshot.state?.id] || STATE_COLORS.fluid }
          ]}>
            <Text style={styles.statusText}>
              {snapshot.state?.name || 'FLUID'}
            </Text>
          </View>
        </View>

        {/* Main Grid */}
        <View style={styles.grid}>
          {/* Persona Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adaptive AI Persona</Text>
            <Text style={styles.personaName}>{persona.profile?.name || 'RESEARCH COLLABORATOR'}</Text>
            <Text style={styles.personaPrompt}>
              "{snapshot.state?.aiHint || 'Adapting to user state...'}"
            </Text>

            <View style={styles.divider} />

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>LLM Temperature:</Text>
              <Text style={styles.metricValueYellow}>
                {(snapshot.state?.llmTemp || 0.7).toFixed(2)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Noise Scaling (ξ):</Text>
              <Text style={styles.metricValueRed}>
                {(snapshot.state?.noiseScale || 0.15).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Real-Time Dynamics Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Real-Time Dynamics</Text>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Kuramoto Coherence (R):</Text>
              <Text style={styles.bigValueLime}>
                {snapshot.R?.toFixed(4) || '0.5000'}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Momentum (ΔR/Δt):</Text>
              <Text style={styles.metricValueCyan}>
                {formatMomentum(snapshot.momentum || 0)}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Dynamic Phase Margin (τ_t):</Text>
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdText}>
                FLUID τ: {snapshot.dynamicThresholds?.fluid?.toFixed(3) || '0.800'}
              </Text>
              <Text style={styles.thresholdText}>
                TURBULENT τ: {snapshot.dynamicThresholds?.turbulent?.toFixed(3) || '0.500'}
              </Text>
            </View>
          </View>

          {/* RRBR Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>System Objective Status</Text>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>RRBR Score:</Text>
              <Text style={styles.bigValuePurple}>
                {rrbrScore.toFixed(2)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Engine Running:</Text>
              <Text style={[
                styles.metricValue,
                { color: snapshot.isRunning ? '#34D399' : '#FB7185' }
              ]}>
                {snapshot.isRunning ? 'Yes' : 'No'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isRunning ? '#DC2626' : '#2563EB' }
              ]}
              onPress={toggleSimulation}
            >
              <Text style={styles.buttonText}>
                {isRunning ? 'PAUSE SIMULATION' : 'START SIMULATION'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Coherence Trajectory & Dynamic Boundaries</Text>
          <CoherenceChart history={history} />
        </View>

        {/* Signals Debug */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavioral Signals (Debug)</Text>
          <View style={styles.signalGrid}>
            {Object.entries(snapshot.signals || {}).map(([key, value]) => (
              <View key={key} style={styles.signalItem}>
                <Text style={styles.signalLabel}>{key}:</Text>
                <View style={styles.signalBar}>
                  <View
                    style={[
                      styles.signalFill,
                      { width: `${(value || 0) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.signalValue}>{(value || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            κ = 1.0 | Momentum-Gated Coherence | Patent-Protected IP
          </Text>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

/**
 * Simple coherence chart component
 * Renders R history and dynamic threshold lines
 */
function CoherenceChart({ history }) {
  if (history.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>
          Collecting coherence data...
        </Text>
      </View>
    );
  }

  // Calculate chart points
  const points = history.map((h, i) => ({
    x: (i / (history.length - 1)) * CHART_WIDTH,
    yR: (1 - h.R) * CHART_HEIGHT,
    yTau: (1 - h.tauFluid) * CHART_HEIGHT,
  }));

  // Create SVG-like path strings for web
  const rPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yR}`
  ).join(' ');

  const tauPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yTau}`
  ).join(' ');

  // For React Native, we'll render a simple visualization
  return (
    <View style={styles.chart}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={styles.axisLabel}>1.0</Text>
        <Text style={styles.axisLabel}>0.5</Text>
        <Text style={styles.axisLabel}>0.0</Text>
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: 0 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT / 2 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT }]} />

        {/* Threshold line (dashed effect with dots) */}
        <View style={styles.thresholdLine}>
          {points.filter((_, i) => i % 4 === 0).map((p, i) => (
            <View
              key={`tau-${i}`}
              style={[
                styles.thresholdDot,
                { left: p.x, top: p.yTau }
              ]}
            />
          ))}
        </View>

        {/* R line (solid dots) */}
        {points.map((p, i) => (
          <View
            key={`r-${i}`}
            style={[
              styles.rDot,
              { left: p.x, top: p.yR }
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COSMIC.etherealCyan }]} />
          <Text style={styles.legendText}>Kuramoto R</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COSMIC.candleFlame }]} />
          <Text style={styles.legendText}>Fluid τ (Dynamic)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  gradient: {
    flex: 1,
    padding: 16,
    minHeight: '100%',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#84CC16',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363d',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363d',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  personaName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 8,
  },
  personaPrompt: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#30363d',
    marginVertical: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#FFFFFF',
  },
  metricValueYellow: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#FBBF24',
  },
  metricValueRed: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#F87171',
  },
  metricValueCyan: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#22D3EE',
  },
  bigValueLime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#84CC16',
  },
  bigValuePurple: {
    fontSize: 32,
    fontWeight: '800',
    color: '#A855F7',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thresholdText: {
    fontSize: 12,
    color: '#6B7280',
  },
  button: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Chart styles
  chart: {
    height: CHART_HEIGHT + 60,
    flexDirection: 'row',
  },
  yAxis: {
    width: 30,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#30363d',
  },
  rDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#34D399',
    marginLeft: -1.5,
    marginTop: -1.5,
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thresholdDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COSMIC.candleFlame,
    opacity: 0.7,
    marginLeft: -2,
    marginTop: -2,
  },
  legend: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1f26',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
  },
  // Signal debug styles
  signalGrid: {
    gap: 12,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 100,
  },
  signalBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#30363d',
    borderRadius: 4,
    overflow: 'hidden',
  },
  signalFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  signalValue: {
    fontSize: 12,
    color: '#FFFFFF',
    width: 40,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    marginTop: 24,
    marginBottom: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#4B5563',
  },
});
