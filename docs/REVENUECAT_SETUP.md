# RevenueCat Setup Guide for MorningWin

## 1. Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up
3. Create workspace: "MorningWin"

## 2. Create Apps in RevenueCat

### Create iOS App
1. **Apps** → **Add app**
2. Name: "MorningWin iOS"
3. Platform: iOS
4. Bundle ID: `com.morningwin.app`
5. Save API key: `appl_xxxxx`

### Create Android App
1. **Apps** → **Add app**
2. Name: "MorningWin Android"
3. Platform: Android
4. Package name: `com.morningwin.app`
5. Save API key: `goog_xxxxx`

## 3. Create Entitlements

These define what Pro users get:

1. Go to **Products** → **Entitlements**
2. Click **Create**
3. Entitlement ID: `pro`
4. Display name: "Pro Membership"
5. Save

## 4. Create Products (Packages)

### Monthly Subscription

1. **Products** → **Products**
2. **Create product**
3. Product ID: `monthly_pro`
4. Name: "MorningWin Pro Monthly"
5. Type: **Subscription**
6. Billing period: **Monthly**
7. Entitlements: Select `pro`
8. Save
9. Platforms: Add iOS & Android (configure pricing next)

### Yearly Subscription

1. **Create product**
2. Product ID: `yearly_pro`
3. Name: "MorningWin Pro Yearly"
4. Type: **Subscription**
5. Billing period: **Yearly**
6. Entitlements: Select `pro`
7. Save
8. Platforms: Add iOS & Android

## 5. Configure Offerings

**Offerings** are how you present packages to users:

1. **Products** → **Offerings**
2. **Create**
3. Identifier: `default`
4. Packages:
   - Monthly: `monthly_pro`
   - Yearly: `yearly_pro`
5. Default package: `yearly_pro`
6. Save

## 6. App Store Connect Setup (iOS)

### Create In-App Purchase

1. Go to **App Store Connect** → Your app
2. **In-App Purchases** → **Create**
3. Type: **Auto-Renewable Subscription**
4. Reference Name: "MorningWin Pro Monthly"
5. Product ID: `com.morningwin.app.monthly_pro`
6. Billing Cycles: Monthly
7. Pricing: $8.99 USD
8. (Add other countries as needed)
9. Save

### Repeat for yearly:
- Reference Name: "MorningWin Pro Yearly"
- Product ID: `com.morningwin.app.yearly_pro`
- Billing Cycles: Yearly
- Pricing: $49.99 USD

### Link RevenueCat to App Store

1. In RevenueCat, go to **Products** → **monthly_pro**
2. Under iOS section:
   - Product ID: `com.morningwin.app.monthly_pro`
   - Shared secret: Get from **App Store Connect** → **Subscriptions** → **Shared Secret**
3. Repeat for yearly
4. Save

## 7. Google Play Setup (Android)

### Create In-App Product

1. Go to **Google Play Console** → Your app
2. **Monetization setup** → **Create new product**
3. Product ID: `monthly_pro`
4. Product type: **Subscription**
5. Default price: $8.99 USD
6. Billing period: Monthly
7. (Add other countries)
8. Create

### Repeat for yearly:
- Product ID: `yearly_pro`
- Default price: $49.99 USD
- Billing period: Yearly

### Link RevenueCat to Google Play

1. In RevenueCat, go to **Products** → **monthly_pro**
2. Under Android section:
   - Product ID: `monthly_pro`
   - Service Account JSON: Get from Google Play Console
3. Repeat for yearly
4. Save

## 8. Update MorningWin Code

### Update `src/services/revenuecat.js`

```javascript
const REVENUECAT_API_KEY_IOS = 'appl_xxxxx';  // From step 2
const REVENUECAT_API_KEY_ANDROID = 'goog_xxxxx';  // From step 2
```

### Update `app.json` (Expo config)

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "apiKey": "appl_xxxxx",  // iOS
          "googleApiKey": "goog_xxxxx"  // Android
        }
      ]
    ]
  }
}
```

## 9. Testing

### Sandbox Testing (iOS)

1. In App Store Connect, create **Sandbox Apple ID**
2. In Xcode, Settings → Accounts → Add sandbox account
3. On simulator, Settings → App Store → Sign in with sandbox account
4. Purchases are **FREE** in sandbox 🎉

### Test User (Android)

1. In Google Play Console, add test account
2. Install app as test user
3. Purchases are **FREE** in test

### Test in RevenueCat

1. Go to RevenueCat dashboard
2. **Customers** → Search for your test user
3. Manually add entitlement for testing
4. Verify in your app with `revenueCatServices.hasEntitlement('pro')`

## 10. Entitlements & Paywall Logic

In your code:

```javascript
// Check if user is Pro
const isPro = await revenueCatServices.hasEntitlement('pro');

// If not Pro, show paywall
if (!isPro) {
  return <PaywallScreen />;
}

// If Pro, show full stats
return <StatsScreen />;
```

## 11. Attribution (Analytics)

Optionally track user data:

```javascript
import Purchases from 'react-native-purchases';

// Set user ID
await Purchases.setEmail('user@example.com');

// Or custom attributes
await Purchases.setAttributes({
  country: 'US',
  source: 'organic',
});
```

## 12. Production Checklist

Before launch:

- [ ] Switch from Sandbox/Test to Production in RevenueCat
- [ ] Verify pricing in all currencies
- [ ] Test purchase flow end-to-end on real device
- [ ] Verify receipts in App Store Connect
- [ ] Monitor RevenueCat dashboard for errors
- [ ] Set up Slack/email notifications for failed transactions
- [ ] Enable analytics in RevenueCat

## 13. Common Issues

### "Invalid Product IDs"
- Verify Product ID matches App Store Connect / Google Play
- Make sure it's created and published

### "Can't connect to App Store"
- Check sandbox Apple ID credentials
- Restart device
- Clear app cache

### Trial doesn't activate
- Verify `entitlements` setup in RevenueCat
- Confirm trial length in App Store Connect / Google Play
- Check RevenueCat logs

## 14. Pricing by Country

RevenueCat auto-converts $8.99 → local currency:
- 🇲🇽 Mexico: ~$160 MXN
- 🇧🇷 Brazil: ~R$ 45
- 🇦🇷 Argentina: ~$700 ARS
- 🇪🇸 Spain: €8.49
- 🇬🇧 UK: £6.99

You can customize per country in RevenueCat.

---

**Pro tip:** Start with iOS + US for MVP. Add Android + other countries after launch. 🚀
