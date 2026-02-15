import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useMorningWinStore } from '../store';
import { firebaseServices } from '../services/firebase';
import { notificationServices } from '../services/notifications';

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const setUser = useMorningWinStore((state) => state.setUser);
  const setReminderTime = useMorningWinStore((state) => state.setReminderTime);

  const handleNameInput = (text) => {
    setName(text);
  };

  const handleNext = async () => {
    if (step === 0) {
      // Name step
      if (name.trim()) {
        setStep(1);
      }
    } else if (step === 1) {
      // Notification time step
      // Continue
      setStep(2);
    } else if (step === 2) {
      // Final - start app
      // Set user
      setUser('guest-user', true); // In production, use real Firebase auth
      
      // Request notification permissions
      const allowed = await notificationServices.requestPermissions();
      
      if (allowed) {
        await notificationServices.scheduleDailyReminder(6, 0);
      }

      // Log event
      firebaseServices.logEvent('onboarding_complete');

      // Navigate to home
      navigation.replace('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} scrollEnabled={false}>
        {step === 0 && (
          <OnboardingStep0 onNameChange={handleNameInput} name={name} />
        )}
        {step === 1 && <OnboardingStep1 />}
        {step === 2 && <OnboardingStep2 />}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={
            (step === 0 && !name.trim()) || (step === 1 && !name.trim())
              ? styles.buttonDisabled
              : styles.button
          }
          onPress={handleNext}
          disabled={(step === 0 && !name.trim()) || (step === 1 && !name.trim())}
        >
          <Text style={styles.buttonText}>
            {step === 2 ? 'Start' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const OnboardingStep0 = ({ onNameChange, name }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.emoji}>🔥</Text>
    <Text style={styles.title}>Win Your Mornings</Text>
    <Text style={styles.subtitle}>
      Simple routines, serious discipline. Build your streak before 9am every day.
    </Text>

    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>What's your name?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#ccc"
        value={name}
        onChangeText={onNameChange}
      />
    </View>
  </View>
);

const OnboardingStep1 = () => (
  <View style={styles.stepContainer}>
    <Text style={styles.emoji}>⏰</Text>
    <Text style={styles.title}>Set Your Reminder</Text>
    <Text style={styles.subtitle}>
      We'll remind you each morning. What time works best?
    </Text>

    <View style={styles.timeOptions}>
      {['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM'].map((time) => (
        <TouchableOpacity key={time} style={styles.timeOption}>
          <Text style={styles.timeText}>{time}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const OnboardingStep2 = () => (
  <View style={styles.stepContainer}>
    <Text style={styles.emoji}>✅</Text>
    <Text style={styles.title}>Ready to Win?</Text>
    <Text style={styles.subtitle}>
      Your 5-task morning routine is ready. Complete it before 9am to build your streak.
    </Text>

    <View style={styles.taskPreview}>
      {['Wake up (on time)', 'Make bed', 'Drink water', 'Move body (5 min)', 'No phone (10 min)'].map(
        (task, idx) => (
          <View key={idx} style={styles.previewTask}>
            <Text style={styles.previewCheckbox}>☐</Text>
            <Text style={styles.previewTaskText}>{task}</Text>
          </View>
        )
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  timeOptions: {
    gap: 12,
    width: '100%',
  },
  timeOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskPreview: {
    width: '100%',
    gap: 12,
  },
  previewTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  previewCheckbox: {
    fontSize: 20,
    marginRight: 12,
  },
  previewTaskText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    paddingVertical: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    paddingVertical: 16,
    backgroundColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default OnboardingScreen;

// Import TextInput
import { TextInput } from 'react-native';
