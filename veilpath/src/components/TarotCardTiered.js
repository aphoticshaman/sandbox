/**
 * TarotCardTiered Component
 * Renders a tarot card with support for three tiers: common, rare, artifact
 * Handles animations, glow effects, and video playback for artifacts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardAssetSource, getCardData } from '../utils/CardAssetLoader';
import { COSMIC } from './VeilPathDesign';

const CARD_ASPECT = 2 / 3; // height / width
const DEFAULT_CARD_WIDTH = 150; // Default card width in pixels

const TarotCardTiered = ({
  cardId,
  tier = 'common',
  onPress,
  style,
  showGlow = true,
  autoPlayVideo = true,
  width = DEFAULT_CARD_WIDTH
}) => {
  const [assetSource, setAssetSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadAsset();
  }, [cardId, tier]);

  useEffect(() => {
    if (showGlow && tier !== 'common') {
      startGlowAnimation();
    }
  }, [showGlow, tier]);

  const loadAsset = async () => {
    setIsLoading(true);
    try {
      const source = getCardAssetSource(cardId, tier);
      setAssetSource(source);
    } catch (error) {
      console.error('Failed to load card asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const getTierColors = () => {
    switch (tier) {
      case 'artifact':
        return {
          glow: [COSMIC.deepAmethyst, COSMIC.candleFlame, COSMIC.crystalPink],
          border: COSMIC.candleFlame
        };
      case 'rare':
        return {
          glow: [COSMIC.deepAmethyst, COSMIC.etherealCyan, COSMIC.shadowPurple],
          border: COSMIC.etherealCyan
        };
      default:
        return {
          glow: ['#FFFFFF', '#F5F5F5', '#FFFFFF'],
          border: '#CCCCCC'
        };
    }
  };

  const colors = getTierColors();
  const cardData = getCardData(cardId);
  const height = width * CARD_ASPECT;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  if (isLoading || !assetSource) {
    return (
      <View style={[styles.container, style, { width, height }]}>
        <View style={[styles.placeholder, { borderColor: colors.border }]} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.container,
          style,
          {
            width,
            height,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Glow effect for rare/artifact */}
        {showGlow && tier !== 'common' && (
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowOpacity
              }
            ]}
          >
            <LinearGradient
              colors={colors.glow}
              style={styles.glowGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        )}

        {/* Card border */}
        <View
          style={[
            styles.cardBorder,
            {
              borderColor: colors.border,
              borderWidth: tier === 'artifact' ? 3 : tier === 'rare' ? 2 : 1
            }
          ]}
        >
          {/* Artifact tier: Video */}
          {tier === 'artifact' && assetSource.isVideo ? (
            <Video
              ref={videoRef}
              source={assetSource.uri}
              style={styles.cardImage}
              resizeMode="cover"
              shouldPlay={autoPlayVideo}
              isLooping
              isMuted
            />
          ) : (
            /* Common/Rare tier: Static image */
            <Image
              source={assetSource}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Tier indicator badge - using text instead of missing image assets */}
        {tier !== 'common' && (
          <View style={[styles.tierBadge, { backgroundColor: colors.border }]}>
            <View style={styles.tierBadgeInner}>
              <Text style={styles.tierBadgeText}>
                {tier === 'artifact' ? 'A' : 'R'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1A1A1A'
  },
  glowContainer: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 16,
    zIndex: 0
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16
  },
  cardBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    zIndex: 1
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5
  },
  tierBadgeInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tierBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  }
});

export default TarotCardTiered;
