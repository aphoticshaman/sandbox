/**
 * AmbientEffectsSkia - High-performance Skia-based ambient effects
 *
 * Migrated from AmbientEffects.js (Animated API)
 * Now using @shopify/react-native-skia + react-native-reanimated@3
 *
 * Components:
 * - AmbientEffects: Floating particles overlay
 * - LightBeams: Shooting light beams across screen
 * - MainMenuAmbience: Preset for main menu
 * - CardReadingAmbience: Preset for card reading
 * - LevelUpAmbience: Preset for level up celebration
 *
 * Created: 2025-11-20
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { FloatingParticle } from './skia/FloatingParticleSkia';
import { LightBeams } from './skia/LightBeamsSkia';

/**
 * Full ambient effects overlay with floating particles
 */
export function AmbientEffects({ intensity = 'medium', style }) {
  // Determine number of particles based on intensity
  const particleCount =
    intensity === 'low' ? 5 :
    intensity === 'medium' ? 10 :
    intensity === 'high' ? 20 : 10;

  const speed = intensity === 'high' ? 'fast' : intensity === 'low' ? 'slow' : 'normal';

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: particleCount }).map((_, i) => (
          <FloatingParticle
            key={`particle-${i}`}
            delay={i * 200}
            speed={speed}
            color="#9945FF"
            size={3}
          />
        ))}
      </Canvas>
    </View>
  );
}

/**
 * Light beams overlay - shoots beams across screen
 */
export function LightBeamsOverlay({ color = 'rgba(153, 69, 255, 0.3)', count = 2, style }) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFillObject}>
        <LightBeams color={color} count={count} />
      </Canvas>
    </View>
  );
}

/**
 * Preset ambient effects for different screens
 */
export function MainMenuAmbience() {
  return (
    <>
      <AmbientEffects intensity="medium" />
      <LightBeamsOverlay color="rgba(153, 69, 255, 0.3)" count={2} />
    </>
  );
}

export function CardReadingAmbience() {
  return (
    <>
      <AmbientEffects intensity="high" />
      <LightBeamsOverlay color="rgba(0, 240, 255, 0.3)" count={3} />
    </>
  );
}

export function LevelUpAmbience() {
  return (
    <>
      <AmbientEffects intensity="high" />
      <LightBeamsOverlay color="rgba(255, 215, 0, 0.5)" count={5} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

// Default export for backward compatibility
export default AmbientEffects;
