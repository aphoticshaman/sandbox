/**
 * AD MANAGER - LEGACY STUB
 * Now redirects to UpgradePromptManager for polite upgrade prompts
 * No ads - just gentle reminders to support indie development
 */

import UpgradePromptManager from './UpgradePromptManager';
import InAppPurchaseManager from './InAppPurchaseManager';
import { FeatureGate } from './featureGate';

class AdManager {
  async initialize() {
  }

  async showAdAfterCard() {
    // Only show prompts to free users
    if (FeatureGate.isPremium()) {
      return;
    }

    // Show polite upgrade prompt for free users
    await UpgradePromptManager.showAfterCardPrompt(() => {
      InAppPurchaseManager.purchasePremium();
    });
  }

  async showAdBeforeSynthesis() {
    // Only show prompts to free users
    if (FeatureGate.isPremium()) {
      return;
    }

    // Show polite upgrade prompt for free users
    await UpgradePromptManager.showBeforeSynthesisPrompt(() => {
      InAppPurchaseManager.purchasePremium();
    });
  }

  isEnabled() {
    return false; // Ads are disabled
  }
}

// Export singleton instance
export default new AdManager();
