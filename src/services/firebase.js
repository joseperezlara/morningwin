import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase Config (REPLACE WITH YOUR CONFIG)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'morningwin-app.firebaseapp.com',
  projectId: 'morningwin-app',
  storageBucket: 'morningwin-app.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Firebase Services
export const firebaseServices = {
  // Save user streak to Firestore
  saveUserStreak: async (userId, streakData) => {
    try {
      await db.collection('users').doc(userId).update({
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        streakHistory: streakData.streakHistory,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  },

  // Get user data from Firestore
  getUserData: async (userId) => {
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists() ? doc.data() : null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  // Create user document
  createUserDocument: async (userId, email) => {
    try {
      await db.collection('users').doc(userId).set({
        email,
        createdAt: new Date(),
        currentStreak: 0,
        bestStreak: 0,
        streakHistory: {},
        isPro: false,
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  },

  // Log event for analytics
  logEvent: (eventName, data = {}) => {
    try {
      logEvent(analytics, eventName, data);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  },
};
