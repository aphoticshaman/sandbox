/**
 * InteractiveBackground - Hearthstone-style interactive background elements
 * Tap different areas to trigger animations, easter eggs, and hidden interactions
 */

import React, { useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Animated, StyleSheet } from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';
import * as Haptics from 'expo-haptics';

/**
 * Interactive hotspot that responds to taps
 */
function InteractiveHotspot({ x, y, size, onTap, children }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Ripple animation
    opacityAnim.setValue(1);
    scaleAnim.setValue(1);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 2,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger callback
    if (onTap) {
      onTap();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={[styles.hotspot, { left: x, top: y, width: size, height: size }]}>
        {/* Ripple effect */}
        <Animated.View
          style={[
            styles.ripple,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

/**
 * Sequence tracker for easter egg combos
 */
class SequenceTracker {
  constructor(sequence, onComplete, timeout = 3000) {
    this.targetSequence = sequence; // e.g. ['moon', 'sun', 'star', 'moon']
    this.currentSequence = [];
    this.onComplete = onComplete;
    this.timeout = timeout;
    this.timer = null;
  }

  tap(id) {
    // Add to sequence
    this.currentSequence.push(id);

    // Reset timer
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.currentSequence = [];
    }, this.timeout);

    // Check if sequence matches
    if (this.currentSequence.length > this.targetSequence.length) {
      this.currentSequence.shift(); // Remove oldest
    }

    if (this.sequenceMatches()) {
      this.onComplete();
      this.currentSequence = [];
    }
  }

  sequenceMatches() {
    if (this.currentSequence.length !== this.targetSequence.length) {
      return false;
    }
    return this.currentSequence.every((id, i) => id === this.targetSequence[i]);
  }
}

/**
 * Main interactive background component
 */
export default function InteractiveBackground({ onEasterEgg, children }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useSafeDimensions();
  const [tapCount, setTapCount] = useState(0);
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);

  // Create sequence tracker for easter egg
  const sequenceTrackerRef = useRef(
    new SequenceTracker(
      ['moon', 'star', 'sun', 'moon', 'star'], // Secret sequence
      () => {
        setEasterEggUnlocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (onEasterEgg) {
          onEasterEgg('secret_sequence');
        }
      }
    )
  );

  // Interactive hotspots positioned around screen
  const hotspots = [
    // Top area - celestial objects
    {
      id: 'moon',
      x: SCREEN_WIDTH * 0.15,
      y: SCREEN_HEIGHT * 0.12,
      size: 60,
      effect: 'Moon glows',
    },
    {
      id: 'star',
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT * 0.08,
      size: 50,
      effect: 'Star twinkles',
    },
    {
      id: 'sun',
      x: SCREEN_WIDTH * 0.85,
      y: SCREEN_HEIGHT * 0.15,
      size: 70,
      effect: 'Sun pulses',
    },

    // Middle area - mystical elements
    {
      id: 'crystal',
      x: SCREEN_WIDTH * 0.1,
      y: SCREEN_HEIGHT * 0.45,
      size: 80,
      effect: 'Crystal sparkles',
    },
    {
      id: 'flame',
      x: SCREEN_WIDTH * 0.9,
      y: SCREEN_HEIGHT * 0.5,
      size: 70,
      effect: 'Flame flickers',
    },

    // Bottom area - hidden spots
    {
      id: 'rune',
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT * 0.85,
      size: 60,
      effect: 'Rune glows',
    },
  ];

  const handleHotspotTap = (id) => {
    setTapCount(prev => prev + 1);
    sequenceTrackerRef.current.tap(id);

    // Random chance to trigger special effect
    if (Math.random() < 0.15 && onEasterEgg) {
      onEasterEgg(`tap_${id}`);
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Interactive hotspots (invisible) */}
      {hotspots.map(hotspot => (
        <InteractiveHotspot
          key={hotspot.id}
          x={hotspot.x}
          y={hotspot.y}
          size={hotspot.size}
          onTap={() => handleHotspotTap(hotspot.id)}
        />
      ))}

      {/* Easter egg indicator (subtle) */}
      {easterEggUnlocked && (
        <View style={styles.easterEggIndicator}>
          <Animated.Text style={styles.easterEggText}>✨</Animated.Text>
        </View>
      )}

      {children}
    </View>
  );
}

/**
 * Swipeable background element (e.g. curtain, banner)
 */
export function SwipeableElement({ onSwipeRight, onSwipeLeft, children }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [gestureStartX, setGestureStartX] = useState(0);

  const handleGestureStart = (event) => {
    setGestureStartX(event.nativeEvent.pageX);
  };

  const handleGestureMove = (event) => {
    const currentX = event.nativeEvent.pageX;
    const diff = currentX - gestureStartX;
    translateX.setValue(diff);
  };

  const handleGestureEnd = (event) => {
    const currentX = event.nativeEvent.pageX;
    const diff = currentX - gestureStartX;

    if (Math.abs(diff) > 100) {
      // Swipe detected
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    // Reset position
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.swipeableElement, { transform: [{ translateX }] }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleGestureStart}
      onResponderMove={handleGestureMove}
      onResponderRelease={handleGestureEnd}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Tappable animated element (e.g. torch, candle, crystal)
 */
export function TappableElement({ x, y, size, animation = 'pulse', children, onTap }) {
  const animValue = useRef(new Animated.Value(1)).current;

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (animation === 'pulse') {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (animation === 'shake') {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (onTap) {
      onTap();
    }
  };

  const animStyle = animation === 'pulse'
    ? { transform: [{ scale: animValue }] }
    : { transform: [{ translateX: animValue }] };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View
        style={[
          styles.tappableElement,
          { left: x, top: y, width: size, height: size },
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  hotspot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Invisible by default - just a tap target
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.5)',
  },
  easterEggIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  easterEggText: {
    fontSize: 24,
  },
  swipeableElement: {
    position: 'absolute',
  },
  tappableElement: {
    position: 'absolute',
  },
});
