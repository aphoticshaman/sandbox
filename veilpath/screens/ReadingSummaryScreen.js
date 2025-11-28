/**
 * ReadingSummaryScreen - Shows complete reading with all cards, synthesis, and rewards
 * Displays cards in proper spread formation with overall interpretation
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
  ActivityIndicator,
} from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ASSETS } from '../src/assets/CuratedAssets';
import { GlowingFrame } from '../src/components/OrnateFrame';
import TarotCard from '../src/components/TarotCard';
import SpreadMiniMap from '../src/components/SpreadMiniMap';
import { MainMenuAmbience } from '../src/components/AmbientEffects';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lunatiq-tarot.vercel.app';

export default function ReadingSummaryScreen({ navigation, route }) {
  const { width, height } = useSafeDimensions();
  const CARD_WIDTH = width * 0.35;
  const CARD_HEIGHT = CARD_WIDTH * 1.5;

  const {
    drawnCards = [],
    interpretations = [],
    intention = '',
    spreadType = 'single_card',
    rewards = { moonlight: 0, xp: 0 },
    progression = { level: 1, xp: 0 },
    balance = { moonlight: 0, veilShards: 0 },
  } = route.params || {};

  const [synthesis, setSynthesis] = useState('');
  const [keyThemes, setKeyThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rewardsPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchSynthesis();
    animateEntrance();
    pulseRewards();
  }, []);

  async function fetchSynthesis() {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/synthesize-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: drawnCards.map(c => ({
            name: c.name,
            position: c.position,
            reversed: c.reversed,
          })),
          intention,
          spreadType,
          interpretations: interpretations.map(i => i.interpretation),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSynthesis(result.data.synthesis);
        setKeyThemes(result.data.keyThemes || []);
      } else {
        // Fallback synthesis
        setSynthesis(
          `Your ${getSpreadName(spreadType)} reading reveals a journey of transformation. ` +
          `The cards speak to ${intention.toLowerCase()}. ` +
          `Reflect on these insights and let them guide your path forward.`
        );
        setKeyThemes(['Transformation', 'Insight', 'Growth']);
      }
    } catch (error) {
      console.error('[ReadingSummary] Synthesis error:', error);
      setSynthesis('The cards have spoken. Trust your intuition as you move forward.');
      setKeyThemes(['Intuition', 'Trust', 'Journey']);
    } finally {
      setIsLoading(false);
    }
  }

  function animateEntrance() {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }

  function pulseRewards() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rewardsPulse, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rewardsPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  async function handleSaveToJournal() {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const journalEntry = {
      id: Date.now().toString(),
      text: `## ${getSpreadName(spreadType)} Reading\n\n**Intention:** ${intention}\n\n**Cards Drawn:**\n${drawnCards
        .map((c, i) => `${i + 1}. ${c.name}${c.reversed ? ' (Reversed)' : ''} - ${c.position}`)
        .join('\n')}\n\n**Overall Message:**\n${synthesis}\n\n**Key Themes:** ${keyThemes.join(', ')}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      type: 'reading_summary',
      spreadType,
      cards: drawnCards.map(c => c.name),
    };

    const JOURNAL_KEY = '@lunatiq_journal_entries';
    try {
      const data = await AsyncStorage.getItem(JOURNAL_KEY);
      const entries = data ? JSON.parse(data) : [];
      entries.unshift(journalEntry);
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSaving(false);

      // Navigate to journal
      setTimeout(() => {
        navigation.navigate('Journal');
      }, 300);
    } catch (error) {
      console.error('[ReadingSummary] Journal save error:', error);
      setIsSaving(false);
    }
  }

  function getSpreadName(type) {
    const names = {
      single_card: 'Single Card',
      three_card: 'Three Card',
      five_card: 'Five Card Cross',
      celtic_cross: 'Celtic Cross',
    };
    return names[type] || 'Card';
  }

  function renderSpreadLayout() {
    const positions = getCardPositions(spreadType, drawnCards.length);

    return (
      <View style={styles.spreadLayout}>
        {drawnCards.map((card, index) => {
          const pos = positions[index];
          return (
            <View
              key={index}
              style={[
                styles.cardPosition,
                {
                  left: pos.x,
                  top: pos.y,
                  transform: [{ rotate: `${pos.rotation || 0}deg` }],
                },
              ]}
            >
              <TarotCard
                cardId={`card_${card.id}`}
                cardData={{
                  name: card.name,
                  image: ASSETS.cards.back.path, // TODO: Use actual card images
                  suit: card.suit,
                  arcana: card.arcana,
                }}
                rarity="common"
                size="small"
              />
              <Text style={styles.positionLabel}>{card.position}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  function getCardPositions(spreadType, cardCount) {
    const centerX = width / 2 - CARD_WIDTH / 2;
    const spacing = CARD_WIDTH + 15;

    switch (spreadType) {
      case 'single_card':
        return [{ x: centerX, y: 20 }];

      case 'three_card':
        const startX = width / 2 - spacing * 1.5 + CARD_WIDTH / 2;
        return [
          { x: startX, y: 40 },
          { x: startX + spacing, y: 40 },
          { x: startX + spacing * 2, y: 40 },
        ];

      case 'five_card':
        const crossX = width / 2 - CARD_WIDTH / 2;
        return [
          { x: crossX, y: 20 },
          { x: crossX - spacing, y: 20 + CARD_HEIGHT + 20 },
          { x: crossX, y: 20 + CARD_HEIGHT + 20 },
          { x: crossX + spacing, y: 20 + CARD_HEIGHT + 20 },
          { x: crossX, y: 20 + (CARD_HEIGHT + 20) * 2 },
        ];

      case 'celtic_cross':
        const baseX = 20;
        const baseY = 20;
        return [
          { x: baseX + spacing, y: baseY + CARD_HEIGHT },
          { x: baseX + spacing, y: baseY + CARD_HEIGHT, rotation: 90 },
          { x: baseX + spacing, y: baseY },
          { x: baseX, y: baseY + CARD_HEIGHT },
          { x: baseX + spacing, y: baseY + CARD_HEIGHT * 2 },
          { x: baseX + spacing * 2, y: baseY + CARD_HEIGHT },
          { x: baseX + spacing * 3, y: baseY + CARD_HEIGHT * 2.5 },
          { x: baseX + spacing * 3, y: baseY + CARD_HEIGHT * 1.8 },
          { x: baseX + spacing * 3, y: baseY + CARD_HEIGHT * 1.1 },
          { x: baseX + spacing * 3, y: baseY + CARD_HEIGHT * 0.4 },
        ];

      default:
        return Array(cardCount)
          .fill(0)
          .map((_, i) => ({ x: centerX, y: 20 + i * (CARD_HEIGHT + 30) }));
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={ASSETS.backgrounds.cosmic_nebula.path}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,15,0.7)', 'rgba(26,26,46,0.85)', 'rgba(10,10,15,0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient particles */}
        <MainMenuAmbience />

        {/* Mini-map HUD */}
        <SpreadMiniMap
          spreadType={spreadType}
          totalCards={drawnCards.length}
          currentIndex={-1}
          revealedCount={drawnCards.length}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getSpreadName(spreadType)} Reading</Text>
        </View>

        <Animated.View style={[styles.scrollContainer, { opacity: fadeAnim }]}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Cards in spread layout */}
            {renderSpreadLayout()}

            {/* Synthesis section */}
            <View style={styles.synthesisSection}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#8a2be2" />
                  <Text style={styles.loadingText}>Weaving the threads of fate...</Text>
                </View>
              ) : (
                <GlowingFrame width={width - 40} style={styles.glowingFrame}>
                  <Text style={styles.synthesisTitle}>The Cards Speak</Text>
                  <Text style={styles.synthesisText}>{synthesis}</Text>

                  {/* Key themes */}
                  {keyThemes.length > 0 && (
                    <View style={styles.themesContainer}>
                      <Text style={styles.themesLabel}>Key Themes:</Text>
                      <View style={styles.themesList}>
                        {keyThemes.map((theme, index) => (
                          <View key={index} style={styles.themeBadge}>
                            <Text style={styles.themeText}>{theme}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </GlowingFrame>
              )}
            </View>

            {/* Rewards display */}
            <Animated.View
              style={[styles.rewardsSection, { transform: [{ scale: rewardsPulse }] }]}
            >
              <LinearGradient
                colors={['rgba(138, 43, 226, 0.4)', 'rgba(153, 69, 255, 0.3)']}
                style={styles.rewardsContainer}
              >
                <Text style={styles.rewardsTitle}>Rewards Earned</Text>
                <View style={styles.rewardsGrid}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>🌙</Text>
                    <Text style={styles.rewardAmount}>+{rewards.moonlight}</Text>
                    <Text style={styles.rewardLabel}>Moonlight</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>⭐</Text>
                    <Text style={styles.rewardAmount}>+{rewards.xp}</Text>
                    <Text style={styles.rewardLabel}>XP</Text>
                  </View>
                </View>

                {/* Level progress bar */}
                <View style={styles.levelProgress}>
                  <Text style={styles.levelText}>Level {progression.level}</Text>
                  <View style={styles.xpBar}>
                    <View
                      style={[
                        styles.xpBarFill,
                        { width: `${(progression.xp % 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Action buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveToJournal}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9945FF', '#7B3FD4']}
                  style={styles.buttonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>📖</Text>
                      <Text style={styles.buttonText}>Save to Journal</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate('MainMenu')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00F0FF', '#0099CC']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Return to Menu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Spacer */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </ImageBackground>
    </View>
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#9945FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  spreadLayout: {
    position: 'relative',
    width: '100%',
    minHeight: 300,
    marginBottom: 30,
  },
  cardPosition: {
    position: 'absolute',
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: 10,
    color: '#00F0FF',
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  synthesisSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  glowingFrame: {
    marginVertical: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8a2be2',
    marginTop: 15,
    fontStyle: 'italic',
  },
  synthesisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#9945FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  synthesisText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  themesContainer: {
    marginTop: 15,
    width: '100%',
  },
  themesLabel: {
    fontSize: 14,
    color: '#00F0FF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  themesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  themeBadge: {
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  themeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rewardsSection: {
    marginBottom: 30,
  },
  rewardsContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#8a2be2',
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF64',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
  levelProgress: {
    width: '100%',
  },
  levelText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 4,
  },
  actionsSection: {
    gap: 15,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
