/**
 * ComponentComparisonScreen - Side-by-side comparison tool
 *
 * Visual testing tool to compare old vs new component implementations
 *
 * Usage:
 *   1. Add to App.js navigation
 *   2. Navigate to screen
 *   3. Select component to compare
 *   4. See old and new side-by-side
 *   5. Check FPS and visual parity
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
import { PerformanceMonitor } from '../src/utils/PerformanceMonitor';

// Component registry
// Add components here as they're migrated
const COMPONENTS = [
  {
    id: 'floating_particle',
    name: 'FloatingParticle',
    status: 'pending',
    oldComponent: null, // TODO: Import old version
    newComponent: null, // TODO: Import Skia version
  },
  {
    id: 'light_beams',
    name: 'LightBeams',
    status: 'pending',
    oldComponent: null,
    newComponent: null,
  },
  {
    id: 'interactive_background',
    name: 'InteractiveBackground',
    status: 'pending',
    oldComponent: null,
    newComponent: null,
  },
  {
    id: 'card_flip',
    name: 'TarotCardFlip',
    status: 'pending',
    oldComponent: null,
    newComponent: null,
  },
  {
    id: 'card_shuffle',
    name: 'CardShuffleAnimation',
    status: 'pending',
    oldComponent: null,
    newComponent: null,
  },
];

export default function ComponentComparisonScreen({ navigation }) {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [splitMode, setSplitMode] = useState(true); // true = side-by-side, false = toggle
  const [showNew, setShowNew] = useState(true);
  const [showPerformance, setShowPerformance] = useState(true);

  const component = selectedComponent
    ? COMPONENTS.find(c => c.id === selectedComponent)
    : null;

  const renderComponentList = () => (
    <ScrollView style={styles.listContainer}>
      <Text style={styles.sectionTitle}>Select Component to Compare</Text>

      {COMPONENTS.map(comp => {
        const status = comp.oldComponent && comp.newComponent ? '✅' : '⏸️';
        const isSelected = selectedComponent === comp.id;

        return (
          <TouchableOpacity
            key={comp.id}
            style={[styles.componentItem, isSelected && styles.componentItemSelected]}
            onPress={() => setSelectedComponent(comp.id)}
          >
            <Text style={styles.componentName}>
              {status} {comp.name}
            </Text>
            <Text style={styles.componentStatus}>
              {comp.oldComponent && comp.newComponent ? 'Ready' : 'Not migrated yet'}
            </Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📖 How to Use</Text>
        <Text style={styles.instructionsText}>
          1. Migrate a component to Skia{'\n'}
          2. Import old and new versions here{'\n'}
          3. Select component from list{'\n'}
          4. Compare visually and check FPS{'\n'}
          5. Toggle split mode for A/B testing
        </Text>
      </View>
    </ScrollView>
  );

  const renderComparison = () => {
    if (!component) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            ← Select a component to compare
          </Text>
        </View>
      );
    }

    if (!component.oldComponent || !component.newComponent) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Component not yet migrated
          </Text>
          <Text style={styles.placeholderSubtext}>
            Import old and new versions in ComponentComparisonScreen.js
          </Text>
        </View>
      );
    }

    const OldComponent = component.oldComponent;
    const NewComponent = component.newComponent;

    if (splitMode) {
      // Side-by-side split view
      return (
        <View style={styles.splitContainer}>
          <View style={styles.splitPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>OLD (Animated)</Text>
              <View style={[styles.badge, styles.badgeOld]}>
                <Text style={styles.badgeText}>Current</Text>
              </View>
            </View>

            <PerformanceMonitor
              name={`${component.name}-Old`}
              showOverlay={showPerformance}
            >
              <View style={styles.componentContainer}>
                <OldComponent />
              </View>
            </PerformanceMonitor>
          </View>

          <View style={styles.divider} />

          <View style={styles.splitPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>NEW (Skia)</Text>
              <View style={[styles.badge, styles.badgeNew]}>
                <Text style={styles.badgeText}>Migration</Text>
              </View>
            </View>

            <PerformanceMonitor
              name={`${component.name}-New`}
              showOverlay={showPerformance}
            >
              <View style={styles.componentContainer}>
                <NewComponent />
              </View>
            </PerformanceMonitor>
          </View>
        </View>
      );
    } else {
      // Toggle mode (A/B testing)
      const Component = showNew ? NewComponent : OldComponent;
      const label = showNew ? 'NEW (Skia)' : 'OLD (Animated)';

      return (
        <View style={styles.toggleContainer}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{label}</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowNew(!showNew)}
            >
              <Text style={styles.toggleButtonText}>
                Switch to {showNew ? 'OLD' : 'NEW'}
              </Text>
            </TouchableOpacity>
          </View>

          <PerformanceMonitor
            name={`${component.name}-${showNew ? 'New' : 'Old'}`}
            showOverlay={showPerformance}
          >
            <View style={styles.componentContainer}>
              <Component />
            </View>
          </PerformanceMonitor>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Component Comparison</Text>

        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Split View</Text>
            <Switch
              value={splitMode}
              onValueChange={setSplitMode}
              trackColor={{ false: '#767577', true: '#8a2be2' }}
              thumbColor={splitMode ? '#00ffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>FPS Overlay</Text>
            <Switch
              value={showPerformance}
              onValueChange={setShowPerformance}
              trackColor={{ false: '#767577', true: '#8a2be2' }}
              thumbColor={showPerformance ? '#00ffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Component List Sidebar */}
        <View style={styles.sidebar}>
          {renderComponentList()}
        </View>

        {/* Comparison View */}
        <View style={styles.mainPanel}>
          {renderComparison()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#8a2be2',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#00ffff',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#8a2be2',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  componentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.3)',
  },
  componentItemSelected: {
    backgroundColor: 'rgba(138, 43, 226, 0.4)',
  },
  componentName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  componentStatus: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.7,
  },
  instructions: {
    padding: 15,
    margin: 15,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  instructionsTitle: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
  },
  mainPanel: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    color: '#00ffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitPanel: {
    flex: 1,
  },
  divider: {
    width: 2,
    backgroundColor: '#8a2be2',
  },
  panelHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#8a2be2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOld: {
    backgroundColor: '#ff6b6b',
  },
  badgeNew: {
    backgroundColor: '#51cf66',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  componentContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  toggleContainer: {
    flex: 1,
  },
  toggleButton: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
