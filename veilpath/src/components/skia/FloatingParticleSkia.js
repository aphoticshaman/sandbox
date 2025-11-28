/**
 * FloatingParticleSkia - Skia-based floating particle effect
 *
 * Migrated from AmbientEffects.js FloatingParticle component
 * Uses Skia Canvas + Reanimated 3 for high-performance rendering
 *
 * Features:
 * - Random starting position
 * - Floating animation (up/down drift)
 * - Horizontal drift
 * - Scale pulse effect
 * - Configurable speed (fast/normal/slow)
 * - Fade in animation
 *
 * Created: 2025-11-20
 */

import React, { useEffect, useMemo } from 'react';
import { Circle } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSkiaDimensions } from '../../contexts/SkiaDimensionsContext';

export function FloatingParticle({
  delay = 0,
  speed = 'normal',
  color = '#9945FF',
  size = 3,
}) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useSkiaDimensions();

  // Calculate random properties once (useMemo to prevent recalculation on re-renders)
  const particleProps = useMemo(() => {
    // Random starting position
    const startX = Math.random() * SCREEN_WIDTH;
    const startY = Math.random() * SCREEN_HEIGHT;

    // Random particle properties
    const driftDistance = 50 + Math.random() * 100;
    const speedMultiplier = speed === 'fast' ? 0.7 : speed === 'slow' ? 1.5 : 1;
    const duration = (8000 + Math.random() * 4000) * speedMultiplier;
    const targetOpacity = 0.6 + Math.random() * 0.3;

    return {
      startX,
      startY,
      driftDistance,
      duration,
      targetOpacity,
    };
  }, [speed, SCREEN_WIDTH, SCREEN_HEIGHT]);

  // Animated values
  const x = useSharedValue(particleProps.startX);
  const y = useSharedValue(particleProps.startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(
      delay,
      withTiming(particleProps.targetOpacity, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Vertical float (up and down)
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(particleProps.startY - particleProps.driftDistance, {
            duration: particleProps.duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(particleProps.startY, {
            duration: particleProps.duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite
        false
      )
    );

    // Horizontal drift
    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(particleProps.startX + particleProps.driftDistance * 0.5, {
            duration: particleProps.duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(particleProps.startX, {
            duration: particleProps.duration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Gentle pulse (scale)
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: particleProps.duration * 0.6,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.8, {
            duration: particleProps.duration * 0.4,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );
  }, [delay, particleProps]);

  return (
    <Circle
      cx={x}
      cy={y}
      r={size * scale.value}
      color={color}
      opacity={opacity}
    />
  );
}

export default FloatingParticle;
