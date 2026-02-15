import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useMorningWinStore } from '../store';
import { format } from 'date-fns';
import { firebaseServices } from '../services/firebase';

const HomeScreen = ({ navigation }) => {
  const {
    tasks,
    currentStreak,
    markTaskComplete,
    markTaskIncomplete,
    completeDay,
    isRoutineComplete,
    resetDay,
    userId,
    lastCompletedDate,
  } = useMorningWinStore();

  const [animatedStreak] = useState(new Animated.Value(0));
  const [showCelebration, setShowCelebration] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Reset tasks if new day
  useEffect(() => {
    if (lastCompletedDate && lastCompletedDate !== today) {
      resetDay();
    }
  }, [today]);

  // Check if routine is complete and show celebration
  useEffect(() => {
    if (isRoutineComplete() && lastCompletedDate === today) {
      setShowCelebration(true);
      Animated.sequence([
        Animated.timing(animatedStreak, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Save to Firebase
      if (userId) {
        firebaseServices.saveUserStreak(userId, {
          currentStreak,
          bestStreak: useMorningWinStore.getState().bestStreak,
          streakHistory: useMorningWinStore.getState().streakHistory,
        });
      }
    }
  }, [isRoutineComplete()]);

  const handleTaskToggle = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task.completed) {
      markTaskIncomplete(taskId);
    } else {
      markTaskComplete(taskId);
    }
  };

  const handleCompleteDay = () => {
    if (isRoutineComplete()) {
      completeDay();
      // Log to analytics
      firebaseServices.logEvent('morning_completed', {
        streak: currentStreak + 1,
        date: today,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header con racha */}
      <View style={styles.header}>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [
                {
                  scale: animatedStreak.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </Animated.View>
      </View>

      {/* Título */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Win Your Morning</Text>
        <Text style={styles.subtitle}>Complete your routine before 9am</Text>
      </View>

      {/* Tareas */}
      <View style={styles.tasksContainer}>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskItem, task.completed && styles.taskCompleted]}
            onPress={() => handleTaskToggle(task.id)}
          >
            <View style={styles.taskCheckbox}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
              style={[
                styles.taskText,
                task.completed && styles.taskTextCompleted,
              ]}
            >
              {task.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botón Complete */}
      {isRoutineComplete() ? (
        <TouchableOpacity
          style={[styles.completeButton, styles.completeButtonActive]}
          onPress={handleCompleteDay}
        >
          <Text style={styles.completeButtonText}>🎉 Complete Morning!</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completeButton}>
          <Text style={styles.completeButtonDisabled}>
            {tasks.filter((t) => t.completed).length}/{tasks.length} done
          </Text>
        </View>
      )}

      {/* Celebration Message */}
      {showCelebration && (
        <View style={styles.celebrationMessage}>
          <Text style={styles.celebrationText}>
            🌟 You're on a {currentStreak} day streak! Keep it up!
          </Text>
        </View>
      )}

      {/* Stats Preview (gratis, sin detalles) */}
      <View style={styles.statsPreview}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Stats')}
          style={styles.statsButton}
        >
          <Text style={styles.statsButtonText}>View Stats 📊</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  titleSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  tasksContainer: {
    marginBottom: 30,
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskCompleted: {
    borderColor: '#00ff00',
    backgroundColor: '#f0fff0',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  taskTextCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  completeButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  completeButtonActive: {
    backgroundColor: '#000',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  completeButtonDisabled: {
    color: '#999',
    fontSize: 14,
  },
  celebrationMessage: {
    backgroundColor: '#fff3cd',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  celebrationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsPreview: {
    marginBottom: 40,
  },
  statsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  statsButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default HomeScreen;
