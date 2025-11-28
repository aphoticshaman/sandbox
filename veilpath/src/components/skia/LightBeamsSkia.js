/**
 * LightBeamsSkia - Skia-based light beam effect
 *
 * Migrated from AmbientEffects.js AnimatedBeam component
 * Light beams that shoot horizontally across the screen
 *
 * Features:
 * - Random vertical position
 * - Shoots from left to right across screen
 * - Fade in at start, fade out at end
 * - Looping animation with delays
 * - Configurable color
 * - Glow effect (blur)
 *
 * Created: 2025-11-20
 */

import React, { useEffect, useMemo } from 'react';
import { Rect, BlurMask } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSkiaDimensions } from '../../contexts/SkiaDimensionsContext';

function AnimatedBeam({ color = '#9945FF', delay = 0 }) {
  const { width: screenWidth, height: screenHeight } = useSkiaDimensions();

  // Random vertical position (calculated once)
  const top = useMemo(() => Math.random() * screenHeight, [screenHeight]);

  // Animated values
  const translateX = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      'worklet';
      // Reset position
      translateX.value = -200;
      opacity.value = 0;

      // Fade in
      opacity.value = withTiming(0.4, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });

      // Shoot across screen
      translateX.value = withTiming(screenWidth + 200, {
        duration: 2000,
        easing: Easing.linear,
      });

      // Fade out at the end (after 1500ms of the 2000ms movement)
      opacity.value = withDelay(
        1500,
        withTiming(0, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        })
      );

      // Wait before next beam, then loop
      const nextDelay = 3000 + Math.random() * 2000;
      setTimeout(() => {
        if (translateX && opacity) {
          animate();
        }
      }, 2500 + nextDelay);
    };

    // Start animation after initial delay
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, [screenWidth, delay]);

  return (
    <>
      <Rect
        x={translateX}
        y={top}
        width={150}
        height={2}
        color={color}
        opacity={opacity}
      >
        <BlurMask blur={10} style="solid" />
      </Rect>
    </>
  );
}

/**
 * LightBeams - Container for multiple animated beams
 */
export function LightBeams({ color = '#9945FF', count = 3 }) {
  const beams = [];

  for (let i = 0; i < count; i++) {
    beams.push(
      <AnimatedBeam
        key={`beam-${i}`}
        color={color}
        delay={i * 1000}
      />
    );
  }

  return <>{beams}</>;
}

export default LightBeams;
