/**
 * UPGRADE PROMPT MANAGER
 * Shows polite rotating messages encouraging users to upgrade
 * No ads - just gentle reminders that support helps indie devs
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const PROMPT_COUNT_KEY = '@veilpath_prompt_count';

const POLITE_MESSAGES = [
  {
    title: "💜 Support Indie Development",
    message: "VeilPath - Mental Wellness Tarot is built by a solo developer raising a kid. Your $3.99 one-time upgrade helps keep this app alive and ad-free forever.\n\n✨ Unlock all spreads, save readings, and remove these prompts!"
  },
  {
    title: "🌙 Enjoying Your Readings?",
    message: "If VeilPath's readings have brought you clarity, consider supporting continued development with a one-time $3.99 upgrade.\n\n🔓 Get all features + support an independent creator!"
  },
  {
    title: "✨ Premium Unlocks Everything",
    message: "For the price of a coffee, unlock all 9 spread types, save your reading history, and support solo indie development.\n\n💝 One payment, lifetime access!"
  },
  {
    title: "🎯 Ready for Deeper Readings?",
    message: "3-card spreads are powerful, but Celtic Cross and Horseshoe spreads offer profound insights.\n\n🚀 Upgrade for $3.99 to unlock all spreads + help feed a developer's kid!"
  },
  {
    title: "💎 No Subscriptions, Ever",
    message: "Just $3.99 one time. No recurring charges, no tricks. Unlock everything forever and support independent software development.\n\n🙏 Your support matters!"
  },
  {
    title: "🔮 Help Keep This Free Version Free",
    message: "Premium users make it possible to offer unlimited free readings to everyone. Join them for $3.99 and unlock all features!\n\n💫 Support indie development!"
  }
];

class UpgradePromptManager {
  constructor() {
    this.currentIndex = 0;
    this.initialized = false;
  }

  /**
   * Check if online before showing upgrade prompts
   */
  async isOnline() {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected;
    } catch (error) {
      return false; // Assume offline if check fails
    }
  }

  /**
   * Initialize - load the prompt count from storage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const count = await AsyncStorage.getItem(PROMPT_COUNT_KEY);
      this.currentIndex = count ? parseInt(count, 10) % POLITE_MESSAGES.length : 0;
      this.initialized = true;
    } catch (error) {
      console.error('[UpgradePrompt] Init error:', error);
      this.currentIndex = 0;
      this.initialized = true;
    }
  }

  /**
   * Get the next polite message and rotate
   */
  async getNextMessage() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const message = POLITE_MESSAGES[this.currentIndex];

      // Rotate to next message
      this.currentIndex = (this.currentIndex + 1) % POLITE_MESSAGES.length;

      // Save progress
      try {
        await AsyncStorage.setItem(PROMPT_COUNT_KEY, this.currentIndex.toString());
      } catch (error) {
        console.error('[UpgradePrompt] Save error:', error);
      }

      return message;
    } catch (error) {
      console.error('[UpgradePrompt] getNextMessage error:', error);
      // Return first message as fallback
      return POLITE_MESSAGES[0];
    }
  }

  /**
   * Show upgrade prompt after a card reading
   */
  async showAfterCardPrompt(onUpgrade) {
    try {
      const { title, message } = await this.getNextMessage();

      Alert.alert(
        title,
        message,
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade for $3.99',
            onPress: () => {
              if (onUpgrade) onUpgrade();
            }
          }
        ]
      );
    } catch (error) {
      console.error('[UpgradePrompt] showAfterCardPrompt error:', error);
    }
  }

  /**
   * Show upgrade prompt before synthesis
   */
  async showBeforeSynthesisPrompt(onUpgrade) {
    try {
      const { title, message } = await this.getNextMessage();

      Alert.alert(
        title,
        message,
        [
          { text: 'Continue to Reading', style: 'cancel' },
          {
            text: 'Upgrade for $3.99',
            onPress: () => {
              if (onUpgrade) onUpgrade();
            }
          }
        ]
      );
    } catch (error) {
      console.error('[UpgradePrompt] showBeforeSynthesisPrompt error:', error);
    }
  }

  /**
   * Show feature-locked prompt (for save/share)
   */
  showFeatureLockedPrompt(featureName, onUpgrade) {
    try {
      Alert.alert(
        `🔒 ${featureName} - Premium Only`,
        `${featureName} is available in the Premium version.\n\nUpgrade once for $3.99 to unlock:\n\n• All 9 spread types\n• Save reading history\n• Share & export readings\n• Support indie development\n• No more prompts!`,
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Upgrade for $3.99',
            onPress: () => {
              if (onUpgrade) onUpgrade();
            }
          }
        ]
      );
    } catch (error) {
      console.error('[UpgradePrompt] showFeatureLockedPrompt error:', error);
    }
  }

  /**
   * Generic show method - displays feature-specific upgrade prompt
   * @param {string} featureName - Name of the locked feature
   * @param {string} description - Why this feature is worth upgrading for
   * @param {function} navigation - Navigation object (unused but kept for compatibility)
   */
  async show(featureName, description, navigation) {
    try {
      // Don't show popup if offline - feature should just be greyed out
      const online = await this.isOnline();
      if (!online) {
        return; // No popup, feature stays greyed out
      }

      Alert.alert(
        `🔒 ${featureName}`,
        `${description}\n\nUpgrade once for $3.99 to unlock:\n\n• All 9 spread types\n• Save reading history\n• Share & export readings\n• Support indie development\n• Lifetime access!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade for $3.99',
            onPress: () => {
              // TODO: Trigger IAP purchase flow
              // For now, just logs the intent
            }
          }
        ]
      );
    } catch (error) {
      console.error('[UpgradePrompt] show error:', error);
    }
  }
}

// Export singleton
export default new UpgradePromptManager();
