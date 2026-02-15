import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationServices = {
  // Request permissions
  requestPermissions: async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Schedule daily notification
  scheduleDailyReminder: async (hour = 6, minute = 0) => {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Calculate seconds until next notification
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hour, minute, 0, 0);

      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const secondsUntilNotification = Math.floor(
        (notificationTime - now) / 1000
      );

      // Schedule notification to repeat daily
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Win your morning!',
          body: 'Your routine is waiting. Start now.',
          data: { screen: 'home' },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          seconds: secondsUntilNotification,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  },

  // Cancel all notifications
  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },

  // Get scheduled notifications
  getScheduledNotifications: async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      return [];
    }
  },

  // Show immediate notification (for testing)
  showImmediateNotification: async () => {
    try {
      await Notifications.presentNotificationAsync({
        title: '🔥 Win your morning!',
        body: 'Your routine is waiting. Start now.',
        data: { screen: 'home' },
        sound: 'default',
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },

  // Listen to notification responses
  listenToNotifications: (callback) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        callback(response.notification.request.content.data);
      }
    );

    return subscription;
  },
};
