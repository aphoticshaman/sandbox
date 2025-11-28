/**
 * CURRENCY MANAGER
 * Manages Veil Shards (premium) and Moonlight (soft) currencies
 * for VeilPath - Mental Wellness Tarot's dark fantasy RPG economy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const CURRENCY_KEY = '@veilpath_currency';
const TRANSACTION_KEY = '@veilpath_transactions';

// Currency types
export const CURRENCY_TYPE = {
  VEIL_SHARDS: 'veilShards',    // 💎 Premium currency
  MOONLIGHT: 'moonlight'         // 🌙 Soft currency
};

// Initial state
const INITIAL_STATE = {
  veilShards: 0,
  moonlight: 100,  // Start with 100 Moonlight
  lifetime: {
    veilShardsEarned: 0,
    veilShardsSpent: 0,
    moonlightEarned: 100,  // Count initial gift
    moonlightSpent: 0
  }
};

class CurrencyManagerClass {
  constructor() {
    this.state = {...INITIAL_STATE};
    this.transactions = [];
    this.listeners = new Set();
  }

  /**
   * Initialize currency system - load from storage
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(CURRENCY_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }

      const transactions = await AsyncStorage.getItem(TRANSACTION_KEY);
      if (transactions) {
        this.transactions = JSON.parse(transactions);
      }

      return true;
    } catch (error) {
      console.error('Currency Manager init error:', error);
      return false;
    }
  }

  /**
   * Get current currency balances
   */
  getBalance(currencyType = null) {
    if (currencyType) {
      return this.state[currencyType] || 0;
    }
    return {
      veilShards: this.state.veilShards,
      moonlight: this.state.moonlight
    };
  }

  /**
   * Earn currency
   */
  async earn(currencyType, amount, reason = 'unknown') {
    if (amount <= 0) {
      console.warn('Cannot earn negative or zero currency');
      return false;
    }

    const oldBalance = this.state[currencyType];
    this.state[currencyType] += amount;

    // Update lifetime stats
    const lifetimeKey = `${currencyType}Earned`;
    this.state.lifetime[lifetimeKey] += amount;

    // Record transaction
    const transaction = {
      type: 'earn',
      currency: currencyType,
      amount,
      reason,
      timestamp: Date.now(),
      balanceBefore: oldBalance,
      balanceAfter: this.state[currencyType]
    };
    this.transactions.unshift(transaction);

    // Keep only last 100 transactions
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(0, 100);
    }

    // Persist
    await this.save();

    // Notify listeners
    this.notifyListeners({
      type: 'earn',
      currency: currencyType,
      amount,
      newBalance: this.state[currencyType]
    });

    return true;
  }

  /**
   * Spend currency (returns true if successful, false if insufficient funds)
   */
  async spend(currencyType, amount, reason = 'unknown') {
    if (amount <= 0) {
      console.warn('Cannot spend negative or zero currency');
      return false;
    }

    const currentBalance = this.state[currencyType];
    if (currentBalance < amount) {
      console.warn(`Insufficient ${currencyType}: need ${amount}, have ${currentBalance}`);
      return false;
    }

    const oldBalance = currentBalance;
    this.state[currencyType] -= amount;

    // Update lifetime stats
    const lifetimeKey = `${currencyType}Spent`;
    this.state.lifetime[lifetimeKey] += amount;

    // Record transaction
    const transaction = {
      type: 'spend',
      currency: currencyType,
      amount,
      reason,
      timestamp: Date.now(),
      balanceBefore: oldBalance,
      balanceAfter: this.state[currencyType]
    };
    this.transactions.unshift(transaction);

    // Keep only last 100 transactions
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(0, 100);
    }

    // Persist
    await this.save();

    // Notify listeners
    this.notifyListeners({
      type: 'spend',
      currency: currencyType,
      amount,
      newBalance: this.state[currencyType]
    });

    return true;
  }

  /**
   * Check if user can afford something
   */
  canAfford(currencyType, amount) {
    return this.state[currencyType] >= amount;
  }

  /**
   * Get transaction history
   */
  getTransactions(limit = 10) {
    return this.transactions.slice(0, limit);
  }

  /**
   * Get lifetime stats
   */
  getLifetimeStats() {
    return {...this.state.lifetime};
  }

  /**
   * Subscribe to currency changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Currency listener error:', error);
      }
    });
  }

  /**
   * Save state to AsyncStorage
   */
  async save() {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(this.state));
      await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Currency save error:', error);
    }
  }

  /**
   * Reset currency (for testing or account wipe)
   */
  async reset() {
    this.state = {...INITIAL_STATE};
    this.transactions = [];
    await this.save();
    this.notifyListeners({type: 'reset'});
  }

  /**
   * Add currency from IAP (in-app purchase)
   */
  async addFromPurchase(productId, veilShards) {
    await this.earn(CURRENCY_TYPE.VEIL_SHARDS, veilShards, `iap_${productId}`);
  }
}

// Singleton instance
const CurrencyManager = new CurrencyManagerClass();

export default CurrencyManager;

/**
 * Convenience functions
 */

export async function initializeCurrency() {
  return await CurrencyManager.initialize();
}

export function getCurrencyBalance(type = null) {
  return CurrencyManager.getBalance(type);
}

export async function earnMoonlight(amount, reason) {
  return await CurrencyManager.earn(CURRENCY_TYPE.MOONLIGHT, amount, reason);
}

export async function earnVeilShards(amount, reason) {
  return await CurrencyManager.earn(CURRENCY_TYPE.VEIL_SHARDS, amount, reason);
}

export async function spendMoonlight(amount, reason) {
  return await CurrencyManager.spend(CURRENCY_TYPE.MOONLIGHT, amount, reason);
}

export async function spendVeilShards(amount, reason) {
  return await CurrencyManager.spend(CURRENCY_TYPE.VEIL_SHARDS, amount, reason);
}

export function canAffordMoonlight(amount) {
  return CurrencyManager.canAfford(CURRENCY_TYPE.MOONLIGHT, amount);
}

export function canAffordVeilShards(amount) {
  return CurrencyManager.canAfford(CURRENCY_TYPE.VEIL_SHARDS, amount);
}

/**
 * ECONOMY CONSTANTS
 */

export const ECONOMY = {
  // Earning rates
  EARN: {
    READING_COMPLETE: 10,        // 10 Moonlight per reading
    DAILY_LOGIN: 25,             // 25 Moonlight daily
    ACHIEVEMENT_SMALL: 50,       // Small achievement
    ACHIEVEMENT_MEDIUM: 100,     // Medium achievement
    ACHIEVEMENT_LARGE: 200,      // Large achievement
    QUEST_COMPLETE: 100,         // Quest completion
    STREAK_BONUS: 50,            // 7-day streak bonus
  },

  // Costs
  COST: {
    // Moonlight costs
    THREE_CARD_SPREAD: 0,        // Free
    FIVE_CARD_SPREAD: 25,        // 25 Moonlight
    SEVEN_CARD_SPREAD: 50,       // 50 Moonlight
    CARD_UNLOCK: 10,             // Unlock card in deck viewer

    // Veil Shard costs (premium)
    CELTIC_CROSS: 100,           // 100 Veil Shards
    VOICE_NARRATION: 200,        // 200 Veil Shards (unlock feature)
    PREMIUM_SPREAD: 50,          // 50 Veil Shards per use
    COSMETIC_CARD_BACK: 150,     // Card back cosmetic
    NPC_CONSULTATION: 75,        // Special guided reading
  },

  // IAP pricing (real money -> Veil Shards)
  IAP: {
    STARTER: {price: 0.99, shards: 100},
    SMALL: {price: 2.99, shards: 350},
    MEDIUM: {price: 4.99, shards: 600},
    LARGE: {price: 9.99, shards: 1400},
    HUGE: {price: 19.99, shards: 3000},
  }
};
