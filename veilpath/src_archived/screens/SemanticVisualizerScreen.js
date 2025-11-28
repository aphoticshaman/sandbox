/**
 * REVOLUTIONARY 3D SEMANTIC VISUALIZER
 * "Life playing Fortnite on your phone" - Full 3D FPS-style navigation
 *
 * TRUE 3D SPACE - No gravity, no ground, full 360° movement
 * Touch controls like mobile FPS:
 * - Right drag: Rotate view (look around)
 * - Left drag: Pan camera
 * - Pinch: Zoom
 * - Tap: Select entity
 * - Double tap: Fly to entity
 *
 * Map everything: cards, emotions, people, objects, concepts, fears, hopes, joys
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeonText, LPMUDText, ScanLines } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { CARD_EMBEDDINGS } from '../utils/geometricSemanticSpace';
import {
  loadEntities,
  addEntity,
  removeEntity,
  visitEntity,
  findClusters,
  findNearbyEntities,
  ENTITY_CATEGORIES,
} from '../utils/semanticEntityManager';
import { isCloudAvailable } from '../services/cloudAPIService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';
const READINGS_KEY = '@lunatiq_saved_readings';

// 3D View constants
const VIEW_WIDTH = SCREEN_WIDTH;
const VIEW_HEIGHT = Math.min(SCREEN_HEIGHT * 0.6, 500);
const FOCAL_LENGTH = 400; // Perspective strength

// MBTI positions in semantic space
const MBTI_POSITIONS = {
  'INTJ': [0.3, 0.7, 0.6],   'INTP': [0.4, 0.4, 0.3],
  'ENTJ': [0.7, 0.6, 0.7],   'ENTP': [0.6, 0.3, 0.5],
  'INFJ': [-0.3, 0.8, 0.4],  'INFP': [-0.4, 0.5, 0.2],
  'ENFJ': [-0.2, 0.7, 0.5],  'ENFP': [0.1, 0.4, 0.6],
  'ISTJ': [-0.5, 0.3, -0.4], 'ISFJ': [-0.6, 0.4, -0.3],
  'ESTJ': [0.5, 0.4, -0.2],  'ESFJ': [-0.3, 0.5, -0.1],
  'ISTP': [0.4, 0.1, 0.0],   'ISFP': [-0.5, 0.3, 0.1],
  'ESTP': [0.7, 0.0, 0.2],   'ESFP': [0.3, 0.2, 0.3],
};

export default function SemanticVisualizerScreen({ navigation }) {
  const [activeProfile, setActiveProfile] = useState(null);
  const [entities, setEntities] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 3D Camera state
  const [camera, setCamera] = useState({
    x: 0, y: 0, z: -3, // Position
    rotX: 0, rotY: 0, rotZ: 0, // Rotation (Euler angles)
    focalLength: 400, // ADS zoom (400 = normal, 800 = 2x scope, 1600 = 4x scope)
  });

  // Touch gesture state
  const lastTap = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Add entity UI
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityText, setNewEntityText] = useState('');
  const [newEntityCategory, setNewEntityCategory] = useState('concept');

  // Semantic filters (which conceptual layers to show)
  const [activeFilters, setActiveFilters] = useState(new Set(['all']));

  // Filter presets
  const SEMANTIC_FILTERS = {
    all: { name: 'All', color: NEON_COLORS.hiWhite, desc: 'Everything' },
    romance: { name: 'Romance', color: NEON_COLORS.hiMagenta, desc: 'Love, relationships, connections' },
    finance: { name: 'Finance', color: '#FFD700', desc: 'Money, resources, material' },
    career: { name: 'Career', color: NEON_COLORS.hiCyan, desc: 'Work, ambition, achievement' },
    shadow: { name: 'Shadow', color: NEON_COLORS.dimRed, desc: 'Fears, denials, hidden truths' },
    light: { name: 'Light', color: NEON_COLORS.hiGreen, desc: 'Consciousness, integration, virtue' },
    future: { name: 'Future', color: NEON_COLORS.hiCyan, desc: 'Hopes, visions, potential' },
    past: { name: 'Past', color: '#FF6600', desc: 'Memories, regrets, history' },
  };

  // Layer toggles
  const [layers, setLayers] = useState({
    userPosition: true,
    userEntities: true,
    recentCards: true,
    allCards: false,
    clusters: true,
    axes: true,
    crosshair: true,
  });

  // Pan responder for FPS-style controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        touchStartPos.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      },

      onPanResponderMove: (evt, gestureState) => {
        const { pageX } = evt.nativeEvent;
        const isRightSide = pageX > SCREEN_WIDTH / 2;

        if (isRightSide) {
          // Right side: Rotate view (FPS look around)
          setCamera(prev => ({
            ...prev,
            rotY: prev.rotY + gestureState.dx * 0.003,
            rotX: Math.max(-Math.PI/2, Math.min(Math.PI/2, prev.rotX - gestureState.dy * 0.003))
          }));
        } else {
          // Left side: Pan camera
          const panSpeed = 0.001 / camera.zoom;
          setCamera(prev => ({
            ...prev,
            x: prev.x - gestureState.dx * panSpeed,
            y: prev.y + gestureState.dy * panSpeed
          }));
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        // Check for tap (minimal movement)
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          handleTap(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        }
      },
    })
  ).current;

  useEffect(() => {
    initializeVisualizer();
  }, []);

  async function initializeVisualizer() {
    setIsLoading(true);

    try {
      // Check premium
      const availability = await isCloudAvailable();
      setIsPremiumActive(availability.available);

      // Load profile
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
      if (profilesData && activeId) {
        const profiles = JSON.parse(profilesData);
        const profile = profiles.find(p => p.id === activeId);
        setActiveProfile(profile);
      }

      // Load readings
      const readingsData = await AsyncStorage.getItem(READINGS_KEY);
      if (readingsData) {
        setReadings(JSON.parse(readingsData));
      }

      // Load entities
      const loadedEntities = await loadEntities();
      setEntities(loadedEntities);

      console.log(`[SemanticSpace3D] Loaded ${loadedEntities.length} entities`);

    } catch (error) {
      console.error('[SemanticSpace3D] Init error:', error);
    }

    setIsLoading(false);
  }

  function handleTap(x, y) {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap: Fly to selected entity
      if (selectedEntity) {
        flyToEntity(selectedEntity);
      }
    } else {
      // Single tap: Select entity at tap position
      const entity = findEntityAt(x, y);
      if (entity) {
        handleEntityPress(entity);
      }
    }

    lastTap.current = now;
  }

  function findEntityAt(screenX, screenY) {
    // Convert screen coords to viewport coords
    const viewportX = screenX;
    const viewportY = screenY - (Platform.OS === 'ios' ? 100 : 80); // Account for header

    if (viewportY < 0 || viewportY > VIEW_HEIGHT) return null;

    const visibleEntities = getVisibleEntities();

    // Find closest entity to tap position
    let closest = null;
    let minDist = 30; // Max tap distance in pixels

    visibleEntities.forEach(entity => {
      const screen = project3DToScreen(entity.position, camera);
      if (!screen) return;

      const dx = screen.x - viewportX;
      const dy = screen.y - viewportY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closest = entity;
      }
    });

    return closest;
  }

  function flyToEntity(entity) {
    // Smooth camera movement to entity
    const targetZ = -2; // Distance from entity
    setCamera(prev => ({
      ...prev,
      x: entity.position[0],
      y: entity.position[1],
      z: entity.position[2] + targetZ,
    }));
  }

  async function handleAddEntity() {
    if (!newEntityText.trim()) {
      Alert.alert('Error', 'Enter entity name');
      return;
    }

    if (!isPremiumActive) {
      Alert.alert('Premium Required', 'Semantic mapping requires Premium');
      return;
    }

    setIsLoading(true);

    try {
      const entity = await addEntity(
        newEntityText.trim(),
        newEntityCategory,
        {
          userProfile: activeProfile,
          recentReadings: readings.slice(0, 5).map(r => r.intention).filter(Boolean)
        }
      );

      setEntities([...entities, entity]);
      setNewEntityText('');
      setShowAddEntity(false);

      Alert.alert(
        `${ENTITY_CATEGORIES[entity.category]?.icon || '🔮'} Added!`,
        `"${entity.text}" mapped to:\n\n${entity.reasoning}\n\nPosition: [${entity.position.map(v => v.toFixed(2)).join(', ')}]`
      );

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to map entity');
    }

    setIsLoading(false);
  }

  async function handleEntityPress(entity) {
    await visitEntity(entity.id);
    setSelectedEntity(entity);

    const nearby = findNearbyEntities(entity.position, entities, 0.4);
    const clusters = findClusters([...entities, ...getRecentCards()], 0.35);
    const inCluster = clusters.find(c => c.entities.some(e => e.id === entity.id));

    let message = `${ENTITY_CATEGORIES[entity.category]?.icon || '🔮'} ${ENTITY_CATEGORIES[entity.category]?.name || 'Entity'}\n\n`;
    message += `Position:\n`;
    message += `X: ${entity.position[0].toFixed(2)} ${getAxisLabel('X', entity.position[0])}\n`;
    message += `Y: ${entity.position[1].toFixed(2)} ${getAxisLabel('Y', entity.position[1])}\n`;
    message += `Z: ${entity.position[2].toFixed(2)} ${getAxisLabel('Z', entity.position[2])}\n\n`;

    if (entity.reasoning) {
      message += `${entity.reasoning}\n\n`;
    }

    if (inCluster && inCluster.size > 1) {
      message += `Part of ${inCluster.size}-entity cluster\n\n`;
    }

    if (nearby.length > 1) {
      message += `Nearby:\n`;
      nearby.slice(1, 4).forEach(({ entity: e, distance }) => {
        message += `  ${ENTITY_CATEGORIES[e.category]?.icon || '•'} ${e.text} (${distance.toFixed(2)})\n`;
      });
    }

    Alert.alert(entity.text, message, [
      { text: 'Close' },
      { text: 'Fly To', onPress: () => flyToEntity(entity) },
      { text: 'Remove', style: 'destructive', onPress: () => handleRemove(entity.id) }
    ]);
  }

  async function handleRemove(entityId) {
    const success = await removeEntity(entityId);
    if (success) {
      setEntities(entities.filter(e => e.id !== entityId));
      setSelectedEntity(null);
    }
  }

  function getAxisLabel(axis, value) {
    const abs = Math.abs(value);
    if (axis === 'X') {
      if (value > 0.5) return '(Fire/Air)';
      if (value < -0.5) return '(Water/Earth)';
      return '(Balanced)';
    }
    if (axis === 'Y') {
      if (value > 0.5) return '(Light)';
      if (value < -0.5) return '(Shadow)';
      return '(Balanced)';
    }
    if (axis === 'Z') {
      if (value > 0.5) return '(Future)';
      if (value < -0.5) return '(Past)';
      return '(Present)';
    }
    return '';
  }

  function getRecentCards() {
    if (!layers.recentCards || readings.length === 0) return [];

    const seen = new Set();
    const cards = [];

    readings.slice(0, 5).forEach(reading => {
      (reading.cards || []).forEach(card => {
        if (!seen.has(card.cardIndex)) {
          seen.add(card.cardIndex);
          const emb = CARD_EMBEDDINGS[card.cardIndex];
          if (emb) {
            cards.push({
              id: `card_${card.cardIndex}`,
              text: emb.name,
              category: 'card',
              position: emb.position,
              color: NEON_COLORS.hiMagenta
            });
          }
        }
      });
    });

    return cards.slice(0, 20);
  }

  function getAllCards() {
    if (!layers.allCards) return [];

    return Object.entries(CARD_EMBEDDINGS).map(([idx, card]) => ({
      id: `card_${idx}`,
      text: card.name,
      category: 'card',
      position: card.position,
      color: NEON_COLORS.dimMagenta
    }));
  }

  function getUserPosition() {
    if (!layers.userPosition || !activeProfile?.mbtiType) return null;
    const pos = MBTI_POSITIONS[activeProfile.mbtiType.toUpperCase()];
    return pos ? {
      id: 'user',
      text: 'YOU',
      category: 'user',
      position: pos,
      color: NEON_COLORS.hiGreen
    } : null;
  }

  function getVisibleEntities() {
    const all = [];

    if (layers.userPosition) {
      const userPos = getUserPosition();
      if (userPos) all.push(userPos);
    }

    if (layers.userEntities) all.push(...entities);
    if (layers.recentCards) all.push(...getRecentCards());
    if (layers.allCards) all.push(...getAllCards());

    // Apply semantic filters
    if (activeFilters.has('all')) {
      return all;
    }

    return all.filter(entity => {
      // User position always visible
      if (entity.category === 'user') return true;

      // Check if entity matches any active filter
      return matchesSemanticFilter(entity, activeFilters);
    });
  }

  function matchesSemanticFilter(entity, filters) {
    const pos = entity.position;
    if (!pos || pos.length !== 3) return false;

    const [x, y, z] = pos;

    for (const filter of filters) {
      switch (filter) {
        case 'romance':
          // Romance: emotions, people, relationship cards in receptive/light region
          if (entity.category === 'emotion' || entity.category === 'person') return true;
          if (entity.category === 'card' && (entity.text.includes('Lovers') || entity.text.includes('Cups'))) return true;
          break;

        case 'finance':
          // Finance: objects, Pentacles, material concepts
          if (entity.category === 'object' || entity.category === 'goal') return true;
          if (entity.category === 'card' && entity.text.includes('Pentacles')) return true;
          if (entity.text.toLowerCase().match(/money|wealth|finance|cost|expense|income/)) return true;
          break;

        case 'career':
          // Career: Wands, achievement, future-oriented
          if (entity.category === 'goal' && z > 0) return true;
          if (entity.category === 'card' && entity.text.includes('Wands')) return true;
          if (entity.text.toLowerCase().match(/career|work|job|success|achieve/)) return true;
          break;

        case 'shadow':
          // Shadow: Y < -0.3 (shadow consciousness)
          if (y < -0.3) return true;
          break;

        case 'light':
          // Light: Y > 0.3 (light consciousness)
          if (y > 0.3) return true;
          break;

        case 'future':
          // Future: Z > 0.3 (future temporal)
          if (z > 0.3) return true;
          break;

        case 'past':
          // Past: Z < -0.3 (past temporal)
          if (z < -0.3) return true;
          break;
      }
    }

    return false;
  }

  function toggleFilter(filterKey) {
    setActiveFilters(prev => {
      const next = new Set(prev);

      if (filterKey === 'all') {
        return new Set(['all']);
      }

      // Remove 'all' if selecting specific filter
      next.delete('all');

      if (next.has(filterKey)) {
        next.delete(filterKey);
      } else {
        next.add(filterKey);
      }

      // If no filters, default to 'all'
      if (next.size === 0) {
        next.add('all');
      }

      return next;
    });
  }

  // 3D to 2D projection with perspective
  function project3DToScreen(pos3D, cam) {
    // Translate to camera space
    let x = pos3D[0] - cam.x;
    let y = pos3D[1] - cam.y;
    let z = pos3D[2] - cam.z;

    // Rotate around Y axis (yaw)
    const cosY = Math.cos(-cam.rotY);
    const sinY = Math.sin(-cam.rotY);
    const xRot = x * cosY - z * sinY;
    const zRot = x * sinY + z * cosY;
    x = xRot;
    z = zRot;

    // Rotate around X axis (pitch)
    const cosX = Math.cos(-cam.rotX);
    const sinX = Math.sin(-cam.rotX);
    const yRot = y * cosX - z * sinX;
    const zRot2 = y * sinX + z * cosX;
    y = yRot;
    z = zRot2;

    // Perspective projection
    if (z >= -0.1) return null; // Behind camera

    const scale = (cam.focalLength) / -z; // Use focalLength for ADS zoom
    const screenX = VIEW_WIDTH / 2 + x * scale;
    const screenY = VIEW_HEIGHT / 2 - y * scale;

    // Check if on screen
    if (screenX < -50 || screenX > VIEW_WIDTH + 50 || screenY < -50 || screenY > VIEW_HEIGHT + 50) {
      return null;
    }

    return {
      x: screenX,
      y: screenY,
      scale: scale / 300, // Normalize for size
      depth: -z // Distance from camera
    };
  }

  const visibleEntities = getVisibleEntities();
  const clusters = layers.clusters ? findClusters(visibleEntities, 0.35) : [];

  // Project entities to screen
  const projected = visibleEntities
    .map(entity => ({
      entity,
      screen: project3DToScreen(entity.position, camera)
    }))
    .filter(({ screen }) => screen !== null)
    .sort((a, b) => b.screen.depth - a.screen.depth); // Back to front

  return (
    <View style={styles.container}>
      <ScanLines />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.headerText}>← BACK</NeonText>
        </TouchableOpacity>
        <LPMUDText style={styles.title}>$HIW$3D SEMANTIC SPACE$NOR$</LPMUDText>
        <TouchableOpacity onPress={() => setShowAddEntity(!showAddEntity)}>
          <NeonText color={NEON_COLORS.hiMagenta} style={styles.headerText}>+</NeonText>
        </TouchableOpacity>
      </View>

      {/* 3D View */}
      <View
        style={styles.viewport}
        {...panResponder.panHandlers}
      >
        <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT}>
          <Defs>
            <RadialGradient id="clusterGlow" cx="50%" cy="50%">
              <Stop offset="0%" stopColor={NEON_COLORS.hiMagenta} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={NEON_COLORS.hiMagenta} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Axes */}
          {layers.axes && (
            <G>
              {/* X axis (red) */}
              {(() => {
                const origin = project3DToScreen([0, 0, 0], camera);
                const xPos = project3DToScreen([1, 0, 0], camera);
                const xNeg = project3DToScreen([-1, 0, 0], camera);
                if (origin && xPos) {
                  return <Line x1={origin.x} y1={origin.y} x2={xPos.x} y2={xPos.y} stroke={NEON_COLORS.dimRed} strokeWidth={1} opacity={0.4} />;
                }
              })()}
              {/* Y axis (green) */}
              {(() => {
                const origin = project3DToScreen([0, 0, 0], camera);
                const yPos = project3DToScreen([0, 1, 0], camera);
                if (origin && yPos) {
                  return <Line x1={origin.x} y1={origin.y} x2={yPos.x} y2={yPos.y} stroke={NEON_COLORS.dimGreen} strokeWidth={1} opacity={0.4} />;
                }
              })()}
              {/* Z axis (blue) */}
              {(() => {
                const origin = project3DToScreen([0, 0, 0], camera);
                const zPos = project3DToScreen([0, 0, 1], camera);
                if (origin && zPos) {
                  return <Line x1={origin.x} y1={origin.y} x2={zPos.x} y2={zPos.y} stroke={NEON_COLORS.dimCyan} strokeWidth={1} opacity={0.4} />;
                }
              })()}
            </G>
          )}

          {/* Cluster glows (attractor basins) */}
          {clusters.map((cluster, i) => {
            const screen = project3DToScreen(cluster.centroid, camera);
            if (!screen) return null;
            const radius = Math.sqrt(cluster.size) * 30 * screen.scale;
            return (
              <Circle
                key={`cluster-${i}`}
                cx={screen.x}
                cy={screen.y}
                r={radius}
                fill="url(#clusterGlow)"
              />
            );
          })}

          {/* Entities */}
          {projected.map(({ entity, screen }, i) => {
            const isSelected = selectedEntity?.id === entity.id;
            const isUser = entity.category === 'user';
            const baseSize = isUser ? 8 : (isSelected ? 6 : 4);
            const size = baseSize * Math.max(0.5, Math.min(2, screen.scale));
            const opacity = Math.max(0.3, Math.min(1, screen.scale * 0.8));

            return (
              <G key={`entity-${entity.id || i}`}>
                <Circle
                  cx={screen.x}
                  cy={screen.y}
                  r={size}
                  fill={entity.color}
                  opacity={opacity}
                />
                {(isSelected || isUser || (projected.length < 40 && entity.category !== 'card')) && (
                  <SvgText
                    x={screen.x}
                    y={screen.y - size - 4}
                    fill={entity.color}
                    fontSize={Math.max(7, 9 * screen.scale)}
                    fontWeight={isSelected || isUser ? 'bold' : 'normal'}
                    textAnchor="middle"
                    opacity={opacity}
                  >
                    {entity.text.substring(0, 15)}
                  </SvgText>
                )}
              </G>
            );
          })}

          {/* Crosshair */}
          {layers.crosshair && (
            <G>
              <Line x1={VIEW_WIDTH/2 - 10} y1={VIEW_HEIGHT/2} x2={VIEW_WIDTH/2 + 10} y2={VIEW_HEIGHT/2} stroke={NEON_COLORS.dimCyan} strokeWidth={1} opacity={0.5} />
              <Line x1={VIEW_WIDTH/2} y1={VIEW_HEIGHT/2 - 10} x2={VIEW_WIDTH/2} y2={VIEW_HEIGHT/2 + 10} stroke={NEON_COLORS.dimCyan} strokeWidth={1} opacity={0.5} />
            </G>
          )}
        </Svg>

        {/* Touch zone indicators */}
        <View style={styles.touchHints}>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.touchHint}>PAN</NeonText>
          <NeonText color={NEON_COLORS.dimMagenta} style={styles.touchHint}>LOOK</NeonText>
        </View>
      </View>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.hudText}>
            Entities: {visibleEntities.length} | Clusters: {clusters.length}
          </NeonText>
        </View>

        {selectedEntity && (
          <View style={styles.selectedInfo}>
            <LPMUDText style={styles.selectedText}>
              $HIW${selectedEntity.text}$NOR$ ({selectedEntity.category})
            </LPMUDText>
          </View>
        )}

        {/* ADS Scope controls */}
        <View style={styles.adsControls}>
          <TouchableOpacity onPress={() => setCamera(c => ({ ...c, focalLength: Math.min(1600, c.focalLength * 1.5) }))}>
            <NeonText color="#FFD700" style={styles.adsButton}>🔭+</NeonText>
          </TouchableOpacity>
          <NeonText color="#FFD700" style={styles.adsText}>
            {camera.focalLength === 400 ? '1x' : `${(camera.focalLength / 400).toFixed(1)}x ADS`}
          </NeonText>
          <TouchableOpacity onPress={() => setCamera(c => ({ ...c, focalLength: Math.max(200, c.focalLength / 1.5) }))}>
            <NeonText color="#FFD700" style={styles.adsButton}>🔭−</NeonText>
          </TouchableOpacity>
        </View>

        {/* Semantic Filters */}
        <View style={styles.filtersContainer}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.filtersTitle}>FILTERS</NeonText>
          <View style={styles.filterGrid}>
            {Object.entries(SEMANTIC_FILTERS).map(([key, filter]) => {
              const isActive = activeFilters.has(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => toggleFilter(key)}
                >
                  <NeonText
                    color={isActive ? filter.color : NEON_COLORS.dimCyan}
                    style={styles.filterChipText}
                  >
                    [{isActive ? '✓' : ' '}] {filter.name}
                  </NeonText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reset view */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setCamera({ x: 0, y: 0, z: -3, rotX: 0, rotY: 0, rotZ: 0, focalLength: 400 })}
        >
          <NeonText color={NEON_COLORS.dimMagenta} style={styles.resetText}>RESET VIEW</NeonText>
        </TouchableOpacity>
      </View>

      {/* Add Entity Form */}
      {showAddEntity && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="What to map?"
            placeholderTextColor={NEON_COLORS.dimCyan}
            value={newEntityText}
            onChangeText={setNewEntityText}
            maxLength={50}
          />
          <View style={styles.categories}>
            {Object.entries(ENTITY_CATEGORIES).slice(0, 8).map(([key, cat]) => (
              <TouchableOpacity
                key={key}
                style={[styles.catBtn, newEntityCategory === key && styles.catBtnActive]}
                onPress={() => setNewEntityCategory(key)}
              >
                <NeonText color={newEntityCategory === key ? cat.color : NEON_COLORS.dimCyan} style={styles.catText}>
                  {cat.icon}
                </NeonText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formBtns}>
            <TouchableOpacity onPress={() => setShowAddEntity(false)} style={styles.formBtn}>
              <NeonText color={NEON_COLORS.dimRed}>CANCEL</NeonText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddEntity} style={styles.formBtn} disabled={isLoading}>
              <NeonText color={NEON_COLORS.hiGreen}>{isLoading ? '...' : 'MAP IT'}</NeonText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={NEON_COLORS.hiMagenta} size="large" />
          <NeonText color={NEON_COLORS.hiMagenta} style={styles.loadingText}>Mapping semantic position...</NeonText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderBottomWidth: 2,
    borderBottomColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0,255,255,0.05)',
  },
  headerText: { fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold' },
  title: { fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' },
  viewport: {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: NEON_COLORS.hiMagenta,
  },
  touchHints: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  touchHint: { fontSize: 9, fontFamily: 'monospace', opacity: 0.4 },
  hud: {
    padding: 12,
  },
  hudRow: { marginBottom: 8 },
  hudText: { fontSize: 9, fontFamily: 'monospace' },
  selectedInfo: {
    padding: 8,
    borderWidth: 1,
    borderColor: NEON_COLORS.hiMagenta,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: 'rgba(255,0,255,0.05)',
  },
  selectedText: { fontSize: 11, fontFamily: 'monospace' },
  adsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  adsButton: { fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold' },
  adsText: { fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' },
  filtersContainer: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 255, 255, 0.02)',
  },
  filtersTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 20, 20, 0.3)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  resetButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimMagenta,
    borderRadius: 4,
    alignItems: 'center',
  },
  resetText: { fontSize: 10, fontFamily: 'monospace' },
  addForm: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 4,
    backgroundColor: 'rgba(0,20,20,0.95)',
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 4,
    padding: 10,
    color: NEON_COLORS.hiWhite,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 3,
  },
  catBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  catText: { fontSize: 14 },
  formBtns: { flexDirection: 'row', gap: 10 },
  formBtn: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 4,
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 10, fontFamily: 'monospace' },
});
