/**
 * CARD FLIP ANIMATIONS LIBRARY - VeilPath
 * Wild, premium flip animations for tarot card reveals
 *
 * Each animation returns a function that creates Animated.CompositeAnimation
 * Usage: const anim = FLIP_ANIMATIONS.dance.create(flipAnim, scaleAnim, rotateAnim);
 */

import { Animated, Easing } from 'react-native';

// Animation definitions with metadata for UI
export const FLIP_ANIMATIONS = {
  // ═══════════════════════════════════════════════════════════
  // CLASSIC ANIMATIONS (Default/Common)
  // ═══════════════════════════════════════════════════════════
  classic: {
    id: 'classic',
    name: 'Classic Flip',
    description: 'Traditional smooth card flip',
    emoji: '🎴',
    rarity: 'common',
    isDefault: true,
    unlocked: true,
    create: (flipAnim) => ({
      flip: Animated.spring(flipAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Interpolations for the animation
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    }),
  },

  fade: {
    id: 'fade',
    name: 'Mystic Fade',
    description: 'Ethereal fade transition',
    emoji: '🌫️',
    rarity: 'common',
    isDefault: true,
    unlocked: true,
    create: (flipAnim) => ({
      flip: Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        opacity: flipAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.3, 1],
        }),
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // RARE ANIMATIONS
  // ═══════════════════════════════════════════════════════════
  wiggle: {
    id: 'wiggle',
    name: 'Playful Wiggle',
    description: 'Card wiggles excitedly before reveal',
    emoji: '💃',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 200 },
    create: (flipAnim, scaleAnim, rotateAnim) => {
      // Multi-step wiggle then flip
      return {
        flip: Animated.sequence([
          // Wiggle phase
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: -1,
                duration: 50,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 5 }
          ),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
          // Then flip
          Animated.spring(flipAnim, {
            toValue: 1,
            tension: 60,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        interpolations: {
          rotateY: flipAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
          backRotateY: flipAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '360deg'],
          }),
          rotateZ: rotateAnim.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: ['-5deg', '0deg', '5deg'],
          }),
        },
      };
    },
  },

  bounce: {
    id: 'bounce',
    name: 'Bouncy Reveal',
    description: 'Card bounces with joy',
    emoji: '🏀',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 250 },
    create: (flipAnim, scaleAnim) => ({
      flip: Animated.parallel([
        Animated.spring(flipAnim, {
          toValue: 1,
          tension: 80,
          friction: 3, // Low friction = bouncy
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        scale: scaleAnim,
      },
    }),
  },

  float: {
    id: 'float',
    name: 'Ethereal Float',
    description: 'Card floats up mystically',
    emoji: '🎈',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 10 },
    create: (flipAnim, scaleAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Float up
        Animated.timing(translateAnim, {
          toValue: -30,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Flip while floating
        Animated.parallel([
          Animated.spring(flipAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          // Float back down
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        translateY: translateAnim,
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // EPIC ANIMATIONS
  // ═══════════════════════════════════════════════════════════
  dance: {
    id: 'dance',
    name: 'Cosmic Dance',
    description: 'Card dances before revealing fate',
    emoji: '💫',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 500 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Dance phase - sway left and right
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: 10, duration: 150, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 3 }
        ),
        // Reset
        Animated.parallel([
          Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]),
        // Dramatic flip
        Animated.spring(flipAnim, {
          toValue: 1,
          tension: 70,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        rotateZ: rotateAnim.interpolate({
          inputRange: [-10, 0, 10],
          outputRange: ['-10deg', '0deg', '10deg'],
        }),
        translateX: translateAnim,
      },
    }),
  },

  spin: {
    id: 'spin',
    name: 'Gyrating Spiral',
    description: 'Card spirals through dimensions',
    emoji: '🌀',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 600 },
    create: (flipAnim, scaleAnim, rotateAnim) => ({
      flip: Animated.parallel([
        // Full 360 spin on Z axis
        Animated.timing(rotateAnim, {
          toValue: 360,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Flip on Y axis
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Pulse scale
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        rotateZ: rotateAnim.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
        scale: scaleAnim,
      },
    }),
  },

  oscillate: {
    id: 'oscillate',
    name: 'Pendulum Swing',
    description: 'Card swings like a mystic pendulum',
    emoji: '🕰️',
    rarity: 'epic',
    unlockRequirement: { type: 'achievement', value: 'daily_streak_14' },
    create: (flipAnim, scaleAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Swing back
        Animated.timing(rotateAnim, {
          toValue: 30,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Swing forward with decreasing amplitude
        Animated.timing(rotateAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Flip
        Animated.spring(flipAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        rotateZ: rotateAnim.interpolate({
          inputRange: [-30, 0, 30],
          outputRange: ['-30deg', '0deg', '30deg'],
        }),
      },
    }),
  },

  vibrate: {
    id: 'vibrate',
    name: 'Trembling Vera',
    description: 'Card trembles with cosmic energy',
    emoji: '⚡',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 550 },
    create: (flipAnim, scaleAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Intense vibration
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateAnim, { toValue: 3, duration: 20, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: -3, duration: 20, useNativeDriver: true }),
          ]),
          { iterations: 15 }
        ),
        Animated.timing(translateAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        // Energy burst flip
        Animated.parallel([
          Animated.spring(flipAnim, {
            toValue: 1,
            tension: 100,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          ]),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        translateX: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // LEGENDARY ANIMATIONS
  // ═══════════════════════════════════════════════════════════
  portal: {
    id: 'portal',
    name: 'Void Portal',
    description: 'Card emerges from a cosmic portal',
    emoji: '🕳️',
    rarity: 'legendary',
    unlockRequirement: { type: 'purchase', price: 1000 },
    create: (flipAnim, scaleAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Shrink into void
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0, duration: 300, easing: Easing.in(Easing.back(2)), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 180, duration: 300, useNativeDriver: true }),
        ]),
        // Flip while hidden
        Animated.timing(flipAnim, { toValue: 1, duration: 1, useNativeDriver: true }),
        // Emerge from portal
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 360, duration: 400, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        rotateZ: rotateAnim.interpolate({
          inputRange: [0, 180, 360],
          outputRange: ['0deg', '180deg', '360deg'],
        }),
        scale: scaleAnim,
      },
    }),
  },

  swim: {
    id: 'swim',
    name: 'Oceanic Wave',
    description: 'Card flows like water currents',
    emoji: '🌊',
    rarity: 'legendary',
    unlockRequirement: { type: 'purchase', price: 1200 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.parallel([
        // Flowing wave motion
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateAnim, { toValue: -40, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -15, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(translateAnim, { toValue: 40, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 15, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(translateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]),
        // Flip during wave
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(flipAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        rotateZ: rotateAnim.interpolate({
          inputRange: [-15, 0, 15],
          outputRange: ['-15deg', '0deg', '15deg'],
        }),
        translateX: translateAnim,
      },
    }),
  },

  stretch: {
    id: 'stretch',
    name: 'Reality Warp',
    description: 'Card stretches through dimensional fabric',
    emoji: '🪄',
    rarity: 'legendary',
    unlockRequirement: { type: 'achievement', value: 'level_30' },
    create: (flipAnim, scaleXAnim, scaleYAnim) => ({
      flip: Animated.sequence([
        // Stretch tall
        Animated.parallel([
          Animated.timing(scaleXAnim, { toValue: 0.6, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 1.5, duration: 200, useNativeDriver: true }),
        ]),
        // Stretch wide
        Animated.parallel([
          Animated.timing(scaleXAnim, { toValue: 1.4, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        ]),
        // Flip while morphing
        Animated.parallel([
          Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          Animated.spring(scaleXAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        scaleX: scaleXAnim,
        scaleY: scaleYAnim,
      },
    }),
  },

  shatter: {
    id: 'shatter',
    name: 'Crystal Shatter',
    description: 'Card shatters into light, reforms as destiny',
    emoji: '💎',
    rarity: 'legendary',
    unlockRequirement: { type: 'purchase', price: 1500 },
    create: (flipAnim, scaleAnim, opacityAnim) => ({
      flip: Animated.sequence([
        // Build up
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        // Shatter (shrink fast with fade)
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
        // Flip while hidden
        Animated.timing(flipAnim, { toValue: 1, duration: 1, useNativeDriver: true }),
        // Reform
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 4, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
        backRotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
        scale: scaleAnim,
        opacity: opacityAnim,
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // 🐾 CREATURE ANIMATIONS - Animals & Critters
  // ═══════════════════════════════════════════════════════════
  catPounce: {
    id: 'catPounce',
    name: 'Cat Pounce',
    description: 'Card stalks, wiggles its butt, then POUNCES!',
    emoji: '🐱',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 650 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Crouch down (stalking)
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 15, duration: 200, useNativeDriver: true }),
        ]),
        // Butt wiggle! Classic cat move
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -3, duration: 60, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ),
        Animated.timing(rotateAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
        // POUNCE! Fast leap up and flip
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -80, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 120, friction: 4, useNativeDriver: true }),
        ]),
        // Land gracefully
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-3, 0, 3], outputRange: ['-3deg', '0deg', '3deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  bunnyHop: {
    id: 'bunnyHop',
    name: 'Bunny Hop',
    description: 'Hippity hoppity, your fate is my property!',
    emoji: '🐰',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 350 },
    create: (flipAnim, scaleAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Hop hop hop!
        Animated.loop(
          Animated.sequence([
            // Crouch
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: 5, duration: 80, useNativeDriver: true }),
            ]),
            // HOP!
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1.1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -35, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            // Land
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 3 }
        ),
        // Big final hop with flip!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        ]),
        Animated.spring(translateAnim, { toValue: 0, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  birdFlutter: {
    id: 'birdFlutter',
    name: 'Bird Flutter',
    description: 'Card flaps its wings and takes flight!',
    emoji: '🐦',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 600 },
    create: (flipAnim, scaleXAnim, scaleYAnim, translateAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Wing flapping (scale X alternates = wing beats)
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleXAnim, { toValue: 1.3, duration: 60, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleXAnim, { toValue: 0.8, duration: 60, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 6 }
        ),
        // Take flight! Rise up while flipping
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -60, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        ]),
        // Glide back down
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-10, 0, 10], outputRange: ['-10deg', '0deg', '10deg'] }),
        translateY: translateAnim,
        scaleX: scaleXAnim,
      },
    }),
  },

  snakeSlither: {
    id: 'snakeSlither',
    name: 'Snake Slither',
    description: 'Sssssslithering through the veil of fate...',
    emoji: '🐍',
    rarity: 'legendary',
    unlockRequirement: { type: 'purchase', price: 1100 },
    create: (flipAnim, scaleYAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // S-curve slither motion
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: 30, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 15, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: -30, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -15, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 2 }
        ),
        // Coil up (spring back)
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 0.7, duration: 150, useNativeDriver: true }),
        ]),
        // STRIKE! Fast flip reveal
        Animated.parallel([
          Animated.spring(flipAnim, { toValue: 1, tension: 150, friction: 4, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }),
        translateX: translateAnim,
        scaleY: scaleYAnim,
      },
    }),
  },

  fishSplash: {
    id: 'fishSplash',
    name: 'Fish Splash',
    description: 'Card leaps from the cosmic waters!',
    emoji: '🐟',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 700 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Swimming side to side
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: 20, duration: 150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: -20, duration: 150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -8, duration: 150, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 2 }
        ),
        // SPLASH! Leap out of water
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.sequence([
            // Arc up
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: -45, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            ]),
            // Arc down with flip
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: 45, duration: 300, useNativeDriver: true }),
              Animated.spring(flipAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
            ]),
            // Splash landing
            Animated.parallel([
              Animated.spring(rotateAnim, { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
              Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
            ]),
          ]),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-45, 0, 45], outputRange: ['-45deg', '0deg', '45deg'] }),
        translateX: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  dogShake: {
    id: 'dogShake',
    name: 'Wet Dog Shake',
    description: 'Card shakes off the cosmic dust enthusiastically!',
    emoji: '🐕',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 400 },
    create: (flipAnim, scaleXAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // THE SHAKE! Fast alternating rotation like a wet dog
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: 20, duration: 40, useNativeDriver: true }),
              Animated.timing(scaleXAnim, { toValue: 1.15, duration: 40, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: -20, duration: 40, useNativeDriver: true }),
              Animated.timing(scaleXAnim, { toValue: 0.85, duration: 40, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 8 }
        ),
        // Settle down
        Animated.parallel([
          Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        // Happy flip reveal!
        Animated.spring(flipAnim, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-20, 0, 20], outputRange: ['-20deg', '0deg', '20deg'] }),
        scaleX: scaleXAnim,
      },
    }),
  },

  butterflyMetamorphosis: {
    id: 'butterflyMetamorphosis',
    name: 'Butterfly Emergence',
    description: 'Card transforms from cocoon to beautiful revelation',
    emoji: '🦋',
    rarity: 'legendary',
    unlockRequirement: { type: 'achievement', value: 'readings_100' },
    create: (flipAnim, scaleXAnim, scaleYAnim, opacityAnim) => ({
      flip: Animated.sequence([
        // Form cocoon (squeeze narrow)
        Animated.parallel([
          Animated.timing(scaleXAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
        ]),
        // Pulse in cocoon
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleXAnim, { toValue: 0.35, duration: 200, useNativeDriver: true }),
            Animated.timing(scaleXAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ),
        // EMERGE! Burst out and flutter
        Animated.parallel([
          Animated.spring(scaleXAnim, { toValue: 1.3, tension: 80, friction: 4, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 0.9, tension: 80, friction: 4, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        ]),
        // Flutter wings (scale X oscillates)
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleXAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleXAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ),
        // Settle into beauty
        Animated.parallel([
          Animated.spring(scaleXAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        scaleX: scaleXAnim,
        scaleY: scaleYAnim,
      },
    }),
  },

  frogLeap: {
    id: 'frogLeap',
    name: 'Frog Leap',
    description: 'Ribbit! Card leaps to reveal your fortune!',
    emoji: '🐸',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 380 },
    create: (flipAnim, scaleAnim, translateAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Crouch low (frog sitting)
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]),
        // Pre-leap wiggle
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ),
        Animated.timing(rotateAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
        // BIG LEAP!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -100, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 250, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -15, duration: 250, useNativeDriver: true }),
        ]),
        // Flip at apex
        Animated.spring(flipAnim, { toValue: 1, tension: 90, friction: 5, useNativeDriver: true }),
        // Land
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 40, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0, tension: 40, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  owlTurn: {
    id: 'owlTurn',
    name: 'Owl Wisdom Turn',
    description: 'Card rotates head 270° then reveals ancient wisdom',
    emoji: '🦉',
    rarity: 'epic',
    unlockRequirement: { type: 'level', value: 20 },
    create: (flipAnim, scaleAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Slow, wise head turn (almost all the way around)
        Animated.timing(rotateAnim, {
          toValue: 270,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Pause... staring with wisdom
        Animated.delay(200),
        // Quick snap back + flip (the reveal!)
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 360,
            duration: 150,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(flipAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          ]),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [0, 270, 360], outputRange: ['0deg', '270deg', '360deg'] }),
        scale: scaleAnim,
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // 🎭 ANTHROPOMORPHIC ANIMATIONS - Personality & Emotion
  // ═══════════════════════════════════════════════════════════
  scaredJelly: {
    id: 'scaredJelly',
    name: 'Scared Jelly',
    description: 'Card trembles nervously before timidly revealing',
    emoji: '😰',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 320 },
    create: (flipAnim, scaleAnim, translateAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Wobble nervously
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: 2, duration: 30, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 1, duration: 30, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: -2, duration: 30, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -1, duration: 30, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 10 }
        ),
        // Shrink back scared
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
        // Deep breath...
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
        // Timid flip
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-1deg', '0deg', '1deg'] }),
        translateX: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  tipsyStumble: {
    id: 'tipsyStumble',
    name: 'Tipsy Stumble',
    description: 'Card staggers around like it had one too many potions',
    emoji: '🍷',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 550 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Stagger left
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -30, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -15, duration: 300, useNativeDriver: true }),
        ]),
        // Overcorrect right
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 40, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 20, duration: 350, useNativeDriver: true }),
        ]),
        // Wobble back
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -20, duration: 250, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -10, duration: 250, useNativeDriver: true }),
        ]),
        // Try to stand straight... fail a bit
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 10, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 5, duration: 200, useNativeDriver: true }),
        ]),
        // Finally get it together with a flip
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-15, 0, 20], outputRange: ['-15deg', '0deg', '20deg'] }),
        translateX: translateAnim,
      },
    }),
  },

  peekaboo: {
    id: 'peekaboo',
    name: 'Peek-a-Boo',
    description: 'Card hides shyly, then peeks out playfully!',
    emoji: '🙈',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 300 },
    create: (flipAnim, scaleAnim, translateAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Hide! (shrink and duck down)
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 50, duration: 200, useNativeDriver: true }),
        ]),
        // Peek up slowly...
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 30, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        ]),
        // Duck back!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 50, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
        ]),
        // Peek again with a tilt
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 20, duration: 250, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 10, duration: 250, useNativeDriver: true }),
        ]),
        // BOO! Full reveal!
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-10, 0, 10], outputRange: ['-10deg', '0deg', '10deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  sassyStrut: {
    id: 'sassyStrut',
    name: 'Sassy Strut',
    description: 'Card walks with confident attitude before the big reveal',
    emoji: '💅',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 580 },
    create: (flipAnim, scaleYAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Strut! Hip sway walk
        Animated.loop(
          Animated.sequence([
            // Step left with hip
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: -25, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -8, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            ]),
            // Step right with hip
            Animated.parallel([
              Animated.timing(translateAnim, { toValue: 25, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 8, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 2 }
        ),
        // Strike a pose
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -5, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        ]),
        // Dramatic flip with flair
        Animated.parallel([
          Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-8, 0, 8], outputRange: ['-8deg', '0deg', '8deg'] }),
        translateX: translateAnim,
        scaleY: scaleYAnim,
      },
    }),
  },

  dramaticFaint: {
    id: 'dramaticFaint',
    name: 'Dramatic Faint',
    description: 'Card swoons dramatically before revealing destiny',
    emoji: '🎭',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 620 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Hand to forehead moment
        Animated.timing(rotateAnim, { toValue: -5, duration: 200, useNativeDriver: true }),
        // Oh my! Start swooning
        Animated.parallel([
          Animated.timing(rotateAnim, { toValue: 30, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 40, duration: 400, useNativeDriver: true }),
        ]),
        // Full faint! Fall over
        Animated.parallel([
          Animated.timing(rotateAnim, { toValue: 85, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 60, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.9, duration: 300, useNativeDriver: true }),
        ]),
        // Dramatic pause
        Animated.delay(200),
        // Sudden revival! Rise up with flip
        Animated.parallel([
          Animated.spring(rotateAnim, { toValue: 0, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(translateAnim, { toValue: 0, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-5, 0, 30, 85], outputRange: ['-5deg', '0deg', '30deg', '85deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  excitedJump: {
    id: 'excitedJump',
    name: 'Excited Jump',
    description: 'Card bounces with pure joy and excitement!',
    emoji: '🤩',
    rarity: 'rare',
    unlockRequirement: { type: 'purchase', price: 280 },
    create: (flipAnim, scaleAnim, translateAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Excited bouncing!
        Animated.loop(
          Animated.sequence([
            // Crouch
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
            // JUMP!
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -30, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
            ]),
            // Land
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 4 }
        ),
        // BIG EXCITED JUMP with flip!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 100, friction: 4, useNativeDriver: true }),
        ]),
        // Happy landing
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 60, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-5, 0, 5], outputRange: ['-5deg', '0deg', '5deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  sleepyYawn: {
    id: 'sleepyYawn',
    name: 'Sleepy Yawn',
    description: 'Card stretches lazily before sleepily revealing...',
    emoji: '😴',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 15 },
    create: (flipAnim, scaleXAnim, scaleYAnim, rotateAnim) => ({
      flip: Animated.sequence([
        // Sleepy sway
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 3, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -3, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ),
        // Big yawn stretch!
        Animated.parallel([
          Animated.timing(scaleXAnim, { toValue: 0.85, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        // Release stretch
        Animated.parallel([
          Animated.timing(scaleXAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleYAnim, { toValue: 0.95, duration: 300, useNativeDriver: true }),
        ]),
        // Sleepy flip... zzz
        Animated.parallel([
          Animated.spring(scaleXAnim, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
          Animated.spring(scaleYAnim, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-3, 0, 3], outputRange: ['-3deg', '0deg', '3deg'] }),
        scaleX: scaleXAnim,
        scaleY: scaleYAnim,
      },
    }),
  },

  dizzyTwirl: {
    id: 'dizzyTwirl',
    name: 'Dizzy Twirl',
    description: 'Card spins around getting wonderfully dizzy!',
    emoji: '😵‍💫',
    rarity: 'epic',
    unlockRequirement: { type: 'purchase', price: 500 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Spin and wobble!
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 720, // Two full spins
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Wobble around while spinning
          Animated.sequence([
            Animated.timing(translateAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: 15, duration: 200, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: -10, duration: 200, useNativeDriver: true }),
          ]),
        ]),
        // Dizzy wobble slow down
        Animated.parallel([
          Animated.timing(rotateAnim, { toValue: 740, duration: 300, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 5, duration: 300, useNativeDriver: true }),
        ]),
        // Dizzy flip!
        Animated.parallel([
          Animated.spring(rotateAnim, { toValue: 720, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.spring(translateAnim, { toValue: 0, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [0, 720, 740], outputRange: ['0deg', '720deg', '740deg'] }),
        translateX: translateAnim,
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // 🎪 BOWLING ALLEY SPECIAL - Classic arcade vibes
  // ═══════════════════════════════════════════════════════════
  bowlingPinDodge: {
    id: 'bowlingPinDodge',
    name: 'Pin Dodge',
    description: 'Card dodges like a scared bowling pin!',
    emoji: '🎳',
    rarity: 'legendary',
    unlockRequirement: { type: 'purchase', price: 900 },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // Look scared! Wobble
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ),
        // DODGE LEFT!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -60, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -25, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        ]),
        // Phew... start to relax
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        // DODGE RIGHT! It's coming!
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 60, duration: 150, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 25, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        ]),
        // Okay okay center up
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        // Whew, made it! Celebratory flip!
        Animated.spring(flipAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-25, 0, 25], outputRange: ['-25deg', '0deg', '25deg'] }),
        translateX: translateAnim,
        scale: scaleAnim,
      },
    }),
  },

  strikeVictory: {
    id: 'strikeVictory',
    name: 'Strike Victory',
    description: 'Card celebrates like a victorious bowling pin!',
    emoji: '🏆',
    rarity: 'legendary',
    unlockRequirement: { type: 'achievement', value: 'readings_50' },
    create: (flipAnim, scaleAnim, rotateAnim, translateAnim) => ({
      flip: Animated.sequence([
        // ARMS UP! (scale wide)
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
        ]),
        // Victory dance! Side to side
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: 15, duration: 150, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
              Animated.timing(translateAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
            ]),
          ]),
          { iterations: 3 }
        ),
        // Big finish! Jump and flip
        Animated.parallel([
          Animated.timing(translateAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.spring(flipAnim, { toValue: 1, tension: 100, friction: 4, useNativeDriver: true }),
        ]),
        // Land triumphantly
        Animated.parallel([
          Animated.spring(translateAnim, { toValue: 0, tension: 60, friction: 5, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      interpolations: {
        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
        backRotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
        rotateZ: rotateAnim.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }),
        translateY: translateAnim,
        scale: scaleAnim,
      },
    }),
  },
};

// Get all animations as array for UI display
export const getAllFlipAnimations = () => Object.values(FLIP_ANIMATIONS);

// Get animations by rarity
export const getFlipAnimationsByRarity = (rarity) =>
  Object.values(FLIP_ANIMATIONS).filter(anim => anim.rarity === rarity);

// Get default animations
export const getDefaultFlipAnimations = () =>
  Object.values(FLIP_ANIMATIONS).filter(anim => anim.isDefault);

// Get purchasable animations
export const getPurchasableFlipAnimations = () =>
  Object.values(FLIP_ANIMATIONS).filter(anim =>
    anim.unlockRequirement?.type === 'purchase'
  );

// Animation helper - create all required Animated.Values for an animation
export const createAnimationValues = () => ({
  flipAnim: new Animated.Value(0),
  scaleAnim: new Animated.Value(1),
  scaleXAnim: new Animated.Value(1),
  scaleYAnim: new Animated.Value(1),
  rotateAnim: new Animated.Value(0),
  translateAnim: new Animated.Value(0),
  opacityAnim: new Animated.Value(1),
});

// Reset animation values
export const resetAnimationValues = (values) => {
  values.flipAnim.setValue(0);
  values.scaleAnim.setValue(1);
  values.scaleXAnim.setValue(1);
  values.scaleYAnim.setValue(1);
  values.rotateAnim.setValue(0);
  values.translateAnim.setValue(0);
  values.opacityAnim.setValue(1);
};

export default FLIP_ANIMATIONS;
