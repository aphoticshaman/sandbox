/**
 * TarotCard Component
 * Displays a tarot card with animated flip, reversed state, and glow effects
 * Supports both PNG images and MP4 video loops for artifact tier
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { THEME } from '../theme/theme';
import { getCardImage, getCardBack } from '../assets/cardImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * TarotCard Component
 *
 * @param {Object} props
 * @param {Object} props.card - Card object from tarotDeckAdapter
 * @param {boolean} props.isReversed - Is card reversed?
 * @param {boolean} props.showBack - Show card back (for unrevealed cards)
 * @param {Function} props.onPress - Press handler
 * @param {string} props.size - 'sm' | 'md' | 'lg' | 'full'
 * @param {boolean} props.showName - Show card name below image
 * @param {boolean} props.interactive - Enable press interaction
 * @param {Object} props.style - Custom styles
 * @param {any} props.imageOverride - Override card.image with tiered asset
 * @param {string} props.assetType - 'png' | 'mp4' for tiered assets
 * @param {string} props.tier - 'common' | 'rare' | 'artifact'
 * @param {any} props.cardBackSource - Custom card back image source from cosmetics
 */
export function TarotCard({
  card,
  isReversed = false,
  showBack = false,
  onPress,
  size = 'md',
  showName = false,
  interactive = true,
  style,
  imageOverride = null,
  assetType = 'png',
  tier = 'common',
  cardBackSource = null,
}) {
  const [revealed, setRevealed] = useState(!showBack);
  const flipAnimation = useRef(new Animated.Value(showBack ? 0 : 1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // Card dimensions based on size
  const dimensions = getCardDimensions(size);

  // Animate flip when revealed changes
  useEffect(() => {
    if (revealed) {
      Animated.spring(flipAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [revealed, flipAnimation]);

  const handlePress = () => {
    if (!interactive) return;

    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (showBack && !revealed) {
      setRevealed(true);
    }

    if (onPress) {
      onPress(card, isReversed);
    }
  };

  // Get the actual image source
  // Priority: imageOverride > registry lookup > card.image fallback
  const getResolvedCardImage = () => {
    if (imageOverride) return imageOverride;

    // Try to get from registry using card id
    const cardId = card.id || card.name?.toLowerCase().replace(/\s+/g, '').replace('the', '');
    if (cardId) {
      const variant = tier === 'rare' ? 'rare' : 'common';
      const registryImage = getCardImage(cardId, variant);
      if (registryImage) return registryImage;
    }

    // Fallback to card.image if set
    return card.image || null;
  };

  const cardImageSource = getResolvedCardImage();

  // Render card front based on asset type (PNG or MP4)
  // When reversed, only the image/video is rotated, not text overlays
  const renderCardFront = () => {
    // Reversed style applied only to the image, not the entire card
    const reversedImageStyle = isReversed ? styles.reversed : null;

    if (!cardImageSource) {
      // Placeholder when no card image - show card back with name overlay
      return (
        <View style={[styles.placeholderContainer, imageStyle, reversedImageStyle]}>
          <Image
            source={getCardBack()}
            style={[styles.cardBackImage, imageStyle, { opacity: 0.6 }]}
            resizeMode="cover"
          />
          <View style={styles.placeholderOverlay}>
            <Text style={styles.placeholderText}>{card.name}</Text>
          </View>
        </View>
      );
    }

    // MP4 Video for artifact tier
    if (assetType === 'mp4' && Platform.OS === 'web') {
      return (
        <Video
          source={cardImageSource}
          style={[styles.image, imageStyle, reversedImageStyle]}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={revealed}
          isMuted
          useNativeControls={false}
        />
      );
    }

    // PNG Image (common/rare tier, or mobile)
    return (
      <Image
        source={cardImageSource}
        style={[styles.image, imageStyle, reversedImageStyle]}
        resizeMode="cover"
      />
    );
  };

  // Interpolate flip animation
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: frontInterpolate },
      { scale: scaleAnimation },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      { rotateY: backInterpolate },
      { scale: scaleAnimation },
    ],
  };

  const cardStyle = [
    styles.card,
    {
      width: dimensions.width,
      height: dimensions.height,
    },
    // Note: isReversed rotation is now applied only to the image, not the whole card
  ];

  const imageStyle = {
    width: dimensions.width,
    height: dimensions.height,
  };

  return (
    <View style={[cardStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={interactive ? 0.8 : 1}
        disabled={!interactive}
        style={styles.touchable}
      >
        {/* Card Back (visible when unrevealed, hidden when flipped) */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBackContainer,
            imageStyle,
            frontAnimatedStyle,
            { backfaceVisibility: 'hidden' },
          ]}
        >
          <Image
            source={cardBackSource || getCardBack()}
            style={[styles.cardBackImage, imageStyle]}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Card Front (hidden when unrevealed, visible when flipped) */}
        <Animated.View
          style={[
            styles.cardFace,
            imageStyle,
            backAnimatedStyle,
            { backfaceVisibility: 'hidden' },
          ]}
        >
          {renderCardFront()}

          {/* Glow effect for elevated cards - enhanced for rare/artifact */}
          {(size === 'lg' || size === 'full') && revealed && (
            <View style={[
              styles.glow,
              imageStyle,
              tier === 'rare' && styles.rareGlow,
              tier === 'artifact' && styles.artifactGlow,
            ]} />
          )}

          {/* Tier badge for rare/artifact */}
          {tier !== 'common' && revealed && (
            <View style={[styles.tierBadge, tier === 'artifact' && styles.artifactBadge]}>
              <Text style={styles.tierBadgeText}>
                {tier === 'artifact' ? '✦ ARTIFACT' : '★ RARE'}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Card Name */}
      {showName && revealed && (
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{card.name}</Text>
          {isReversed && <Text style={styles.reversedLabel}>(Reversed)</Text>}
        </View>
      )}
    </View>
  );
}

/**
 * Get card dimensions based on size
 */
function getCardDimensions(size) {
  const CARD_ASPECT_RATIO = 0.5625; // 9:16

  switch (size) {
    case 'sm':
      return { width: 80, height: 80 / CARD_ASPECT_RATIO }; // ~142px
    case 'md':
      return { width: 120, height: 120 / CARD_ASPECT_RATIO }; // ~213px
    case 'lg':
      return { width: 180, height: 180 / CARD_ASPECT_RATIO }; // ~320px
    case 'full':
      const fullWidth = Math.min(SCREEN_WIDTH * 0.7, 300);
      return { width: fullWidth, height: fullWidth / CARD_ASPECT_RATIO };
    default:
      return { width: 120, height: 120 / CARD_ASPECT_RATIO };
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.sm,
    ...THEME.shadows.md,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: THEME.borderRadius.sm,
  },
  cardBackContainer: {
    // Back is positioned absolutely for flip animation
  },
  image: {
    borderRadius: THEME.borderRadius.sm,
  },
  cardBackImage: {
    borderRadius: THEME.borderRadius.sm,
  },
  reversed: {
    transform: [{ rotate: '180deg' }],
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: THEME.borderRadius.sm,
    ...THEME.shadows.glow.purple,
  },
  nameContainer: {
    marginTop: THEME.spacing[2],
    alignItems: 'center',
  },
  name: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
  },
  reversedLabel: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.accent[400],
    fontStyle: 'italic',
    marginTop: THEME.spacing[1],
  },
  placeholderContainer: {
    position: 'relative',
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.5)',
    borderRadius: THEME.borderRadius.sm,
  },
  placeholderText: {
    color: '#E1BEE7',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Rare tier glow (cyan)
  rareGlow: {
    shadowColor: '#00FFFF',
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  // Artifact tier glow (gold)
  artifactGlow: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  // Tier badge
  tierBadge: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -35 }],
    backgroundColor: 'rgba(0, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  artifactBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
  },
  tierBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default TarotCard;
