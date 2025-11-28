/**
 * PAC-MAN LOADER
 *
 * Indeterminate progress animation that's honest about not knowing
 * how long things will take. Much better than a fake progress bar.
 *
 * Animation: < . . . .   becomes   < . . .   becomes   < . .   etc
 * Then reverses direction and eats them back.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { NEON_COLORS } from '../styles/cyberpunkColors';

const NUM_DOTS = 12;
const DOT_SPACING = 8;
const ANIMATION_DURATION = 150; // ms per dot eaten

export function PacManLoader({
  color = NEON_COLORS.hiCyan,
  size = 'medium',
  style
}) {
  const [dots, setDots] = useState(Array(NUM_DOTS).fill(true));
  const [direction, setDirection] = useState('right'); // 'right' or 'left'
  const [pacManPosition, setPacManPosition] = useState(0);
  const mouthOpen = useRef(new Animated.Value(0)).current;

  // Pac-Man mouth animation (chomp chomp)
  useEffect(() => {
    const mouthAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(mouthOpen, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(mouthOpen, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );
    mouthAnimation.start();

    return () => mouthAnimation.stop();
  }, []);

  // Dot eating animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(currentDots => {
        const newDots = [...currentDots];

        if (direction === 'right') {
          // Find first visible dot and eat it
          const firstDot = newDots.findIndex(d => d);
          if (firstDot !== -1) {
            newDots[firstDot] = false;
            setPacManPosition(firstDot);
          }

          // If all dots eaten, reverse direction
          if (newDots.every(d => !d)) {
            setDirection('left');
            // Reset dots from the right
            return Array(NUM_DOTS).fill(true);
          }
        } else {
          // Find last visible dot and eat it
          const lastDot = newDots.map((d, i) => d ? i : -1).filter(i => i !== -1).pop();
          if (lastDot !== undefined) {
            newDots[lastDot] = false;
            setPacManPosition(lastDot);
          }

          // If all dots eaten, reverse direction
          if (newDots.every(d => !d)) {
            setDirection('right');
            // Reset dots from the left
            return Array(NUM_DOTS).fill(true);
          }
        }

        return newDots;
      });
    }, ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, [direction]);

  // Size configurations
  const sizeConfig = {
    small: { dotSize: 3, pacSize: 10, gap: 4 },
    medium: { dotSize: 4, pacSize: 14, gap: 6 },
    large: { dotSize: 6, pacSize: 20, gap: 8 },
  }[size] || sizeConfig.medium;

  // Interpolate mouth angle
  const mouthAngle = mouthOpen.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Pac-Man */}
      <Animated.View
        style={[
          styles.pacMan,
          {
            width: sizeConfig.pacSize,
            height: sizeConfig.pacSize,
            backgroundColor: color,
            transform: [
              { translateX: pacManPosition * (sizeConfig.dotSize + sizeConfig.gap) },
              { rotate: direction === 'right' ? '0deg' : '180deg' },
            ],
          },
        ]}
      >
        {/* Mouth (wedge cutout effect) */}
        <Animated.View
          style={[
            styles.mouth,
            {
              borderRightWidth: sizeConfig.pacSize / 2,
              borderTopWidth: sizeConfig.pacSize / 2,
              borderBottomWidth: sizeConfig.pacSize / 2,
              transform: [{ rotate: mouthAngle }],
            },
          ]}
        />
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {dots.map((visible, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: sizeConfig.dotSize,
                height: sizeConfig.dotSize,
                backgroundColor: visible ? color : 'transparent',
                marginHorizontal: sizeConfig.gap / 2,
                opacity: visible ? 0.8 : 0,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Alternative: Simple dot wave animation
 * For when Pac-Man is too playful
 */
export function DotWaveLoader({ color = NEON_COLORS.hiCyan, style }) {
  const animations = useRef(
    Array(5).fill(0).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animateWave = () => {
      const staggeredAnimations = animations.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      );

      Animated.parallel(staggeredAnimations).start();
    };

    animateWave();

    return () => animations.forEach(a => a.stopAnimation());
  }, []);

  return (
    <View style={[styles.waveContainer, style]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveDot,
            {
              backgroundColor: color,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  pacMan: {
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  mouth: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
    width: 0,
    height: 0,
    borderRightColor: '#000',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  dot: {
    borderRadius: 100,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default PacManLoader;
