/**
 * SYNTHESIS SCREEN - Display mega synthesis with encrypted reveal
 *
 * Shows the 600-1500 word mega synthesis generated from:
 * - All cards + positions
 * - MCQ answers (cognitive dissonance, emotional patterns)
 * - MBTI type + communication style
 * - Advanced astrology (Lilith, Chiron, Nodes)
 * - Pop culture quotes
 * - Balanced Wisdom (Middle Way)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Share,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

// Graceful clipboard fallback for Expo Go
let Clipboard;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  console.warn('[SynthesisScreen] Clipboard module not available in Expo Go');
  Clipboard = null;
}
import CyberpunkHeader from '../components/CyberpunkHeader';
import { NeonText, LPMUDText } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { FeatureGate } from '../utils/featureGate';
import UpgradePromptManager from '../utils/UpgradePromptManager';
import InAppPurchaseManager from '../utils/InAppPurchaseManager';
import { saveReadingFeedback } from '../utils/readingFeedback';
import { trackReading } from '../utils/readingHistory';
import { saveReading, getStatsSummary } from '../services/engagementTracker';
import { checkAchievements } from '../services/achievementSystem';
import AchievementUnlock from '../components/AchievementUnlock';
import { getPositionInfo } from '../data/spreadDefinitions';
import { getCardData } from '../data/cardDatabase';

const READINGS_KEY = '@lunatiq_saved_readings';
const MAX_READINGS = 20;

export default function SynthesisScreen({ route, navigation }) {
  const {
    synthesis,
    cards,
    intention,
    readingType,
    spreadType,
    readingId, // If viewing existing reading
    readingName, // If viewing existing reading
  } = route.params || {};

  const scrollViewRef = useRef(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaved, setIsSaved] = useState(!!readingId);

  // Feedback state
  const [rating, setRating] = useState(0); // 1-5 stars
  const [helpful, setHelpful] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Achievement state
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Track reading in history on mount
  useEffect(() => {
    const logReading = async () => {
      try {
        // Legacy reading tracking
        await trackReading({
          readingId: readingId || `reading_${Date.now()}`,
          cards: cards || [],
          readingType: readingType || 'General',
          spreadType: spreadType || 'Unknown',
          timestamp: new Date().toISOString(),
        });
        console.log('[SynthesisScreen] Reading tracked in history');

        // New engagement tracking
        const PROFILES_KEY = '@lunatiq_profiles';
        const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

        const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
        const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);

        let profile = null;
        if (profilesData && activeId) {
          const profiles = JSON.parse(profilesData);
          profile = profiles.find(p => p.id === activeId);
          console.log('[SynthesisScreen] Loaded active profile:', profile?.name, 'MBTI:', profile?.mbtiType);
        }

        await saveReading({
          spreadType: readingType || 'General',
          spreadSubtype: spreadType || 'Unknown',
          intention: intention || '',
          cards: cards || [],
          themes: [], // TODO: Extract from synthesis
          synthesis: synthesis || '',
          profileId: profile?.id || 'default',
        });
        console.log('[SynthesisScreen] Reading saved to engagement tracker');

        // Check for achievements
        const newAchievements = await checkAchievements();
        if (newAchievements.length > 0) {
          console.log('[SynthesisScreen] New achievements unlocked:', newAchievements.length);
          setUnlockedAchievements(newAchievements);
          // Show first achievement immediately
          setCurrentAchievement(newAchievements[0]);
          setShowAchievementModal(true);
        }
      } catch (error) {
        console.error('[SynthesisScreen] Failed to track reading:', error);
      }
    };

    if (cards && cards.length > 0) {
      logReading();
    }
  }, []); // Run once on mount

  // Handle multiple achievement unlocks
  const handleAchievementClose = () => {
    setShowAchievementModal(false);

    // If there are more achievements to show, show the next one
    const currentIndex = unlockedAchievements.indexOf(currentAchievement);
    if (currentIndex >= 0 && currentIndex < unlockedAchievements.length - 1) {
      setTimeout(() => {
        setCurrentAchievement(unlockedAchievements[currentIndex + 1]);
        setShowAchievementModal(true);
      }, 500);
    }
  };

  const handleFinish = async () => {
    // Submit feedback if provided (rating or helpful flag set)
    if ((rating > 0 || helpful) && !feedbackSubmitted) {
      await submitFeedback();
    }

    if (!isSaved && !showSaveDialog) {
      // Check if user has permission to save
      if (!FeatureGate.canSaveReading()) {
        // Free user - show upgrade prompt instead of save dialog
        Alert.alert(
          'Upgrade to Premium',
          'Save your readings for later with Premium! Upgrade now to unlock unlimited saved readings.',
          [
            { text: 'Not Now', onPress: () => navigation.navigate('Welcome') },
            { text: 'Upgrade', onPress: () => showUpgradePrompt('Save Readings') },
          ]
        );
      } else {
        // Premium user - prompt to save before leaving
        Alert.alert(
          'Save Reading?',
          'Would you like to save this reading for later?',
          [
            { text: 'Discard', onPress: () => navigation.navigate('Welcome'), style: 'destructive' },
            { text: 'Save', onPress: () => setShowSaveDialog(true) },
          ]
        );
      }
    } else {
      navigation.navigate('Welcome');
    }
  };

  const submitFeedback = async () => {
    if (feedbackSubmitted) return; // Don't submit twice

    try {
      // Open app store rating dialog
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        console.log('[SynthesisScreen] App store review requested');
      } else {
        // Fallback: open app store page
        const storeUrl = Platform.select({
          ios: 'https://apps.apple.com/app/id6739196343',
          android: 'https://play.google.com/store/apps/details?id=com.aphoticshaman.lunatiq',
        });
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        }
      }
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('[SynthesisScreen] Error requesting app store review:', error);
    }
  };

  const handleSaveReading = () => {
    // Check permission
    if (!FeatureGate.canSaveReading()) {
      showUpgradePrompt('Save Readings');
      return;
    }

    if (!isSaved) {
      // Generate default name
      const defaultName = `${readingType || 'General'} Reading - ${new Date().toLocaleDateString()}`;
      setSaveName(defaultName);
      setShowSaveDialog(true);
    }
  };

  const handleShareReading = async () => {
    // Check permission
    if (!FeatureGate.canShareReading()) {
      showUpgradePrompt('Share Readings');
      return;
    }

    // Format reading for sharing
    const shareText = formatReadingForExport();

    try {
      const result = await Share.share({
        message: shareText,
        title: 'My Tarot Reading',
      });

      if (result.action === Share.sharedAction) {
        console.log('Reading shared successfully');
      }
    } catch (error) {
      console.error('Error sharing reading:', error);
      Alert.alert('Error', 'Failed to share reading. Please try again.');
    }
  };

  const handleCopyReading = () => {
    // Check permission
    if (!FeatureGate.canShareReading()) {
      showUpgradePrompt('Copy Readings');
      return;
    }

    if (!Clipboard) {
      Alert.alert('Copy Not Available', 'Clipboard is not available in Expo Go. Use the Share button instead, or test in a production build.');
      return;
    }

    const shareText = formatReadingForExport();
    Clipboard.setString(shareText);

    Alert.alert('Copied!', 'Reading copied to clipboard.', [{ text: 'OK' }]);
  };

  const formatReadingForExport = () => {
    const date = new Date().toLocaleDateString();
    let text = `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ LUNATIQ TAROT READING ✨\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (intention) {
      text += `🎯 INTENTION:\n${intention}\n\n`;
    }

    text += `📅 Date: ${date}\n`;
    text += `📊 Type: ${readingType || 'General'}\n`;
    text += `🃏 Spread: ${spreadType || 'Unknown'}\n`;
    text += `🔢 Cards: ${cards?.length || 0}\n\n`;

    // Add cards section with positions
    if (cards && cards.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🎴 CARDS DRAWN\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      cards.forEach((card, index) => {
        const cardData = getCardData(card.cardIndex);
        const positionInfo = getPositionInfo(spreadType, index);
        const orientation = card.reversed ? 'Reversed' : 'Upright';
        const positionName = positionInfo?.name || card.position || `Position ${index + 1}`;
        const positionMeaning = positionInfo?.meaning || '';

        text += `${index + 1}. ${cardData?.name || 'Unknown Card'} (${orientation})\n`;
        text += `   Position: ${positionName}\n`;
        if (positionMeaning) {
          text += `   Meaning: ${positionMeaning}\n`;
        }
        text += `\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💫 SYNTHESIS\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `${synthesis}\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Generated by LunatIQ Tarot\n`;
    text += `Quantum randomness • Personalized insights\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return text;
  };

  const showUpgradePrompt = (featureName) => {
    UpgradePromptManager.showFeatureLockedPrompt(featureName, () => {
      // User tapped upgrade - trigger in-app purchase
      InAppPurchaseManager.purchasePremium();
    });
  };

  const handleCopySynthesis = () => {
    if (!Clipboard) {
      Alert.alert('Clipboard Unavailable', 'Clipboard is not available in this environment');
      return;
    }

    const fullText = formatReadingForCopy();
    Clipboard.setString(fullText);
    Alert.alert('Copied!', 'Full synthesis copied to clipboard');
  };

  const saveReadingToStorage = async () => {
    // Double-check permission (safeguard)
    if (!FeatureGate.canSaveReading()) {
      console.warn('[SynthesisScreen] Attempted to save without permission');
      showUpgradePrompt('Save Readings');
      setShowSaveDialog(false);
      return;
    }

    try {
      // Load existing readings
      const data = await AsyncStorage.getItem(READINGS_KEY);
      let readings = data ? JSON.parse(data) : [];

      // Create reading object
      const reading = {
        id: readingId || `reading_${Date.now()}`,
        name: saveName.trim() || `Reading ${new Date().toLocaleDateString()}`,
        synthesis,
        cards,
        intention,
        readingType,
        spreadType,
        timestamp: new Date().toISOString(),
      };

      // If updating existing
      if (readingId) {
        readings = readings.map(r => r.id === readingId ? reading : r);
      } else {
        // Add new reading
        readings.unshift(reading); // Add to beginning

        // Limit to MAX_READINGS
        if (readings.length > MAX_READINGS) {
          readings = readings.slice(0, MAX_READINGS);
          Alert.alert(
            'Storage Limit',
            `Only the ${MAX_READINGS} most recent readings are kept. The oldest reading was removed.`
          );
        }
      }

      await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(readings));
      console.log('Reading saved successfully:', reading.name);

      setShowSaveDialog(false);
      setIsSaved(true);

      Alert.alert(
        'Saved!',
        `"${reading.name}" has been saved to your reading history.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving reading:', error);
      Alert.alert('Error', 'Failed to save reading. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Compact header */}
        <CyberpunkHeader compact={true} />

        {/* Title section */}
        <View style={styles.titleSection}>
          <LPMUDText style={styles.title}>
            $HIM${'>'} $HIY$SYNTHESIS$NOR$ $HIM${'<'}$NOR$
          </LPMUDText>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.subtitle}>
            Your personalized reading
          </NeonText>
          {intention && (
            <View style={styles.intentionBox}>
              <LPMUDText style={styles.intentionText}>
                $HIY$INTENTION:$NOR$ {intention}
              </LPMUDText>
            </View>
          )}
        </View>

        {/* Scrollable synthesis */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Cards List Section */}
          {cards && cards.length > 0 && (
            <View style={styles.cardsListContainer}>
              <LPMUDText style={styles.cardsListTitle}>
                $HIM$🎴 CARDS DRAWN$NOR$
              </LPMUDText>

              {cards.map((card, index) => {
                const cardData = getCardData(card.cardIndex);
                const positionInfo = getPositionInfo(spreadType, index);
                const orientation = card.reversed ? 'Reversed' : 'Upright';
                const orientationColor = card.reversed ? NEON_COLORS.dimMagenta : NEON_COLORS.hiCyan;
                const positionName = positionInfo?.name || card.position || `Position ${index + 1}`;
                const positionMeaning = positionInfo?.meaning || '';

                return (
                  <View key={index} style={styles.cardItem}>
                    <View style={styles.cardHeader}>
                      <NeonText color={NEON_COLORS.hiYellow} style={styles.cardNumber}>
                        {index + 1}.
                      </NeonText>
                      <NeonText color={NEON_COLORS.hiWhite} style={styles.cardName}>
                        {cardData?.name || 'Unknown Card'}
                      </NeonText>
                      <NeonText color={orientationColor} style={styles.cardOrientation}>
                        {orientation}
                      </NeonText>
                    </View>

                    <View style={styles.cardDetails}>
                      <LPMUDText style={styles.cardPosition}>
                        $HIC$Position:$NOR$ {positionName}
                      </LPMUDText>
                      {positionMeaning && (
                        <NeonText color={NEON_COLORS.dimCyan} style={styles.cardPositionMeaning}>
                          {positionMeaning}
                        </NeonText>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.synthesisContainer}>
            {/* Header with copy button */}
            <View style={styles.synthesisHeader}>
              <LPMUDText style={styles.synthesisTitle}>
                $HIG$💫 SYNTHESIS$NOR$
              </LPMUDText>
              <TouchableOpacity
                style={styles.copySynthesisButton}
                onPress={handleCopySynthesis}
              >
                <NeonText color={NEON_COLORS.hiCyan} style={styles.copySynthesisText}>
                  [ COPY ALL ]
                </NeonText>
              </TouchableOpacity>
            </View>

            <NeonText color={NEON_COLORS.hiWhite} style={styles.synthesisText}>
              {synthesis}
            </NeonText>
          </View>

          {/* Reading metadata */}
          <View style={styles.metadataBox}>
            <LPMUDText style={styles.metadataText}>
              $HIC$READING DETAILS$NOR${'\n'}
              $NOR$Type: {readingType || 'General'}$NOR${'\n'}
              $NOR$Spread: {spreadType || 'Unknown'}$NOR${'\n'}
              $NOR$Cards: {cards?.length || 0}$NOR$
            </LPMUDText>
          </View>

          {/* App Rating Section */}
          <View style={styles.feedbackBox}>
            <LPMUDText style={styles.feedbackTitle}>
              $HIM$ENJOYING LUNATIQ?$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.feedbackSubtitle}>
              Support indie development with a rating!
            </NeonText>

            {/* Star Rating */}
            <View style={styles.ratingContainer}>
              <NeonText color={NEON_COLORS.hiWhite} style={styles.ratingLabel}>
                Rate this app:
              </NeonText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <NeonText
                      color={star <= rating ? NEON_COLORS.hiYellow : NEON_COLORS.dimCyan}
                      style={styles.starText}
                    >
                      {star <= rating ? '★' : '☆'}
                    </NeonText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Support Toggle */}
            <TouchableOpacity
              onPress={() => setHelpful(!helpful)}
              style={styles.helpfulToggle}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, helpful && styles.checkboxChecked]}>
                  {helpful && (
                    <NeonText color={NEON_COLORS.hiGreen} style={styles.checkmark}>
                      ✓
                    </NeonText>
                  )}
                </View>
                <NeonText color={NEON_COLORS.hiWhite} style={styles.helpfulLabel}>
                  I'd recommend this app
                </NeonText>
              </View>
            </TouchableOpacity>

            {/* Submit Rating Button */}
            {(rating > 0 || helpful) && !feedbackSubmitted && (
              <TouchableOpacity onPress={submitFeedback} style={styles.submitFeedbackButton}>
                <LPMUDText style={styles.submitFeedbackText}>
                  $HIG${'[ '} RATE IN APP STORE $NOR${' ]'}$NOR$
                </LPMUDText>
              </TouchableOpacity>
            )}

            {/* Rating Submitted Confirmation */}
            {feedbackSubmitted && (
              <View style={styles.feedbackConfirmation}>
                <NeonText color={NEON_COLORS.hiGreen} style={styles.confirmationText}>
                  ✓ Thank you for your support!
                </NeonText>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSaveReading} style={styles.saveButton}>
            <LPMUDText style={styles.saveButtonText}>
              $HIY${'[ '} SAVE $NOR${' ]'}$NOR$
            </LPMUDText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShareReading} style={styles.shareButton}>
            <LPMUDText style={styles.shareButtonText}>
              $HIC${'[ '} SHARE $NOR${' ]'}$NOR$
            </LPMUDText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <LPMUDText style={styles.finishButtonText}>
              $HIG${'[ '} DONE $NOR${' ]'}$NOR$
            </LPMUDText>
          </TouchableOpacity>
        </View>

        {/* Save Dialog Modal */}
        <Modal
          visible={showSaveDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSaveDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LPMUDText style={styles.modalTitle}>
                $HIC$SAVE READING$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.modalSubtitle}>
                Give your reading a name:
              </NeonText>
              <TextInput
                style={styles.modalInput}
                value={saveName}
                onChangeText={setSaveName}
                placeholder={`${readingType || 'General'} Reading - ${new Date().toLocaleDateString()}`}
                placeholderTextColor={NEON_COLORS.dimCyan}
                maxLength={50}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowSaveDialog(false)}
                  style={styles.modalCancelButton}
                >
                  <LPMUDText style={styles.modalCancelText}>
                    $HIR$CANCEL$NOR$
                  </LPMUDText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveReadingToStorage}
                  style={styles.modalSaveButton}
                >
                  <LPMUDText style={styles.modalSaveText}>
                    $HIG$SAVE$NOR$
                  </LPMUDText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Achievement Unlock Modal */}
        <AchievementUnlock
          achievement={currentAchievement}
          visible={showAchievementModal}
          onClose={handleAchievementClose}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  title: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 12,
  },
  intentionBox: {
    borderWidth: 1,
    borderColor: NEON_COLORS.dimYellow,
    padding: 10,
    marginTop: 10,
    backgroundColor: 'rgba(10, 10, 0, 0.8)',
  },
  intentionText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
    paddingBottom: 40,
  },
  cardsListContainer: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    padding: 15,
    backgroundColor: 'rgba(30, 0, 30, 0.9)',
    marginBottom: 20,
  },
  cardsListTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  cardItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: NEON_COLORS.dimMagenta,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  cardName: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 16,
  },
  cardOrientation: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  cardDetails: {
    marginLeft: 20,
    gap: 4,
  },
  cardPosition: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  cardPositionMeaning: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    lineHeight: 13,
    marginLeft: 8,
  },
  synthesisContainer: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    marginBottom: 20,
  },
  synthesisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  synthesisTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 18,
    flex: 1,
  },
  copySynthesisButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 4,
  },
  copySynthesisText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  synthesisText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  metadataBox: {
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    padding: 15,
    backgroundColor: 'rgba(0, 10, 10, 0.8)',
    marginTop: 10,
  },
  metadataText: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 2,
    borderTopColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimYellow,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shareButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  finishButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 26, 0, 0.8)',
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    color: NEON_COLORS.hiWhite,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiRed,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  feedbackBox: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    padding: 20,
    backgroundColor: 'rgba(30, 0, 30, 0.8)',
    marginTop: 20,
  },
  feedbackTitle: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 10,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 32,
    fontFamily: 'monospace',
  },
  helpfulToggle: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: NEON_COLORS.hiGreen,
  },
  checkmark: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  helpfulLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  submitFeedbackButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    alignItems: 'center',
    marginTop: 8,
  },
  submitFeedbackText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  feedbackConfirmation: {
    padding: 12,
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: NEON_COLORS.hiGreen,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmationText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
