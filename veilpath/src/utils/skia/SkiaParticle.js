/**
 * SkiaParticle - Base component for particle effects
 *
 * Reusable particle component that can be used for:
 * - Floating particles (ambient effects)
 * - Sparkles (card rarity effects)
 * - Explosion effects (user interactions)
 * - Trail effects (gestures)
 *
 * STATUS: ACTIVE - Dependencies installed ✅
 */

import React, { useEffect } from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, withDelay, Easing, runOnJS } from 'react-native-reanimated';
import { fadeIn, fadeOut } from './SkiaAnimationHelpers';

export function SkiaParticle({
  x,
  y,
  size = 3,
  color = '#00ffff',
  opacity = 1,
  fadeInDuration = 300,
  fadeOutDuration = 300,
  fadeInDelay = 0,
  autoFadeIn = true,
  blur,
}) {
  const opacityValue = useSharedValue(autoFadeIn ? 0 : opacity);

  useEffect(() => {
    if (autoFadeIn) {
      fadeIn(opacityValue, fadeInDuration, fadeInDelay);
    }
  }, [autoFadeIn, fadeInDuration, fadeInDelay]);

  return (
    <Circle
      cx={x}
      cy={y}
      r={size}
      color={color}
      opacity={opacityValue}
      // Uncomment for glow effect:
      // style={blur ? "fill" : "fill"}
      // {...(blur && { blur: { sigma: blur } })}
    />
  );
}

export function SkiaParticleWithAnimation({
  initialX,
  initialY,
  targetX,
  targetY,
  size = 3,
  color = '#00ffff',
  duration = 1000,
  delay = 0,
  onComplete,
}) {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    fadeIn(opacity, 300, delay);

    // Move to target
    x.value = withDelay(
      delay,
      withTiming(targetX, {
        duration,
        easing: Easing.out(Easing.ease),
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    y.value = withDelay(
      delay,
      withTiming(targetY, {
        duration,
        easing: Easing.out(Easing.ease),
      })
    );

    // Fade out near end
    const fadeOutStart = delay + duration - 300;
    setTimeout(() => {
      fadeOut(opacity, 300);
    }, fadeOutStart);
  }, [delay, duration, targetX, targetY]);

  return (
    <Circle
      cx={x}
      cy={y}
      r={size}
      color={color}
      opacity={opacity}
    />
  );
}

export function SkiaParticleEmitter({
  x,
  y,
  particleCount = 10,
  particleSize = 3,
  particleColor = '#00ffff',
  spreadRadius = 100,
  duration = 1000,
  delay = 0,
}) {
  // Generate random particles in a circle
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = Math.random() * spreadRadius;
    return {
      id: i,
      targetX: x + Math.cos(angle) * distance,
      targetY: y + Math.sin(angle) * distance,
      size: particleSize * (0.5 + Math.random() * 0.5),
      delay: delay + Math.random() * 200,
    };
  });

  return (
    <>
      {particles.map((particle) => (
        <SkiaParticleWithAnimation
          key={particle.id}
          initialX={x}
          initialY={y}
          targetX={particle.targetX}
          targetY={particle.targetY}
          size={particle.size}
          color={particleColor}
          duration={duration}
          delay={particle.delay}
        />
      ))}
    </>
  );
}
