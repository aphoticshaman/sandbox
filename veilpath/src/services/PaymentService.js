/**
 * Payment Service - RevenueCat + Stripe
 *
 * Handles all monetization:
 * - Subscriptions (RevenueCat for cross-platform, Stripe for web)
 * - One-time shard purchases (Stripe)
 * - Entitlement checking
 *
 * Setup Required:
 * 1. RevenueCat: Create account at revenuecat.com, add app, get API keys
 * 2. Stripe: Create account at stripe.com, get publishable/secret keys
 * 3. Configure webhooks for both services
 *
 * Environment Variables needed:
 * - REVENUECAT_API_KEY (public)
 * - STRIPE_PUBLISHABLE_KEY (public)
 * - STRIPE_SECRET_KEY (server-side only)
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// RevenueCat API keys (replace with your actual keys)
const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'your_ios_api_key',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'your_android_api_key',
  web: process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY || 'your_web_api_key',
});

// Stripe publishable key (safe to expose)
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key';

// Your backend URL for creating Stripe checkout sessions
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.veilpath.app';

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_PRODUCTS = {
  monthly: {
    id: 'veilpath_premium_monthly',
    revenuecatId: 'rc_veilpath_monthly',
    stripePriceId: 'price_monthly_xxx', // Replace with actual Stripe price ID
    name: 'VeilPath Premium',
    description: 'Monthly subscription',
    price: 4.99,
    interval: 'month',
    features: [
      'Unlimited readings',
      'All spread types',
      'Subscriber quests & rewards',
      'Monthly shard bonus (500)',
      'Exclusive themes',
      'Ad-free experience',
    ],
  },
  yearly: {
    id: 'veilpath_premium_yearly',
    revenuecatId: 'rc_veilpath_yearly',
    stripePriceId: 'price_yearly_xxx',
    name: 'VeilPath Premium (Annual)',
    description: 'Annual subscription - save 33%',
    price: 39.99,
    interval: 'year',
    features: [
      'Everything in Monthly',
      'Save $20/year',
      '3,000 bonus shards upfront',
      'Patron title unlock',
    ],
  },
  lifetime: {
    id: 'veilpath_lifetime',
    revenuecatId: 'rc_veilpath_lifetime',
    stripePriceId: 'price_lifetime_xxx',
    name: 'VeilPath Lifetime',
    description: 'One-time purchase, forever premium',
    price: 99.99,
    interval: 'lifetime',
    features: [
      'Everything in Premium, forever',
      '10,000 bonus shards',
      'Benefactor title unlock',
      'Founding member badge (early adopters)',
    ],
  },
};

export const SHARD_PRODUCTS = {
  shard_100: {
    id: 'shard_100',
    stripePriceId: 'price_shard_100_xxx',
    shards: 100,
    bonus: 0,
    price: 0.99,
  },
  shard_500: {
    id: 'shard_500',
    stripePriceId: 'price_shard_500_xxx',
    shards: 500,
    bonus: 50,
    price: 4.99,
  },
  shard_1000: {
    id: 'shard_1000',
    stripePriceId: 'price_shard_1000_xxx',
    shards: 1000,
    bonus: 150,
    price: 8.99,
    popular: true,
  },
  shard_2500: {
    id: 'shard_2500',
    stripePriceId: 'price_shard_2500_xxx',
    shards: 2500,
    bonus: 500,
    price: 19.99,
  },
  shard_5000: {
    id: 'shard_5000',
    stripePriceId: 'price_shard_5000_xxx',
    shards: 5000,
    bonus: 1500,
    price: 34.99,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let isInitialized = false;
let Purchases = null; // RevenueCat SDK (lazy loaded)
let stripe = null; // Stripe instance (web only)

/**
 * Initialize payment providers
 */
export async function initializePayments() {
  if (isInitialized) return { success: true };

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (Platform.OS === 'web') {
      // Web: Use Stripe directly
      await initializeStripe();
    } else {
      // Mobile: Use RevenueCat
      await initializeRevenueCat(user?.id);
    }

    isInitialized = true;
    return { success: true };
  } catch (error) {
    console.error('[PaymentService] Initialization failed:', error);
    return { success: false, error: error.message };
  }
}

async function initializeRevenueCat(userId) {
  try {
    // Dynamically import RevenueCat (only on native)
    Purchases = (await import('react-native-purchases')).default;

    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    console.log('[PaymentService] RevenueCat initialized');
  } catch (error) {
    console.warn('[PaymentService] RevenueCat not available:', error.message);
  }
}

async function initializeStripe() {
  if (Platform.OS !== 'web') return;

  try {
    // Load Stripe.js
    const { loadStripe } = await import('@stripe/stripe-js');
    stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    console.log('[PaymentService] Stripe initialized');
  } catch (error) {
    console.warn('[PaymentService] Stripe not available:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get available subscription offerings
 */
export async function getSubscriptionOfferings() {
  await initializePayments();

  if (Platform.OS !== 'web' && Purchases) {
    try {
      const offerings = await Purchases.getOfferings();
      return {
        success: true,
        offerings: offerings.current?.availablePackages || [],
        products: SUBSCRIPTION_PRODUCTS,
      };
    } catch (error) {
      console.error('[PaymentService] Failed to get offerings:', error);
    }
  }

  // Fallback to our product definitions
  return {
    success: true,
    offerings: Object.values(SUBSCRIPTION_PRODUCTS),
    products: SUBSCRIPTION_PRODUCTS,
  };
}

/**
 * Purchase a subscription
 */
export async function purchaseSubscription(productId) {
  await initializePayments();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const product = SUBSCRIPTION_PRODUCTS[productId];
  if (!product) {
    return { success: false, error: 'Invalid product' };
  }

  try {
    if (Platform.OS === 'web') {
      // Web: Create Stripe Checkout session
      return await createStripeCheckout(product, user.id, 'subscription');
    } else if (Purchases) {
      // Mobile: Use RevenueCat
      const purchaseResult = await Purchases.purchaseProduct(product.revenuecatId);

      // Record in our database
      await recordSubscription(user.id, productId, purchaseResult);

      return {
        success: true,
        subscription: purchaseResult,
      };
    }

    return { success: false, error: 'Payment provider not available' };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('[PaymentService] Purchase failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check current subscription status
 */
export async function getSubscriptionStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, isPremium: false, tier: 'free' };
  }

  try {
    // Check our database first (canonical source)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription) {
      return {
        success: true,
        isPremium: true,
        tier: subscription.tier,
        expiresAt: subscription.expires_at,
        isLifetime: subscription.tier === 'lifetime',
      };
    }

    // Also check RevenueCat if available
    if (Platform.OS !== 'web' && Purchases) {
      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = customerInfo.entitlements.active['premium'];

      if (isActive) {
        return {
          success: true,
          isPremium: true,
          tier: 'premium',
          expiresAt: isActive.expirationDate,
        };
      }
    }

    return {
      success: true,
      isPremium: false,
      tier: 'free',
    };
  } catch (error) {
    console.error('[PaymentService] Status check failed:', error);
    return { success: false, isPremium: false, tier: 'free' };
  }
}

/**
 * Restore purchases (mobile only)
 */
export async function restorePurchases() {
  if (Platform.OS === 'web') {
    return { success: true, message: 'Web purchases are automatically restored' };
  }

  if (!Purchases) {
    return { success: false, error: 'RevenueCat not available' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      success: true,
      customerInfo,
      hasActiveSubscription: Object.keys(customerInfo.entitlements.active).length > 0,
    };
  } catch (error) {
    console.error('[PaymentService] Restore failed:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARD PURCHASES (One-time, Stripe only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Purchase shards
 */
export async function purchaseShards(productId) {
  await initializePayments();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const product = SHARD_PRODUCTS[productId];
  if (!product) {
    return { success: false, error: 'Invalid product' };
  }

  try {
    // All shard purchases go through Stripe
    return await createStripeCheckout(product, user.id, 'shards');
  } catch (error) {
    console.error('[PaymentService] Shard purchase failed:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE CHECKOUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create Stripe Checkout session
 */
async function createStripeCheckout(product, userId, type) {
  try {
    // Call your backend to create a checkout session
    const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product.id,
        priceId: product.stripePriceId,
        userId,
        type,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/shop`,
      }),
    });

    const data = await response.json();

    if (!data.sessionId) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } else {
      // Fallback: redirect directly to session URL
      if (data.url) {
        window.location.href = data.url;
      }
    }

    return { success: true, redirected: true };
  } catch (error) {
    console.error('[PaymentService] Stripe checkout failed:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE RECORDS - Transaction Logging
// These records are YOUR data, not encrypted, for refunds/fraud/legal
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record a purchase transaction in your database
 * Called BEFORE payment for tracking, updated after completion
 */
export async function recordTransaction({
  userId,
  email,
  productType,
  productId,
  productName,
  amountCents,
  provider,
  providerTransactionId,
  userIp = null,
}) {
  try {
    const { data, error } = await supabase.rpc('record_transaction', {
      p_user_id: userId,
      p_email: email,
      p_product_type: productType,
      p_product_id: productId,
      p_product_name: productName,
      p_amount_cents: amountCents,
      p_provider: provider,
      p_provider_transaction_id: providerTransactionId,
      p_user_ip: userIp,
    });

    if (error) throw error;

    console.log('[PaymentService] Transaction recorded:', data);
    return { success: true, transactionId: data };
  } catch (error) {
    console.error('[PaymentService] Failed to record transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark transaction as completed and record what was delivered
 */
export async function completeTransaction(transactionId, deliveryDetails) {
  try {
    await supabase.rpc('complete_transaction', {
      p_transaction_id: transactionId,
      p_delivery_details: deliveryDetails,
    });

    console.log('[PaymentService] Transaction completed:', transactionId);
    return { success: true };
  } catch (error) {
    console.error('[PaymentService] Failed to complete transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId) {
  try {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, transactions: data };
  } catch (error) {
    console.error('[PaymentService] Failed to get transactions:', error);
    return { success: false, transactions: [] };
  }
}

/**
 * Request a refund
 */
export async function requestRefund(transactionId, reason, reasonCategory = 'other') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get transaction to verify ownership and get amount
    const { data: transaction } = await supabase
      .from('purchase_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.status === 'refunded') {
      return { success: false, error: 'Already refunded' };
    }

    // Create refund request
    const { error } = await supabase.from('refund_requests').insert({
      transaction_id: transactionId,
      user_id: user.id,
      reason,
      reason_category: reasonCategory,
      amount_cents: transaction.amount_cents,
    });

    if (error) throw error;

    return { success: true, message: 'Refund request submitted' };
  } catch (error) {
    console.error('[PaymentService] Refund request failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record subscription in database (called by webhook or after purchase)
 */
async function recordSubscription(userId, productId, purchaseData) {
  const product = SUBSCRIPTION_PRODUCTS[productId];

  try {
    // Get user email
    const { data: { user } } = await supabase.auth.getUser();

    // First record the transaction
    await recordTransaction({
      userId,
      email: user?.email,
      productType: 'subscription',
      productId,
      productName: product.name,
      amountCents: Math.round(product.price * 100),
      provider: Platform.OS === 'web' ? 'stripe' : 'revenuecat',
      providerTransactionId: purchaseData?.transactionId || purchaseData?.id,
    });

    // Then update/create subscription record
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      email: user?.email,
      product_id: productId,
      tier: productId === 'lifetime' ? 'lifetime' : 'premium',
      status: 'active',
      provider: Platform.OS === 'web' ? 'stripe' : 'revenuecat',
      provider_subscription_id: purchaseData?.transactionId || purchaseData?.id,
      amount_cents: Math.round(product.price * 100),
      billing_interval: product.interval,
      expires_at: product.interval === 'lifetime'
        ? null
        : new Date(Date.now() + (product.interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000),
      started_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PaymentService] Failed to record subscription:', error);
  }
}

/**
 * Record shard purchase (called by webhook)
 * Records in both purchase_transactions and credits shards
 */
export async function recordShardPurchase(userId, productId, providerTransactionId) {
  const product = SHARD_PRODUCTS[productId];
  if (!product) return { success: false, error: 'Invalid product' };

  const totalShards = product.shards + product.bonus;

  try {
    // Get user email
    const { data: { user } } = await supabase.auth.getUser();

    // Record transaction in our database
    const txResult = await recordTransaction({
      userId,
      email: user?.email,
      productType: 'shards',
      productId,
      productName: `${product.shards} Cosmic Shards${product.bonus > 0 ? ` (+${product.bonus} bonus)` : ''}`,
      amountCents: Math.round(product.price * 100),
      provider: 'stripe',
      providerTransactionId,
    });

    // Credit the shards to user's account
    await supabase.rpc('add_shards_to_user', {
      p_user_id: userId,
      p_amount: totalShards,
      p_source: 'purchase',
    });

    // Mark transaction as completed with delivery details
    if (txResult.transactionId) {
      await completeTransaction(txResult.transactionId, {
        shards_credited: totalShards,
        base_shards: product.shards,
        bonus_shards: product.bonus,
      });
    }

    return { success: true, shardsAdded: totalShards, transactionId: txResult.transactionId };
  } catch (error) {
    console.error('[PaymentService] Failed to record shard purchase:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Initialization
  initializePayments,

  // Subscriptions
  getSubscriptionOfferings,
  purchaseSubscription,
  getSubscriptionStatus,
  restorePurchases,

  // Shards
  purchaseShards,
  recordShardPurchase,

  // Transaction Records (admin-accessible, for refunds/fraud/legal)
  recordTransaction,
  completeTransaction,
  getUserTransactions,
  requestRefund,

  // Products
  SUBSCRIPTION_PRODUCTS,
  SHARD_PRODUCTS,
};
