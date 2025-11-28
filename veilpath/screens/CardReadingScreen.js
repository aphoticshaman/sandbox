/**
 * CARD READING SCREEN
 * Gamified tarot reading with progression, gating, and engagement hooks
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressionSystem, SPREAD_UNLOCKS } from '../src/utils/ProgressionSystem';
import { CurrencyManager } from '../src/utils/CurrencyManager';
import { MAJOR_ARCANA } from '../data/tarotDeck';
import TarotCardFlip from '../src/components/TarotCardFlip';
import SpreadMiniMap from '../src/components/SpreadMiniMap';
import CardShuffleAnimation from '../src/components/CardShuffleAnimation';
import { ASSETS } from '../src/assets/CuratedAssets';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lunatiq-tarot.vercel.app';

export default function CardReadingScreen({ navigation, route }) {
  const { width } = useSafeDimensions();
  const { spreadType = 'single_card' } = route.params || {};

  const [step, setStep] = useState('gate_check'); // gate_check, intention, drawing, interpreting, reflection, rewards
  const [intention, setIntention] = useState('');
  const [drawnCards, setDrawnCards] = useState([]);
  const [interpretations, setInterpretations] = useState([]);
  const [narration, setNarration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progression, setProgression] = useState(null);
  const [balance, setBalance] = useState({ moonlight: 0, veilShards: 0 });
  const [gateStatus, setGateStatus] = useState(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // For multi-card spreads
  const [showNextCardButton, setShowNextCardButton] = useState(false); // Show "Next Card" button
  const [showFinalNarration, setShowFinalNarration] = useState(false); // Show final reading narration
  const [isShuffling, setIsShuffling] = useState(true); // Show shuffle animation

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const prog = await ProgressionSystem.initialize();
    const bal = await CurrencyManager.getBalance();
    setProgression(prog);
    setBalance(bal);

    // Check if user can access this spread
    const canStart = await ProgressionSystem.canStartReading(spreadType);
    setGateStatus(canStart);

    if (canStart.canAccess) {
      // Get opening narration from Luna/Sol
      await fetchNarration('reading_start', { spreadType, intention: '' });
      setStep('intention');
    } else {
      setStep('gate_check');
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }

  async function fetchNarration(moment, context = {}) {
    try {
      const narrator = progression?.level % 2 === 0 ? 'luna' : 'sol'; // Alternate based on level
      const response = await fetch(`${API_BASE_URL}/api/narrate/${narrator}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moment, context })
      });

      const result = await response.json();
      if (result.success) {
        setNarration(result.data.narration);
      }
    } catch (error) {
      console.error('[Reading] Narration error:', error);
      // Fallback narration
      if (moment === 'reading_start') {
        setNarration('Welcome, seeker. Let us begin your journey into the cards...');
      }
    }
  }

  async function handleStartReading() {
    if (intention.trim().length < 10) {
      Alert.alert('Intention Required', 'Please describe what brings you to the cards today (at least 10 characters)');
      return;
    }

    // Deduct currency if not free
    if (!gateStatus.isFree) {
      if (gateStatus.cost > 0) {
        await CurrencyManager.spendMoonlight(gateStatus.cost, 'reading_cost');
      }
      if (gateStatus.veilCost > 0) {
        await CurrencyManager.spendVeilShards(gateStatus.veilCost, 'reading_cost');
      }
      const newBalance = await CurrencyManager.getBalance();
      setBalance(newBalance);
    }

    setStep('drawing');
    await drawCards();
  }

  async function drawCards() {
    setIsLoading(true);
    setIsShuffling(true);

    // Wait for shuffle animation to complete
    // (shuffle animation duration is 2500ms + onComplete delay)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Determine number of cards based on spread
    const spreadConfig = {
      single_card: 1,
      three_card: 3,
      five_card: 5,
      celtic_cross: 10,
    };

    const numCards = spreadConfig[spreadType] || 1;
    const cards = [];

    for (let i = 0; i < numCards; i++) {
      const randomCard = MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
      const isReversed = Math.random() < 0.33;
      cards.push({
        ...randomCard,
        reversed: isReversed,
        position: getPositionName(spreadType, i)
      });
    }

    setDrawnCards(cards);
    setIsLoading(false);

    // Narrate first card drawn
    await fetchNarration('card_drawn', {
      cardName: cards[0].name,
      cardCount: 1
    });

    setStep('interpreting');
    await getInterpretations(cards);
  }

  async function getInterpretations(cards) {
    setIsLoading(true);
    const interps = [];

    try {
      for (const card of cards) {
        const response = await fetch(`${API_BASE_URL}/api/interpret-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card: {
              id: card.id,
              name: card.name,
              arcana: card.arcana,
            },
            context: {
              intention: intention,
              reversed: card.reversed,
              position: card.position,
              spreadType: spreadType
            }
          })
        });

        const result = await response.json();
        if (result.success) {
          interps.push({
            card: card.name,
            interpretation: result.data.interpretation
          });
        } else {
          // Fallback
          interps.push({
            card: card.name,
            interpretation: card.reversed ? card.reversed.message : card.upright.message
          });
        }
      }

      setInterpretations(interps);

      setIsLoading(false);

      // Navigate to ReadingSummaryScreen with all data
      navigation.navigate('ReadingSummary', {
        drawnCards: cards,
        interpretations: interps,
        intention,
        spreadType,
        rewards: {
          moonlight: 50, // TODO: Calculate based on spread type
          xp: 100,
        },
        progression: await ProgressionSystem.initialize(),
        balance: await CurrencyManager.getBalance(),
      });

    } catch (error) {
      console.error('[Reading] Interpretation error:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to get interpretation. Please try again.');
    }
  }

  async function handleSkipReflection() {
    await completeReading(false, false);
  }

  async function handleSubmitReflection() {
    if (reflectionAnswer.trim().length < 20) {
      Alert.alert('Reflection Too Short', 'Share at least 20 characters about your insights.');
      return;
    }

    // Save reflection to journal
    const journalEntry = {
      id: Date.now().toString(),
      text: `Reading: ${drawnCards.map(c => c.name).join(', ')}\n\nIntention: ${intention}\n\nReflection: ${reflectionAnswer}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      type: 'reading_reflection'
    };

    const JOURNAL_KEY = '@lunatiq_journal_entries';
    try {
      const data = await AsyncStorage.getItem(JOURNAL_KEY);
      const entries = data ? JSON.parse(data) : [];
      entries.unshift(journalEntry);
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('[Reading] Journal save error:', error);
    }

    await completeReading(true, true);
  }

  async function completeReading(journaled, reflected) {
    const result = await ProgressionSystem.completeReading(spreadType, journaled, reflected);

    // Refresh progression and balance
    const newProg = ProgressionSystem.getProgression();
    const newBal = await CurrencyManager.getBalance();
    setProgression(newProg);
    setBalance(newBal);

    setStep('rewards');

    // Show reward notification
    let rewardMessage = `+${result.rewards.moonlight} Moonlight\n+${result.rewards.xp} XP`;

    if (result.rewards.journalXP) {
      rewardMessage += `\n+${result.rewards.journalXP} XP (Journal Bonus)`;
    }
    if (result.rewards.reflectionXP) {
      rewardMessage += `\n+${result.rewards.reflectionXP} XP (Reflection Bonus)`;
    }
    if (result.rewards.streakBonus) {
      rewardMessage += `\n+${result.rewards.streakBonus} Moonlight (Streak Bonus!)`;
    }

    if (result.leveledUp) {
      Alert.alert(
        `🎉 Level ${result.newLevel}!`,
        `You've leveled up!\n\n${rewardMessage}${result.reward?.unlock ? `\n\nUnlocked: ${SPREAD_UNLOCKS[result.reward.unlock]?.name}` : ''}`,
        [{ text: 'Awesome!' }]
      );
    }
  }

  function getPositionName(spread, index) {
    const positions = {
      three_card: ['Past', 'Present', 'Future'],
      five_card: ['Present', 'Challenge', 'Past', 'Future', 'Outcome'],
      celtic_cross: ['Present', 'Challenge', 'Foundation', 'Recent Past', 'Possible Future', 'Near Future', 'Self', 'Environment', 'Hopes/Fears', 'Outcome']
    };
    return positions[spread]?.[index] || `Card ${index + 1}`;
  }

  // RENDER: Gate Check Screen
  if (step === 'gate_check' && gateStatus && !gateStatus.canAccess) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />
        <View style={styles.gateContainer}>
          <Text style={styles.gateTitle}>🔒 Locked</Text>
          <Text style={styles.gateSpreadName}>{SPREAD_UNLOCKS[spreadType]?.name}</Text>
          <Text style={styles.gateReason}>{gateStatus.reason}</Text>

          {gateStatus.gate === 'level' && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Progress: Level {gateStatus.current} / {gateStatus.required}
              </Text>
            </View>
          )}

          {gateStatus.gate === 'journal' && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Journal Entries: {gateStatus.current} / {gateStatus.required}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Journal')}
              >
                <Text style={styles.actionButtonText}>Open Journal</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // RENDER: Intention Input Screen
  if (step === 'intention') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{SPREAD_UNLOCKS[spreadType]?.name}</Text>
          <View style={styles.currencyDisplay}>
            <Text style={styles.currencyText}>🌙 {balance.moonlight}</Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Narration */}
          <View style={styles.narrationBox}>
            <Text style={styles.narrationText}>{narration}</Text>
          </View>

          {/* Intention prompt */}
          <View style={styles.intentionSection}>
            <Text style={styles.intentionPrompt}>What question weighs upon your soul?</Text>
            <TextInput
              style={styles.intentionInput}
              placeholder="What guidance do you seek from the cards?"
              placeholderTextColor="#666"
              value={intention}
              onChangeText={setIntention}
              multiline
              maxLength={200}
              autoFocus
            />
            <Text style={styles.charCount}>{intention.length} / 200 (min 10)</Text>

            {!gateStatus?.isFree && (
              <View style={styles.costDisplay}>
                <Text style={styles.costText}>
                  Cost: {gateStatus?.cost || 0} Moonlight
                  {gateStatus?.veilCost > 0 && ` + ${gateStatus.veilCost} Veil Shards`}
                </Text>
              </View>
            )}

            {gateStatus?.isFree && (
              <View style={styles.freeDisplay}>
                <Text style={styles.freeText}>✨ Daily Free Reading</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.continueButton, intention.length < 10 && styles.continueButtonDisabled]}
              onPress={handleStartReading}
              disabled={intention.length < 10}
            >
              <LinearGradient
                colors={intention.length >= 10 ? ['#8a2be2', '#6a1bb2'] : ['#444', '#333']}
                style={styles.continueGradient}
              >
                <Text style={styles.continueButtonText}>Begin Reading</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  // RENDER: Drawing Cards
  if (step === 'drawing' || step === 'interpreting') {
    const cardPositions = getSpreadCardPositions(spreadType, drawnCards.length);

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />

        {/* Mini-map HUD showing spread progress (only after shuffle) */}
        {!isShuffling && (
          <SpreadMiniMap
            spreadType={spreadType}
            totalCards={drawnCards.length}
            currentIndex={currentCardIndex}
            revealedCount={Math.min(currentCardIndex + 1, drawnCards.length)}
          />
        )}

        <View style={styles.centerContent}>
          {/* Shuffle animation */}
          {isShuffling && isLoading && (
            <View style={styles.shuffleContainer}>
              <Text style={styles.shuffleText}>Shuffling the cards...</Text>
              <CardShuffleAnimation
                onComplete={() => {
                  setIsShuffling(false);
                }}
              />
            </View>
          )}

          {/* Loading spinner for interpretations */}
          {!isShuffling && isLoading ? (
            <>
              <ActivityIndicator size="large" color="#8a2be2" />
              <Text style={styles.loadingText}>Weaving interpretations...</Text>
            </>
          ) : !isShuffling && (
            <>
              <ScrollView
                contentContainerStyle={styles.spreadCardsContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Render all cards in spread positions */}
                {drawnCards.map((card, index) => {
                  const pos = cardPositions[index];
                  const isCurrentCard = index === currentCardIndex;
                  const baseDelay = 800;
                  const delayPerCard = 2500; // Time between each card flip
                  const autoRevealDelay = baseDelay + (index * delayPerCard);

                  return (
                    <View
                      key={index}
                      style={[
                        styles.spreadCardPosition,
                        {
                          left: pos.x,
                          top: pos.y,
                          transform: [{ rotate: `${pos.rotation || 0}deg` }],
                        },
                      ]}
                    >
                      {/* Position label */}
                      <Text style={styles.spreadPositionLabel}>{card.position}</Text>

                      {/* Card flip */}
                      <TarotCardFlip
                        cardData={{
                          ...card,
                          image: ASSETS.cards.back.path,
                        }}
                        isReversed={card.reversed}
                        autoReveal={true}
                        autoRevealDelay={autoRevealDelay}
                        onFlipComplete={() => {
                          // Update current card index
                          if (index === currentCardIndex && index < drawnCards.length - 1) {
                            setTimeout(() => {
                              setCurrentCardIndex(index + 1);
                            }, 800);
                          } else if (index === drawnCards.length - 1) {
                            // Last card flipped
                            setTimeout(() => {
                              setShowFinalNarration(true);
                            }, 1000);
                          }
                        }}
                      />

                      {/* Current card indicator */}
                      {isCurrentCard && (
                        <View style={styles.currentCardGlow}>
                          <LinearGradient
                            colors={['rgba(0, 255, 100, 0.3)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Continue button (after all cards revealed) */}
              {showFinalNarration && (
                <Animated.View
                  style={[styles.continueOverlay, { opacity: fadeAnim }]}
                  onLayout={() => {
                    Animated.timing(fadeAnim, {
                      toValue: 1,
                      duration: 600,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <TouchableOpacity
                    style={styles.viewReadingButton}
                    onPress={() => {
                      // Trigger navigation that was already set up in getInterpretations
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00FF64', '#00CC50']}
                      style={styles.viewReadingGradient}
                    >
                      <Text style={styles.viewReadingButtonText}>View Reading Summary →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  // Helper function to get card positions for spread layout
  function getSpreadCardPositions(spreadType, cardCount) {
    const CARD_WIDTH = width * 0.6;
    const CARD_HEIGHT = CARD_WIDTH * 1.5;
    const centerX = (width - CARD_WIDTH) / 2;
    const spacing = CARD_WIDTH + 20;

    switch (spreadType) {
      case 'single_card':
        return [{ x: centerX, y: 80 }];

      case 'three_card':
        const startX = (width - (spacing * 3 - 20)) / 2;
        return [
          { x: startX, y: 100 },
          { x: startX + spacing, y: 100 },
          { x: startX + spacing * 2, y: 100 },
        ];

      case 'five_card':
        const crossX = centerX;
        return [
          { x: crossX, y: 50 },
          { x: crossX - spacing * 0.7, y: 50 + CARD_HEIGHT + 30 },
          { x: crossX, y: 50 + CARD_HEIGHT + 30 },
          { x: crossX + spacing * 0.7, y: 50 + CARD_HEIGHT + 30 },
          { x: crossX, y: 50 + (CARD_HEIGHT + 30) * 2 },
        ];

      case 'celtic_cross':
        const baseX = 10;
        const baseY = 40;
        const compactSpacing = CARD_WIDTH * 0.8;
        return [
          { x: baseX + compactSpacing, y: baseY + CARD_HEIGHT * 0.8 },
          { x: baseX + compactSpacing, y: baseY + CARD_HEIGHT * 0.8, rotation: 90 },
          { x: baseX + compactSpacing, y: baseY },
          { x: baseX, y: baseY + CARD_HEIGHT * 0.8 },
          { x: baseX + compactSpacing, y: baseY + CARD_HEIGHT * 1.6 },
          { x: baseX + compactSpacing * 2, y: baseY + CARD_HEIGHT * 0.8 },
          { x: baseX + compactSpacing * 3, y: baseY + CARD_HEIGHT * 2 },
          { x: baseX + compactSpacing * 3, y: baseY + CARD_HEIGHT * 1.5 },
          { x: baseX + compactSpacing * 3, y: baseY + CARD_HEIGHT },
          { x: baseX + compactSpacing * 3, y: baseY + CARD_HEIGHT * 0.5 },
        ];

      default:
        return Array(cardCount)
          .fill(0)
          .map((_, i) => ({ x: centerX, y: 80 + i * (CARD_HEIGHT + 40) }));
    }
  }

  // RENDER: Reflection Screen
  if (step === 'reflection') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.reflectionTitle}>Reflect on Your Reading</Text>
          <Text style={styles.reflectionPrompt}>
            The cards have spoken. Take a moment to reflect:\n\n
            • What resonates most with you?\n
            • How will you act on this wisdom?\n
            • What surprised you?
          </Text>

          <TextInput
            style={styles.reflectionInput}
            placeholder="Share your insights... (20+ characters for bonus rewards)"
            placeholderTextColor="#666"
            value={reflectionAnswer}
            onChangeText={setReflectionAnswer}
            multiline
            maxLength={500}
          />

          <View style={styles.reflectionActions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipReflection}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, reflectionAnswer.length < 20 && styles.submitButtonDisabled]}
              onPress={handleSubmitReflection}
              disabled={reflectionAnswer.length < 20}
            >
              <Text style={styles.submitButtonText}>
                Submit (+50 XP)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // RENDER: Rewards Screen
  if (step === 'rewards') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />

        <View style={styles.centerContent}>
          <Text style={styles.rewardsTitle}>Reading Complete</Text>

          <View style={styles.levelDisplay}>
            <Text style={styles.levelText}>Level {progression?.level}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpBarFill, { width: `${(progression?.xp || 0) % 100}%` }]} />
            </View>
          </View>

          <View style={styles.balanceDisplay}>
            <Text style={styles.balanceText}>🌙 {balance.moonlight} Moonlight</Text>
            <Text style={styles.balanceText}>💎 {balance.veilShards} Veil Shards</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate('MainMenu')}
          >
            <LinearGradient colors={['#8a2be2', '#6a1bb2']} style={styles.doneGradient}>
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('ReadingHistory')}
          >
            <Text style={styles.historyButtonText}>View Reading History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00ffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  currencyDisplay: {},
  currencyText: {
    fontSize: 14,
    color: '#00ffff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  narrationBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderColor: '#8a2be2',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  narrationText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  intentionSection: {
    width: '100%',
  },
  intentionPrompt: {
    fontSize: 18,
    color: '#8a2be2',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  intentionInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
    marginBottom: 20,
  },
  costDisplay: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  costText: {
    fontSize: 14,
    color: '#ff8888',
    textAlign: 'center',
  },
  freeDisplay: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#44ff44',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  freeText: {
    fontSize: 14,
    color: '#88ff88',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  continueButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    padding: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#8a2be2',
    marginTop: 20,
  },
  cardsContainer: {
    paddingVertical: 20,
  },
  cardBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  cardPosition: {
    fontSize: 12,
    color: '#00ffff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardInterpretation: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
  },
  reflectionTitle: {
    fontSize: 24,
    color: '#8a2be2',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  reflectionPrompt: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  reflectionInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#999',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    backgroundColor: '#8a2be2',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  rewardsTitle: {
    fontSize: 28,
    color: '#8a2be2',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  levelDisplay: {
    width: '80%',
    marginBottom: 30,
  },
  levelText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  xpBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#8a2be2',
  },
  balanceDisplay: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 40,
  },
  balanceText: {
    fontSize: 18,
    color: '#00ffff',
    fontWeight: 'bold',
  },
  doneButton: {
    width: width * 0.8,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  doneGradient: {
    padding: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  historyButton: {
    padding: 12,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#00ffff',
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  gateTitle: {
    fontSize: 48,
    marginBottom: 20,
  },
  gateSpreadName: {
    fontSize: 24,
    color: '#8a2be2',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  gateReason: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  progressInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    color: '#00ffff',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    padding: 12,
  },
  // New card flip styles
  nextCardButton: {
    marginTop: 30,
    borderRadius: 10,
    overflow: 'hidden',
    width: '80%',
    alignSelf: 'center',
  },
  nextCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  nextCardButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  continueToReflectionButton: {
    marginTop: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  // Spread layout styles
  shuffleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  shuffleText: {
    fontSize: 18,
    color: '#9945FF',
    fontWeight: 'bold',
    marginBottom: 40,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spreadCardsContainer: {
    paddingVertical: 20,
    minHeight: height * 0.8,
  },
  spreadCardPosition: {
    position: 'absolute',
    alignItems: 'center',
  },
  spreadPositionLabel: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  currentCardGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 15,
    zIndex: -1,
  },
  continueOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  viewReadingButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00FF64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  viewReadingGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  viewReadingButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
