# Deployment Guide - MorningWin

## Pre-Launch Checklist

### Code Quality
- [ ] Remove console.logs (except errors)
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test on slow network (WiFi throttle)
- [ ] No broken links or placeholder text
- [ ] No hardcoded API keys (use environment variables)

### Functionality
- [ ] Onboarding flow complete
- [ ] Daily reminder sends correctly
- [ ] Streak increments properly
- [ ] Paywall triggers at right time
- [ ] Pro features behind paywall
- [ ] Data persists after app close
- [ ] No crashes on rapid interactions

### Design & UX
- [ ] Consistent spacing/colors
- [ ] Readable on all screen sizes
- [ ] Buttons are 44pt minimum (touch target)
- [ ] No spelling errors
- [ ] Fast app launch (<2 seconds)

### Firebase
- [ ] Production rules applied
- [ ] Billing alerts set up
- [ ] Backups enabled
- [ ] Error monitoring configured

### RevenueCat
- [ ] All products published
- [ ] Prices set correctly
- [ ] Test purchases work
- [ ] Sandbox accounts ready
- [ ] Entitlements working

## Step 1: Build with EAS (Expo)

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Configure EAS

Create `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

### Build for iOS

```bash
# First time: setup Apple account
eas build --platform ios --auto-submit

# Output: App.ipa file ready for App Store
```

### Build for Android

```bash
# First time: setup Google Play account
eas build --platform android

# Output: app-release.aab (Android App Bundle)
```

## Step 2: Submit to App Stores

### iOS App Store

#### 1. App Store Connect Setup
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Create app entry
- Fill metadata:
  - App name: "MorningWin"
  - Category: "Health & Fitness" or "Productivity"
  - Description: "Dead-simple morning routine app. Win your mornings before 9am."
  - Keywords: "routine, habit, productivity, streak"
  - Support URL, Privacy Policy URL

#### 2. Submitting Build
```bash
eas submit --platform ios
```

Follow prompts:
- Apple ID
- App password (generate in Apple ID settings)
- Upload binary

#### 3. App Review
- Apple reviews for ~24-48 hours
- Most common rejection: "Exactly matches App Store guidelines for health apps"
  → Fix: Ensure app is lifestyle/habit builder, not medical
- Once approved → "Ready for Sale"

### Google Play Store

#### 1. Google Play Console Setup
- Go to [Google Play Console](https://play.google.com/console)
- Create app entry
- Fill metadata:
  - App name: "MorningWin"
  - Category: "Health & Fitness"
  - Description: Same as iOS
  - Screenshot (5): Show streak, checklist, stats screen

#### 2. Content Rating
- Fill questionnaire (~5 min)
- Submit
- Usually approved instantly

#### 3. Pricing & Distribution
- Set price: $8.99 USD
- Select countries (or worldwide)
- Save

#### 4. Submitting Build
```bash
eas submit --platform android
```

Follow prompts:
- Google Play Service Account JSON
- Upload AAB file

#### 5. App Review
- Google reviews within 2-4 hours
- Usually approved same day

## Step 3: Post-Launch

### Day 1
- [ ] Monitor crash logs (Firebase Crashlytics)
- [ ] Check for rating/review trends
- [ ] Monitor server load (Firestore)
- [ ] Verify push notifications working

### Week 1
- [ ] Collect 50+ reviews/ratings
- [ ] Monitor conversion rate to Pro
- [ ] Check churn (daily active users)
- [ ] Monitor analytics funnel

### Month 1
- [ ] Respond to 1-star reviews
- [ ] Fix bugs reported by users
- [ ] Optimize onboarding based on drop-off
- [ ] A/B test paywall copy

## Updates & Iteration

### Releasing v0.1.1 (Bug Fix)

```bash
# Update version in app.json
{
  "expo": {
    "version": "0.1.1"
  }
}

# Rebuild
eas build --platform ios --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Review time:** ~1-2 days per store

### Releasing v0.2.0 (New Features)

Same process, but:
- Update metadata with new features
- Add screenshots if major UI changes
- Write release notes for changelog

## Monitoring & Analytics

### Firebase Console
```
Dashboard → Crash reports
Dashboard → User growth
Firestore → Database usage
```

### RevenueCat Dashboard
```
Revenue → Total MRR
Customers → Retention rate
Metrics → Lifetime value (LTV)
```

### Custom Analytics

Track key events:
```javascript
firebaseServices.logEvent('morning_completed', {
  streak: currentStreak,
  date: today,
});

firebaseServices.logEvent('paywall_shown', {
  context: 'stats_view',
});

firebaseServices.logEvent('converted_to_pro', {
  trial: true,
  package: 'monthly',
});
```

## Cost Breakdown (Monthly)

| Service | Free | Paid |
|---------|------|------|
| **Expo EAS Build** | - | $39/month |
| **Firebase** | Up to 1000 users free | $6-20 |
| **RevenueCat** | Free (0% cut) | Free (0% cut) |
| **Domain + Email** | - | $5-10 |
| **Total** | **$0** | **~$50-70** |

💡 Tip: Stay in free tier first, scale infrastructure after 1000+ DAU.

## Growth Tips

### Week 1-2: Soft Launch
- Launch on ProductHunt
- Ask 10 friends to use + review
- Post on TikTok (showing morning routine POVs)
- Target: 100-500 downloads

### Week 3-4: Viral Content
- Post morning routine results
- "I built an app to stop procrastinating mornings"
- Ask for reviews in-app after 3rd day streak
- Target: 1000-5000 downloads

### Month 2: Paid Channel
- Run $100-200 TikTok ads
- Retarget via email
- Target: 10,000+ downloads
- 2-5% conversion to Pro = $50-100 MRR

## Troubleshooting Deploy Issues

### Build fails
```bash
# Clean build
eas build --platform ios --clear-cache

# Check logs
eas build --platform ios --wait
```

### App crashes on launch
- Check Firebase initialization
- Verify RevenueCat API keys
- Check AsyncStorage read

### Paywall won't show
- Verify RevenueCat entitlements
- Check network connectivity
- Ensure user isn't cached as Pro

### Push notifications not sending
- iOS: Verify APNS certificate in Firebase
- Android: Verify FCM setup
- Check notification permissions granted

---

**You've got this.** Ship it. Learn from users. Iterate. 🚀
