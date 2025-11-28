/**
 * Achievement Unlock - VeilPath WitchTok x Victorian Gothic
 * Dramatic celebration modal when user earns a badge
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';

// Import VeilPath Design System
import {
  COSMIC,
  VictorianCard,
} from './VeilPathDesign';

// Map achievement colors to COSMIC palette
const getAchievementColor = (colorName) => {
  const colorMap = {
    hiCyan: COSMIC.etherealCyan,
    hiMagenta: COSMIC.deepAmethyst,
    hiGreen: COSMIC.candleFlame,
    hiYellow: COSMIC.candleFlame,
    hiRed: COSMIC.crystalPink,
    dimCyan: COSMIC.etherealCyan,
    dimMagenta: COSMIC.deepAmethyst,
  };
  return colorMap[colorName] || COSMIC.candleFlame;
};

export default function AchievementUnlock({ achievement, visible, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Haptic feedback
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([0, 100, 50, 100]);
      }

      // Dramatic entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 0.9,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      glowAnim.stopAnimation();
      rotateAnim.stopAnimation();
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const badgeColor = getAchievementColor(achievement.color);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <VictorianCard style={styles.container} glowColor={badgeColor}>
          {/* Header */}
          <Text style={styles.header}>Achievement Unlocked</Text>

          {/* Badge */}
          <Animated.View
            style={[
              styles.badgeContainer,
              { transform: [{ scale: scaleAnim }, { rotate: rotation }] },
            ]}
          >
            <Animated.View
              style={[
                styles.badge,
                {
                  borderColor: badgeColor,
                  shadowColor: badgeColor,
                  shadowOpacity: glowAnim,
                },
              ]}
            >
              <Text style={[styles.icon, { color: badgeColor }]}>
                {achievement.icon}
              </Text>
            </Animated.View>

            {/* Tier indicator */}
            <View style={[styles.tierBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.tierText}>
                {achievement.tier.toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          {/* Achievement name */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text style={[styles.name, { color: badgeColor }]}>
              {achievement.name}
            </Text>
          </Animated.View>

          {/* Description */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text style={styles.description}>
              {achievement.description}
            </Text>
          </Animated.View>

          {/* Share button */}
          {achievement.shareWorthy && (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.shareButton, { borderColor: badgeColor }]}
                onPress={onClose}
              >
                <Text style={[styles.shareText, { color: badgeColor }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Continue button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </VictorianCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    padding: 32,
    alignItems: 'center',
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 28,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  badgeContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    backgroundColor: 'rgba(10, 5, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 20,
  },
  icon: {
    fontSize: 56,
  },
  tierBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  description: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    opacity: 0.9,
  },
  shareButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
});
