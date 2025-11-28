/**
 * GLITCH PARTICLES COMPONENT
 * Floating cyberpunk glitch characters around elements
 * Hearthstone-inspired particle effects for that Blizzard polish
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NeonText } from './TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { qRandom } from '../utils/quantumRNG';

const GLITCH_CHARS = ['▓', '▒', '░', '█', '▄', '▀', '╳', '╱', '╲', '┼', '◈', '◉', '⟨', '⟩', 'ψ'];

/**
 * GlitchParticles Component
 * @param {number} count - Number of particles to show
 * @param {number} width - Width of the effect area
 * @param {number} height - Height of the effect area
 * @param {boolean} active - Whether particles should animate
 * @param {string} color - Neon color for particles
 */
export default function GlitchParticles({
  count = 8,
  width = 100,
  height = 150,
  active = true,
  color = NEON_COLORS.hiCyan,
}) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate random particles
    const newParticles = Array(count).fill(0).map((_, i) => ({
      id: i,
      char: GLITCH_CHARS[Math.floor(qRandom() * GLITCH_CHARS.length)],
      x: qRandom() * width,
      y: qRandom() * height,
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.5),
      lifetime: 1500 + qRandom() * 1000, // 1.5-2.5 seconds
      delay: qRandom() * 500, // Stagger spawn
    }));

    setParticles(newParticles);

    // Animate each particle
    newParticles.forEach((particle) => {
      setTimeout(() => {
        // Fade in, float up, scale, fade out
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: particle.lifetime - 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.translateY, {
            toValue: -50 - qRandom() * 30, // Float upward
            duration: particle.lifetime,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1 + qRandom() * 0.5,
              duration: particle.lifetime / 2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0.3,
              duration: particle.lifetime / 2,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, particle.delay);
    });

    // Clean up and restart after particles die
    const restartTimer = setTimeout(() => {
      setParticles([]);
      // Trigger re-render to create new particles
      if (active) {
        setParticles(prev => [...prev]);
      }
    }, Math.max(...newParticles.map(p => p.lifetime + p.delay)));

    return () => clearTimeout(restartTimer);
  }, [active, count, width, height]);

  if (!active || particles.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity,
              transform: [
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          <NeonText color={color} style={styles.particleText}>
            {particle.char}
          </NeonText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
  },
  particleText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
