# Firebase Setup Guide for MorningWin

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it: `morningwin-app`
4. Accept the defaults
5. Create

## 2. Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable:
   - **Google** (Get API key from Google Cloud Console)
   - **Apple** (Requires Apple Developer account)
3. Add authorized domains (your app's domain)

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Create database in test mode (for MVP)
3. Choose region: `us-central1` (or closest to your users)
4. Create

## 4. Collection Structure

Create these collections:

### `users` collection
```
{
  userId: {
    email: "user@example.com",
    createdAt: timestamp,
    currentStreak: 0,
    bestStreak: 0,
    streakHistory: {
      "2024-01-15": true,
      "2024-01-16": false,
    },
    isPro: false,
    trialEndDate: null,
    lastUpdated: timestamp,
  }
}
```

### `activities` collection (optional, for analytics)
```
{
  activityId: {
    userId: "user123",
    eventName: "morning_completed",
    data: {...},
    timestamp: timestamp,
  }
}
```

## 5. Firestore Security Rules

Replace default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Activities - users can write their own
    match /activities/{activityId} {
      allow write: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId;
    }
    
    // Public analytics (read-only)
    match /analytics/{document=**} {
      allow read: if true;
    }
  }
}
```

## 6. Get Your Firebase Config

1. Go to **Project Settings** → **Your apps**
2. Click the iOS/Android/Web app
3. Copy the config object

Your `firebase.js` should look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "morningwin-app.firebaseapp.com",
  projectId: "morningwin-app",
  storageBucket: "morningwin-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 7. Optional: Cloud Functions

For streak recovery and advanced features:

### Install Firebase Functions CLI
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Deploy streak recovery function

`functions/index.js`:
```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.recoverStreak = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error("Not authenticated");

  const userId = context.auth.uid;
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) throw new Error("User not found");

  const userData = userDoc.data();
  const lastRecoveryMonth = userData.lastRecoveryMonth || null;
  const currentMonth = new Date().toISOString().substring(0, 7);

  if (lastRecoveryMonth === currentMonth) {
    throw new Error("Already recovered this month");
  }

  // Increment streak
  await userRef.update({
    currentStreak: userData.currentStreak + 1,
    lastRecoveryMonth: currentMonth,
  });

  return { success: true, newStreak: userData.currentStreak + 1 };
});
```

Deploy:
```bash
firebase deploy --only functions
```

## 8. Enable Cloud Messaging (Optional)

For push notifications via Firebase (alternative to Expo):

1. Go to **Cloud Messaging** tab
2. Upload APNS certificate (iOS)
3. Get Server Key (Android)

## Testing

### Test in Firestore Console

1. Go to **Firestore** → **Data**
2. Manually create test user document
3. Update values
4. Observe in your app

### Test Authentication

```javascript
// In Firebase Console → Authentication
// Create test user:
// Email: test@example.com
// Password: Test123!
```

## Production Checklist

Before launching:

- [ ] Switch from test mode to production mode
- [ ] Update security rules to be restrictive
- [ ] Enable backups
- [ ] Set up monitoring/alerts
- [ ] Enable Analytics
- [ ] Configure billing alerts
- [ ] Test on real iOS/Android devices

## Pricing

**Firestore Free Tier:**
- 1GB storage
- 50k reads/day
- 20k writes/day
- 20k deletes/day

**For 1000 users completing routine daily:** ~20k writes/day = fits in free tier! ✅

**Growth beyond free tier:** ~$0.06 per 100k writes

---

Keep it simple. Scale when needed. 🚀
