import Purchases from 'react-native-purchases';

// RevenueCat API Keys (REPLACE WITH YOUR KEYS)
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_API_KEY';

export const setupRevenueCat = async () => {
  try {
    // Set the API key
    await Purchases.configure({
      apiKey: Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID,
    });

    // Optional: Set email to track across devices
    // await Purchases.setEmail('user@example.com');

    return true;
  } catch (error) {
    console.error('Error setting up RevenueCat:', error);
    return false;
  }
};

export const revenueCatServices = {
  // Get available packages
  getAvailablePackages: async () => {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  },

  // Check if user is pro
  isPro: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active['pro'] !== undefined;
    } catch (error) {
      console.error('Error checking pro status:', error);
      return false;
    }
  },

  // Start subscription
  purchasePackage: async (package_) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(package_);
      return {
        success: true,
        customerInfo,
        isPro: customerInfo.entitlements.active['pro'] !== undefined,
      };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Error purchasing package:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Start free trial
  startFreeTrial: async (package_) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(package_);
      return {
        success: true,
        customerInfo,
        isPro: customerInfo.entitlements.active['pro'] !== undefined,
      };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Error starting trial:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get customer info
  getCustomerInfo: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error fetching customer info:', error);
      return null;
    }
  },

  // Restore purchases
  restorePurchases: async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return {
        success: true,
        isPro: customerInfo.entitlements.active['pro'] !== undefined,
      };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Check entitlements
  hasEntitlement: async (entitlementId) => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('Error checking entitlement:', error);
      return false;
    }
  },
};
