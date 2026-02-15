import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useMorningWinStore } from '../store';
import { revenueCatServices } from '../services/revenuecat';
import { notificationServices } from '../services/notifications';

const SettingsScreen = ({ navigation }) => {
  const {
    reminderTime,
    reminderEnabled,
    isPro,
    setReminderTime,
    setReminderEnabled,
  } = useMorningWinStore();

  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);

  const handleToggleReminders = async () => {
    setIsUpdatingReminder(true);

    if (!reminderEnabled) {
      // Enable reminders
      await notificationServices.scheduleDailyReminder(6, 0);
    } else {
      // Disable reminders
      await notificationServices.cancelAllNotifications();
    }

    setReminderEnabled(!reminderEnabled);
    setIsUpdatingReminder(false);
  };

  const handleManageSubscription = async () => {
    if (isPro) {
      // In production, open the App Store or Google Play for subscription management
      // For now, just show a message
      alert('Manage subscription in your device settings');
    } else {
      navigation.navigate('Stats'); // Goes to paywall
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Morning Reminder</Text>
              <Text style={styles.settingSubtext}>
                {reminderEnabled ? 'Enabled at 6:00 AM' : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminders}
              disabled={isUpdatingReminder}
              trackColor={{ false: '#ccc', true: '#bbb' }}
              thumbColor={reminderEnabled ? '#000' : '#fff'}
            />
          </View>
        </View>

        {/* Account Section */}
        {isPro && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.settingButtonText}>Manage Subscription</Text>
              <Text style={styles.settingButtonArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>0.1.0</Text>
          </View>

          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Privacy Policy</Text>
            <Text style={styles.settingButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Terms of Service</Text>
            <Text style={styles.settingButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  settingButtonArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  dangerButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
  },
});

export default SettingsScreen;
