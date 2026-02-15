import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default morning routine tasks
const DEFAULT_TASKS = [
  { id: '1', title: 'Wake up (on time)', completed: false },
  { id: '2', title: 'Make bed', completed: false },
  { id: '3', title: 'Drink water', completed: false },
  { id: '4', title: 'Move body (5 min)', completed: false },
  { id: '5', title: 'No phone (10 min)', completed: false },
];

export const useMorningWinStore = create(
  persist(
    (set, get) => ({
      // User & Auth
      userId: null,
      isAuthenticated: false,
      isPro: false,
      trialEndDate: null,
      
      // Tasks & Routine
      tasks: DEFAULT_TASKS,
      lastCompletedDate: null,
      
      // Streak
      currentStreak: 0,
      bestStreak: 0,
      streakHistory: {}, // { "2024-01-15": true, "2024-01-16": false }
      
      // Settings
      reminderTime: '06:00',
      reminderEnabled: true,
      
      // Actions
      setUser: (userId, isAuthenticated, isPro = false) =>
        set({ userId, isAuthenticated, isPro }),
      
      setTrialEndDate: (date) => set({ trialEndDate: date }),
      
      markTaskComplete: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          ),
        })),
      
      markTaskIncomplete: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: false } : task
          ),
        })),
      
      completeDay: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          const newHistory = { ...state.streakHistory, [today]: true };
          const newStreak = state.currentStreak + 1;
          const newBest = Math.max(state.bestStreak, newStreak);
          
          return {
            lastCompletedDate: today,
            currentStreak: newStreak,
            bestStreak: newBest,
            streakHistory: newHistory,
            tasks: DEFAULT_TASKS, // Reset tasks for next day
          };
        });
      },
      
      missDay: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          currentStreak: 0,
          streakHistory: { ...state.streakHistory, [today]: false },
          tasks: DEFAULT_TASKS,
        }));
      },
      
      recoverStreak: () => {
        // Pro feature: recover one missed day per month
        set((state) => ({
          currentStreak: state.currentStreak + 1,
        }));
      },
      
      resetDay: () => {
        set({ tasks: DEFAULT_TASKS });
      },
      
      setReminderTime: (time) => set({ reminderTime: time }),
      
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      
      // Get computed values
      isRoutineComplete: () => {
        const { tasks } = get();
        return tasks.every((task) => task.completed);
      },
      
      getMonthlyCompletionPercentage: () => {
        const { streakHistory } = get();
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        let completed = 0;
        let total = 0;
        
        for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (streakHistory[dateStr] !== undefined) {
            total++;
            if (streakHistory[dateStr]) completed++;
          }
        }
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      },
      
      getStreakHistory: () => get().streakHistory,
    }),
    {
      name: 'morningwin-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
