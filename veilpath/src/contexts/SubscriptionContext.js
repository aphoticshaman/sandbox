/**
 * Subscription Context
 * Provides subscription state throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import RevenueCat, {
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  addCustomerInfoUpdateListener,
  checkProEntitlement,
  ENTITLEMENT_ID
} from '../services/revenueCatService';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize RevenueCat on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize SDK
        const success = await initializeRevenueCat();
        if (!success) {
          throw new Error('Failed to initialize RevenueCat');
        }

        // Get initial customer info
        const info = await getCustomerInfo();
        setCustomerInfo(info.customerInfo);
        setIsPro(info.isPro);

        // Get offerings
        const offers = await getOfferings();
        setOfferings(offers);

        setIsInitialized(true);
      } catch (err) {
        console.error('[SubscriptionContext] Init error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Listen for customer info updates
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPro(checkProEntitlement(info));
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInitialized]);

  // Purchase a package
  const purchase = useCallback(async (packageToPurchase) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await purchasePackage(packageToPurchase);

      if (result.success) {
        setCustomerInfo(result.customerInfo);
        setIsPro(result.isPro);
        return { success: true };
      } else if (result.cancelled) {
        return { success: false, cancelled: true };
      }

      return { success: false };
    } catch (err) {
      console.error('[SubscriptionContext] Purchase error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await restorePurchases();

      setCustomerInfo(result.customerInfo);
      setIsPro(result.isPro);

      return {
        success: true,
        restored: result.restored,
        isPro: result.isPro
      };
    } catch (err) {
      console.error('[SubscriptionContext] Restore error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh customer info
  const refresh = useCallback(async () => {
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info.customerInfo);
      setIsPro(info.isPro);
      return info;
    } catch (err) {
      console.error('[SubscriptionContext] Refresh error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    // State
    isInitialized,
    isPro,
    customerInfo,
    offerings,
    isLoading,
    error,

    // Computed
    tier: isPro ? 'premium' : 'free',
    hasLifetime: customerInfo?.allPurchasedProductIdentifiers?.includes('lifetime'),
    activeSubscription: customerInfo?.activeSubscriptions?.[0] || null,

    // Actions
    purchase,
    restore,
    refresh,

    // Direct access to packages
    monthlyPackage: offerings?.monthly || null,
    yearlyPackage: offerings?.yearly || null,
    lifetimePackage: offerings?.lifetime || null
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
