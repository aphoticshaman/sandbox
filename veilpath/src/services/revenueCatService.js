/**
 * RevenueCat Service
 * Handles subscription management, purchases, and entitlements
 */

import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY_ANDROID = 'test_mbmmxzdwpOFVsDoYZcZsjeVtRyM';
const REVENUECAT_API_KEY_IOS = 'YOUR_IOS_API_KEY'; // Add when you have iOS key

// Entitlement ID (set this in RevenueCat dashboard)
export const ENTITLEMENT_ID = 'pro';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime'
};

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup
 */
export async function initializeRevenueCat(appUserID = null) {
  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure with platform-specific API key
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    if (appUserID) {
      // Use your own user ID (recommended for cross-platform sync)
      await Purchases.configure({ apiKey, appUserID });
    } else {
      // Let RevenueCat generate anonymous ID
      await Purchases.configure({ apiKey });
    }

    return true;
  } catch (error) {
    console.error('[RevenueCat] Initialization failed:', error);
    return false;
  }
}

/**
 * Get current customer info and subscription status
 */
export async function getCustomerInfo() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return {
      customerInfo,
      isPro: checkProEntitlement(customerInfo),
      activeSubscriptions: customerInfo.activeSubscriptions,
      allPurchasedProductIds: customerInfo.allPurchasedProductIdentifiers
    };
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Check if user has pro entitlement
 */
export function checkProEntitlement(customerInfo) {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Get available offerings (products/packages)
 */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('[RevenueCat] No current offering configured');
      return null;
    }

    return {
      current: offerings.current,
      monthly: offerings.current.monthly,
      yearly: offerings.current.annual,
      lifetime: offerings.current.lifetime,
      allPackages: offerings.current.availablePackages
    };
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    throw error;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(packageToPurchase) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    const isPro = checkProEntitlement(customerInfo);


    return {
      success: true,
      customerInfo,
      isPro
    };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }

    console.error('[RevenueCat] Purchase failed:', error);
    throw error;
  }
}

/**
 * Purchase a specific product by ID
 */
export async function purchaseProduct(productId) {
  try {
    const offerings = await getOfferings();

    if (!offerings) {
      throw new Error('No offerings available');
    }

    // Find the package with this product
    const package_ = offerings.allPackages.find(
      pkg => pkg.product.identifier === productId
    );

    if (!package_) {
      throw new Error(`Product ${productId} not found in offerings`);
    }

    return purchasePackage(package_);
  } catch (error) {
    console.error('[RevenueCat] Purchase product failed:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = checkProEntitlement(customerInfo);


    return {
      success: true,
      customerInfo,
      isPro,
      restored: customerInfo.allPurchasedProductIdentifiers.length > 0
    };
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    throw error;
  }
}

/**
 * Set user attributes for analytics
 */
export async function setUserAttributes(attributes) {
  try {
    if (attributes.email) {
      await Purchases.setEmail(attributes.email);
    }
    if (attributes.displayName) {
      await Purchases.setDisplayName(attributes.displayName);
    }
    // Custom attributes
    if (attributes.custom) {
      for (const [key, value] of Object.entries(attributes.custom)) {
        await Purchases.setAttributes({ [key]: value });
      }
    }
  } catch (error) {
    console.error('[RevenueCat] Failed to set attributes:', error);
  }
}

/**
 * Login/identify user (for cross-device sync)
 */
export async function loginUser(appUserID) {
  try {
    const { customerInfo } = await Purchases.logIn(appUserID);
    return {
      customerInfo,
      isPro: checkProEntitlement(customerInfo)
    };
  } catch (error) {
    console.error('[RevenueCat] Login failed:', error);
    throw error;
  }
}

/**
 * Logout user (revert to anonymous)
 */
export async function logoutUser() {
  try {
    const customerInfo = await Purchases.logOut();
    return {
      customerInfo,
      isPro: checkProEntitlement(customerInfo)
    };
  } catch (error) {
    console.error('[RevenueCat] Logout failed:', error);
    throw error;
  }
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoUpdateListener(callback) {
  return Purchases.addCustomerInfoUpdateListener(callback);
}

/**
 * Get subscription management URL
 */
export async function getManagementURL() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch (error) {
    console.error('[RevenueCat] Failed to get management URL:', error);
    return null;
  }
}

/**
 * Check if user is eligible for intro pricing
 */
export async function checkTrialEligibility(productIds) {
  try {
    // Note: This is iOS only, returns empty on Android
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
    return eligibility;
  } catch (error) {
    console.error('[RevenueCat] Failed to check eligibility:', error);
    return {};
  }
}

export default {
  initialize: initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  purchaseProduct,
  restorePurchases,
  setUserAttributes,
  loginUser,
  logoutUser,
  addCustomerInfoUpdateListener,
  getManagementURL,
  checkTrialEligibility,
  checkProEntitlement,
  ENTITLEMENT_ID,
  PRODUCT_IDS
};
