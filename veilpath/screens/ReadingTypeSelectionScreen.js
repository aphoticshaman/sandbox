/**
 * ReadingTypeSelectionScreen - Choose spread type for card reading
 * Shows available spreads with unlock requirements and previews
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ASSETS } from '../src/assets/CuratedAssets';
import { ProgressionSystem, SPREAD_UNLOCKS } from '../src/utils/ProgressionSystem';
import { CurrencyManager } from '../src/utils/CurrencyManager';
import { MainMenuAmbience } from '../src/components/AmbientEffects';
import { GlowingFrame } from '../src/components/OrnateFrame';

const SPREAD_CONFIGS = [
  {
    id: 'single_card',
    name: 'Single Card',
    description: 'Quick insight for immediate guidance. Perfect for daily reflections.',
    cardCount: 1,
    difficulty: 'Beginner',
    positions: ['Present Moment'],
    color: '#00F0FF',
    icon: '🎴',
  },
  {
    id: 'three_card',
    name: 'Three Card',
    description: 'Explore the flow of time. See where you\'ve been, where you are, and where you\'re headed.',
    cardCount: 3,
    difficulty: 'Intermediate',
    positions: ['Past', 'Present', 'Future'],
    color: '#9945FF',
    icon: '🔮',
  },
  {
    id: 'five_card',
    name: 'Five Card Cross',
    description: 'Deep dive into a situation. Uncover hidden influences and potential outcomes.',
    cardCount: 5,
    difficulty: 'Advanced',
    positions: ['Present', 'Challenge', 'Past', 'Future', 'Outcome'],
    color: '#FFD700',
    icon: '✨',
  },
  {
    id: 'celtic_cross',
    name: 'Celtic Cross',
    description: 'The ultimate spread. A comprehensive analysis of your question from all angles.',
    cardCount: 10,
    difficulty: 'Master',
    positions: [
      'Present', 'Challenge', 'Foundation', 'Recent Past',
      'Possible Future', 'Near Future', 'Self', 'Environment',
      'Hopes/Fears', 'Outcome'
    ],
    color: '#FF1493',
    icon: '🌟',
  },
];

export default function ReadingTypeSelectionScreen({ navigation }) {
  const [progression, setProgression] = useState(null);
  const [balance, setBalance] = useState({ moonlight: 0, veilShards: 0 });
  const [unlockStatus, setUnlockStatus] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initialize();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  async function initialize() {
    const prog = await ProgressionSystem.initialize();
    const bal = await CurrencyManager.getBalance();
    setProgression(prog);
    setBalance(bal);

    // Check unlock status for each spread
    const status = {};
    for (const spread of SPREAD_CONFIGS) {
      const canStart = await ProgressionSystem.canStartReading(spread.id);
      status[spread.id] = canStart;
    }
    setUnlockStatus(status);
  }

  function handleSelectSpread(spreadType) {
    navigation.navigate('CardReading', { spreadType });
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={ASSETS.backgrounds.cosmic_purple.path}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,15,0.8)', 'rgba(26,26,46,0.9)', 'rgba(10,10,15,0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient particles */}
        <MainMenuAmbience />

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Choose Your Spread</Text>

            <View style={styles.currencyDisplay}>
              <Text style={styles.currencyText}>🌙 {balance.moonlight}</Text>
            </View>
          </View>

          {/* Spread options */}
          <ScrollView
            contentContainerStyle={styles.spreadsContainer}
            showsVerticalScrollIndicator={false}
          >
            {SPREAD_CONFIGS.map((spread) => (
              <SpreadOption
                key={spread.id}
                spread={spread}
                unlockStatus={unlockStatus[spread.id]}
                progression={progression}
                onSelect={() => handleSelectSpread(spread.id)}
              />
            ))}

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

/**
 * Individual spread option card
 */
function SpreadOption({ spread, unlockStatus, progression, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isLocked = unlockStatus && !unlockStatus.canAccess;
  const isFree = unlockStatus && unlockStatus.isFree;
  const cost = unlockStatus ? unlockStatus.cost : 0;

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[styles.spreadCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={isLocked ? undefined : onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isLocked}
      >
        <LinearGradient
          colors={
            isLocked
              ? ['rgba(50, 50, 50, 0.8)', 'rgba(30, 30, 30, 0.9)']
              : ['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 15, 0.98)']
          }
          style={styles.spreadCardGradient}
        >
          {/* Lock overlay */}
          {isLocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>{unlockStatus?.reason}</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.spreadHeader}>
            <View style={styles.spreadTitleRow}>
              <Text style={styles.spreadIcon}>{spread.icon}</Text>
              <View style={styles.spreadTitleContainer}>
                <Text style={[styles.spreadName, { color: spread.color }]}>
                  {spread.name}
                </Text>
                <Text style={styles.spreadDifficulty}>{spread.difficulty}</Text>
              </View>
            </View>

            {/* Card count badge */}
            <View style={styles.cardCountBadge}>
              <Text style={styles.cardCountText}>{spread.cardCount} Cards</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.spreadDescription}>{spread.description}</Text>

          {/* Positions preview */}
          <View style={styles.positionsContainer}>
            <Text style={styles.positionsLabel}>Positions:</Text>
            <View style={styles.positionsList}>
              {spread.positions.slice(0, 5).map((position, index) => (
                <View key={index} style={styles.positionTag}>
                  <Text style={styles.positionTagText}>{position}</Text>
                </View>
              ))}
              {spread.positions.length > 5 && (
                <Text style={styles.positionsMore}>+{spread.positions.length - 5} more</Text>
              )}
            </View>
          </View>

          {/* Cost / Free badge */}
          <View style={styles.spreadFooter}>
            {isFree ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>✨ Daily Free Reading</Text>
              </View>
            ) : isLocked ? (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>
                  {unlockStatus?.gate === 'level'
                    ? `Level ${unlockStatus.required} Required`
                    : `${unlockStatus?.required || 0} Journal Entries`}
                </Text>
              </View>
            ) : (
              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>🌙 {cost} Moonlight</Text>
              </View>
            )}

            {!isLocked && (
              <View style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select →</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(138, 43, 226, 0.3)',
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.5)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 14,
    color: '#00F0FF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
    textShadowColor: '#9945FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  currencyDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  currencyText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  spreadsContainer: {
    padding: 20,
  },
  spreadCard: {
    marginBottom: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.4)',
    overflow: 'hidden',
    shadowColor: '#9945FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spreadCardGradient: {
    padding: 20,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  lockText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  spreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  spreadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  spreadIcon: {
    fontSize: 32,
  },
  spreadTitleContainer: {},
  spreadName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spreadDifficulty: {
    fontSize: 12,
    color: '#00F0FF',
    fontWeight: '600',
  },
  cardCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  cardCountText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  spreadDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 15,
  },
  positionsContainer: {
    marginBottom: 15,
  },
  positionsLabel: {
    fontSize: 12,
    color: '#9945FF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  positionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  positionTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  positionTagText: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: '600',
  },
  positionsMore: {
    fontSize: 11,
    color: '#9945FF',
    fontStyle: 'italic',
  },
  spreadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 100, 0.2)',
    borderWidth: 2,
    borderColor: '#00FF64',
  },
  freeBadgeText: {
    fontSize: 13,
    color: '#00FF64',
    fontWeight: 'bold',
  },
  costBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  costBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lockedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  lockedBadgeText: {
    fontSize: 12,
    color: '#DC143C',
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
