import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, Modal, ActivityIndicator, Share, useColorScheme } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'morningwin-app',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'morningwin-app.firebaseapp.com',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCesd8LVdz5B28UFHGo-elEwo49w2YeQ2Q',
  appId: '1:95677741192:web:' + Math.random().toString(36).substring(7),
};

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY || 'fallback-key-for-demo';

// Initialize Firebase
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ==================== THEME SYSTEM ====================
const THEMES = {
  light: {
    // Backgrounds
    bg: '#ffffff',
    bgSecondary: '#f5f5f5',
    bgCard: '#f9f9f9',
    bgInput: '#fafafa',
    bgDisabled: '#f0f0f0',

    // Text
    textPrimary: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    textPlaceholder: '#999999',

    // Borders
    border: '#f0f0f0',
    borderInput: '#dddddd',

    // Accents
    accent: '#000000',
    accentText: '#ffffff',
    green: '#00ff00',
    greenBg: '#f0fff0',
    greenBorder: '#00ff00',
    red: '#c62828',
    redBg: '#ffebee',
    redBorder: '#f44336',
    blue: '#0066cc',

    // Buttons
    btnPrimary: '#000000',
    btnPrimaryText: '#ffffff',
    btnSecondary: '#f5f5f5',
    btnSecondaryText: '#000000',
    btnSecondaryBorder: '#dddddd',

    // Switch
    switchTrackOn: '#81c784',
    switchTrackOff: '#f0f0f0',
    switchThumbOn: '#00ff00',
    switchThumbOff: '#f0f0f0',

    // Special
    progressBg: '#f0f0f0',
    coachOverlay: 'rgba(0, 0, 0, 0.7)',
    premiumBtnBg: '#000000',
  },
  dark: {
    // Backgrounds — iOS dark gray palette
    bg: '#1c1c1e',
    bgSecondary: '#2c2c2e',
    bgCard: '#2c2c2e',
    bgInput: '#3a3a3c',
    bgDisabled: '#3a3a3c',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#ebebf5cc',
    textMuted: '#ebebf599',
    textPlaceholder: '#636366',

    // Borders
    border: '#3a3a3c',
    borderInput: '#48484a',

    // Accents
    accent: '#ffffff',
    accentText: '#000000',
    green: '#30d158',
    greenBg: '#1a2e1a',
    greenBorder: '#30d158',
    red: '#ff453a',
    redBg: '#2d1515',
    redBorder: '#ff453a',
    blue: '#0a84ff',

    // Buttons
    btnPrimary: '#ffffff',
    btnPrimaryText: '#000000',
    btnSecondary: '#3a3a3c',
    btnSecondaryText: '#ffffff',
    btnSecondaryBorder: '#48484a',

    // Switch
    switchTrackOn: '#30d158',
    switchTrackOff: '#3a3a3c',
    switchThumbOn: '#30d158',
    switchThumbOff: '#636366',

    // Special
    progressBg: '#3a3a3c',
    coachOverlay: 'rgba(0, 0, 0, 0.85)',
    premiumBtnBg: '#ffffff',
  }
};

// ==================== NOTIFICATION SERVICE ====================
class NotificationService {
  constructor() {
    this.requestPermission();
  }

  requestPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        console.log('Notificaciones habilitadas');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }

  sendNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '🔥',
        badge: '🔥',
        ...options
      });
    }
  }
}

const notificationService = new NotificationService();

// ==================== FIREBASE SERVICE (REAL) ====================
class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.unsubscribeAuth = null;
    this.unsubscribeProgress = null;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    const fakeDomains = ['yomero.com', 'test.com', 'example.com', 'fake.com'];
    const domain = email.split('@')[1].toLowerCase();
    if (fakeDomains.includes(domain)) return false;

    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (validDomains.includes(domain)) return true;

    const beforeAt = email.split('@')[0];
    if (beforeAt.length < 2 || domain.length < 5) return false;

    return true;
  }

  onAuthStateChanged(callback) {
    if (!auth) {
      console.error('Firebase not initialized');
      callback(null);
      return;
    }

    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          createdAt: user.metadata.creationTime
        };
        console.log('User logged in:', this.currentUser.email);
      } else {
        this.currentUser = null;
        console.log('User logged out');
      }
      callback(user);
    });
  }

  async signup(name, email, password) {
    try {
      if (!name || name.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }

      if (!this.isValidEmail(email)) {
        throw new Error('Email no válido. Usa un dominio real (ej: ejemplo@gmail.com)');
      }

      if (!password || password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (!auth) throw new Error('Firebase not initialized');

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProgress = {
        uid: user.uid,
        name,
        email,
        streak: 0,
        bestStreak: 0,
        completedDays: [],
        reminderTime: '6:00 AM',
        notificationsEnabled: true,
        soundEnabled: true,
        darkMode: null, // null = sistema, true = dark forzado, false = light forzado
        customTasks: [
          { id: '1', title: 'Wake up (on time)', order: 1 },
          { id: '2', title: 'Make bed', order: 2 },
          { id: '3', title: 'Drink water', order: 3 },
          { id: '4', title: 'Move body (5 min)', order: 4 },
          { id: '5', title: 'No phone (10 min)', order: 5 },
        ],
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userProgress);

      this.currentUser = { uid: user.uid, email, name, createdAt: new Date().toISOString() };
      return { user: this.currentUser, uid: user.uid, progress: userProgress };
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Error en registro');
    }
  }

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email y contraseña requeridos');
      }

      if (!auth) throw new Error('Firebase not initialized');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDocSnap.exists()) {
        throw new Error('Datos de usuario no encontrados. Por favor, regístrate.');
      }

      const userData = userDocSnap.data();
      this.currentUser = { 
        uid: user.uid, 
        email: userData.email, 
        name: userData.name,
        createdAt: userData.createdAt
      };
      return { user: this.currentUser, progress: userData };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  async logout() {
    try {
      if (!auth) throw new Error('Firebase not initialized');
      
      if (this.unsubscribeAuth) this.unsubscribeAuth();
      if (this.unsubscribeProgress) this.unsubscribeProgress();
      
      await signOut(auth);
      this.currentUser = null;
      console.log('User signed out');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }

  async updateProgress(uid, progressData) {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...progressData,
        lastUpdate: new Date().toISOString()
      };
      
      await setDoc(userRef, updateData, { merge: true });
      console.log('Progress updated:', uid);
      return updateData;
    } catch (error) {
      console.error('Update progress error:', error);
      throw new Error(error.message || 'Error al actualizar progreso');
    }
  }

  async getProgress(uid) {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const userDocSnap = await getDoc(doc(db, 'users', uid));
      
      if (!userDocSnap.exists()) {
        console.log('No user data found, returning defaults');
        return {
          uid,
          streak: 0,
          bestStreak: 0,
          completedDays: [],
          reminderTime: '6:00 AM',
          notificationsEnabled: true,
          soundEnabled: true,
          darkMode: null,
          customTasks: [
            { id: '1', title: 'Wake up (on time)', order: 1 },
            { id: '2', title: 'Make bed', order: 2 },
            { id: '3', title: 'Drink water', order: 3 },
            { id: '4', title: 'Move body (5 min)', order: 4 },
            { id: '5', title: 'No phone (10 min)', order: 5 },
          ]
        };
      }

      console.log('User data loaded:', uid);
      return userDocSnap.data();
    } catch (error) {
      console.error('Get progress error:', error);
      return null;
    }
  }

  listenToProgress(uid, callback) {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      this.unsubscribeProgress = onSnapshot(doc(db, 'users', uid), (doc) => {
        if (doc.exists()) {
          console.log('Progress updated in real-time:', uid);
          callback(doc.data());
        }
      }, (error) => {
        console.error('Real-time listener error:', error);
      });

      return this.unsubscribeProgress;
    } catch (error) {
      console.error('Listen to progress error:', error);
      return null;
    }
  }
}

const firebaseService = new FirebaseService();

// ==================== AI COACH SERVICE ====================
class CoachService {
  async generateCoachMessage(userName, streak, bestStreak, monthlyCompletion, context = 'daily') {
    try {
      const systemPrompt = `Eres un entrenador personal motivacional para una app de hábitos matutinos.
Tu trabajo es inspirar a las personas a mantener buenos hábitos.
Eres energético, auténtico, y celebras logros.
Adapta tu tono al progreso del usuario.

REGLAS:
- Máximo 3 líneas
- Usa emojis
- Menciona el nombre del usuario
- Sé auténtico y personal
- NO hagas listas
- SÍ celebra logros`;

      let userPrompt = `Usuario: ${userName}
Racha actual: ${streak} días
Mejor racha: ${bestStreak} días
Completitud este mes: ${monthlyCompletion}%

Contexto: ${context === 'daily' ? 'Mensaje motivacional del día' : 'Celebración por completar tareas hoy'}

Genera UN SOLO mensaje motivacional personalizado.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5-20251101',
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Coach error:', error);
      return this.getFallbackMessage(userName, streak, context);
    }
  }

  getFallbackMessage(userName, streak, context) {
    if (context === 'celebration') {
      const messages = [
        `¡${userName}! 🔥 ¡LO HICISTE! Otra racha más. Eres IMPARABLE.`,
        `🎉 ${userName}, completaste hoy. Tu racha es ahora: ${streak} días. INCREÍBLE.`,
        `${userName} 💪 Día ${streak} hecho. Esto ya es un HÁBITO. Sigue así.`
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      if (streak === 0) {
        return `Hola ${userName} 👋 Hoy es tu primer día. El viaje comienza ahora. ¿Vamos? 🚀`;
      } else if (streak < 7) {
        return `${userName}, llevas ${streak} días. ¡Eso es consistencia! 🔥 Sigue adelante.`;
      } else if (streak < 30) {
        return `${userName}, ${streak} días. NO ES ACCIDENTE, ES DISCIPLINA. 💪 Eres legend.`;
      } else {
        return `${userName}, ${streak} DÍAS. 👑 Ya eres una MÁQUINA. ¿Cuál es el siguiente desafío?`;
      }
    }
  }
}

const coachService = new CoachService();

// ==================== MAIN APP ====================
export default function App() {
  // System color scheme detection
  const systemColorScheme = useColorScheme();

  const [user, setUser] = React.useState(firebaseService.currentUser);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('login');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [coachScreenVisible, setCoachScreenVisible] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);
  const [appJustOpened, setAppJustOpened] = React.useState(true);

  const [showCoachModal, setShowCoachModal] = React.useState(false);
  const [coachMessage, setCoachMessage] = React.useState('');
  const [coachLoading, setCoachLoading] = React.useState(false);

  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingTasks, setEditingTasks] = React.useState([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [reminderTime, setReminderTime] = React.useState('6:00 AM');
  const [tasks, setTasks] = React.useState([
    { id: '1', title: 'Wake up (on time)', completed: false },
    { id: '2', title: 'Make bed', completed: false },
    { id: '3', title: 'Drink water', completed: false },
    { id: '4', title: 'Move body (5 min)', completed: false },
    { id: '5', title: 'No phone (10 min)', completed: false },
  ]);

  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [completedDays, setCompletedDays] = React.useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // ==================== DARK MODE STATE ====================
  // null = usar sistema, true = forzar dark, false = forzar light
  const [darkModeOverride, setDarkModeOverride] = React.useState(null);

  // El tema efectivo: si hay override lo usa, si no usa el sistema
  const isDark = darkModeOverride !== null
    ? darkModeOverride
    : systemColorScheme === 'dark';

  const theme = isDark ? THEMES.dark : THEMES.light;
  const styles = getStyles(theme);

  const handleDarkModeToggle = async (value) => {
    // Si el valor coincide con el sistema, reseteamos el override (volvemos a "auto")
    const systemIsDark = systemColorScheme === 'dark';
    const newOverride = value === systemIsDark ? null : value;
    setDarkModeOverride(newOverride);

    if (user) {
      await firebaseService.updateProgress(user.uid, {
        darkMode: newOverride
      });
    }
  };

  const loadUserData = async (userProgress) => {
    setStreak(userProgress.streak || 0);
    setBestStreak(userProgress.bestStreak || 0);
    setCompletedDays(userProgress.completedDays || []);
    setReminderTime(userProgress.reminderTime || '6:00 AM');
    setNotificationsEnabled(userProgress.notificationsEnabled !== false);
    setSoundEnabled(userProgress.soundEnabled !== false);

    // Cargar preferencia de dark mode guardada
    // userProgress.darkMode puede ser: null (auto), true (dark), false (light)
    if (userProgress.darkMode !== undefined) {
      setDarkModeOverride(userProgress.darkMode);
    }
    
    if (userProgress.customTasks && userProgress.customTasks.length > 0) {
      const sortedTasks = userProgress.customTasks
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(task => ({ ...task, completed: false }));
      setTasks(sortedTasks);
    }
    
    setOnboardingComplete(true);
  };

  // Listen to auth state changes
  React.useEffect(() => {
    firebaseService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseService.currentUser);
        
        const userProgress = await firebaseService.getProgress(firebaseUser.uid);
        if (userProgress) {
          await loadUserData(userProgress);
        }

        firebaseService.listenToProgress(firebaseUser.uid, (updatedProgress) => {
          setStreak(updatedProgress.streak || 0);
          setBestStreak(updatedProgress.bestStreak || 0);
          setCompletedDays(updatedProgress.completedDays || []);
          setReminderTime(updatedProgress.reminderTime || '6:00 AM');
          setNotificationsEnabled(updatedProgress.notificationsEnabled !== false);
          setSoundEnabled(updatedProgress.soundEnabled !== false);

          if (updatedProgress.darkMode !== undefined) {
            setDarkModeOverride(updatedProgress.darkMode);
          }
          
          if (updatedProgress.customTasks && updatedProgress.customTasks.length > 0) {
            const sortedTasks = updatedProgress.customTasks
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(task => ({ ...task, completed: false }));
            setTasks(sortedTasks);
          }
        });
      } else {
        setUser(null);
        setOnboardingComplete(false);
      }
    });
  }, []);

  React.useEffect(() => {
    if (user && onboardingComplete && appJustOpened) {
      setTimeout(() => {
        generateDailyCoach();
        setAppJustOpened(false);
      }, 1500);
    }
  }, [user, onboardingComplete, appJustOpened]);

  const generateDailyCoach = async () => {
    setCoachLoading(true);
    try {
      const monthlyStats = getMonthlyStats();
      const message = await coachService.generateCoachMessage(
        user.name,
        streak,
        bestStreak,
        monthlyStats.percentage,
        'daily'
      );
      setCoachMessage(message);
      setCurrentScreen('coach');
      setCoachScreenVisible(true);
    } catch (error) {
      console.error('Error generating coach:', error);
    } finally {
      setCoachLoading(false);
    }
  };

  const generateCelebrationCoach = async () => {
    setCoachLoading(true);
    try {
      const monthlyStats = getMonthlyStats();
      const message = await coachService.generateCoachMessage(
        user.name,
        streak + 1,
        bestStreak,
        monthlyStats.percentage,
        'celebration'
      );
      setCoachMessage(message);
      setCurrentScreen('coach');
      setCoachScreenVisible(true);
    } catch (error) {
      console.error('Error generating celebration:', error);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleShareCoach = async () => {
    try {
      const shareText = `${coachMessage}\n\n🏆 Sigo mis mañanas con MorningWin. ¿Te unes? 🚀\nhttps://morningwin.app`;
      
      await Share.share({
        message: shareText,
        title: 'Mi Mensaje de Motivación - MorningWin'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSignup = async () => {
    setErrorMessage('');

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage('Completa todos los campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await firebaseService.signup(
        formData.name,
        formData.email,
        formData.password
      );
      setUser(result.user);
      await loadUserData(result.progress);
      setCurrentStep(0);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Algo salió mal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!formData.email || !formData.password) {
      setErrorMessage('Completa email y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const result = await firebaseService.login(formData.email, formData.password);
      setUser(result.user);
      await loadUserData(result.progress);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setErrorMessage('');
      setAppJustOpened(true);
    } catch (error) {
      setErrorMessage(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await firebaseService.logout();
      setUser(null);
      setOnboardingComplete(false);
      setCurrentStep(0);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setErrorMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (id) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (completedDays.includes(today)) {
      Alert.alert(
        '¡Ya completaste hoy! 🎉',
        'Regresa mañana para marcar nuevas tareas.'
      );
      return;
    }

    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleComplete = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (completedDays.includes(today)) {
      Alert.alert(
        '¡Ya completaste hoy! 🎉',
        'Regresa mañana para continuar tu racha. ¡Lo estás haciendo increíble!'
      );
      return;
    }

    if (!tasks.every(t => t.completed)) {
      return;
    }

    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    const newCompletedDays = [...completedDays, today];
    setCompletedDays(newCompletedDays);

    if (user) {
      await firebaseService.updateProgress(user.uid, {
        streak: newStreak,
        bestStreak: Math.max(bestStreak, newStreak),
        completedDays: newCompletedDays
      });
    }

    setTasks(tasks.map(t => ({ ...t, completed: false })));
    
    if (notificationsEnabled) {
      notificationService.sendNotification('🎉 ¡Mañana Ganada!', {
        body: `Racha actual: ${newStreak} días 🔥`,
        tag: 'morningwin-daily'
      });
    }

    await generateCelebrationCoach();
  };

  const openEditRoutine = () => {
    const clonedTasks = JSON.parse(JSON.stringify(tasks));
    setEditingTasks(clonedTasks);
    setShowEditModal(true);
  };

  const saveEditedRoutine = async () => {
    if (editingTasks.length === 0) {
      Alert.alert('Error', 'Debes tener al menos 1 tarea');
      return;
    }

    const customTasks = editingTasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      order: index + 1
    }));

    if (user) {
      await firebaseService.updateProgress(user.uid, {
        customTasks
      });
    }

    setTasks(editingTasks.map(t => ({ ...t, completed: false })));
    setShowEditModal(false);
    setNewTaskTitle('');
    Alert.alert('Éxito', 'Tu rutina ha sido actualizada');
  };

  const addNewTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Escribe el título de la tarea');
      return;
    }

    const newTask = {
      id: 'task_' + Date.now(),
      title: newTaskTitle,
      completed: false
    };

    setEditingTasks([...editingTasks, newTask]);
    setNewTaskTitle('');
  };

  const deleteTask = (id) => {
    setEditingTasks(editingTasks.filter(task => task.id !== id));
  };

  const updateTaskTitle = (id, newTitle) => {
    setEditingTasks(editingTasks.map(task =>
      task.id === id ? { ...task, title: newTitle } : task
    ));
  };

  const moveTaskUp = (index) => {
    if (index > 0) {
      const newTasks = [...editingTasks];
      [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
      setEditingTasks(newTasks);
    }
  };

  const moveTaskDown = (index) => {
    if (index < editingTasks.length - 1) {
      const newTasks = [...editingTasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      setEditingTasks(newTasks);
    }
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let completedInMonth = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      if (completedDays.includes(dateString)) completedInMonth++;
    }

    const percentage = Math.round((completedInMonth / daysInMonth) * 100);
    return { completedInMonth, daysInMonth, percentage };
  };

  const getCalendarDays = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, completed: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const isCompleted = completedDays.includes(dateString);
      days.push({ day, completed: isCompleted });
    }

    return days;
  };

  const monthlyStats = getMonthlyStats();
  const calendarDays = getCalendarDays();
  const allCompleted = tasks.every(t => t.completed);

  // ==================== AUTH SCREEN ====================
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.authFormWrapper}>
            <Text style={styles.authTitle}>
              {authMode === 'login' ? 'Inicia Sesión' : 'Crea tu Cuenta'}
            </Text>
            <Text style={styles.authSubtitle}>
              {authMode === 'login'
                ? 'Bienvenido de vuelta a MorningWin'
                : 'Únete a la comunidad MorningWin'}
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>❌ {errorMessage}</Text>
              </View>
            ) : null}

            {authMode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor={theme.textPlaceholder}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email (ej: pepé@gmail.com)"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholderTextColor={theme.textPlaceholder}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholderTextColor={theme.textPlaceholder}
              secureTextEntry
            />

            {authMode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.authButtonDisabled]}
              onPress={authMode === 'login' ? handleLogin : handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.authButtonText}>
                {isLoading ? 'Cargando...' : authMode === 'login' ? 'Inicia Sesión' : 'Registrarse'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                setErrorMessage('');
              }}
            >
              <Text style={styles.toggleAuthText}>
                {authMode === 'login'
                  ? '¿No tienes cuenta? Registrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión aquí'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== ONBOARDING ====================
  if (!onboardingComplete) {
    return (
      <View style={styles.container}>
        {currentStep === 0 && (
          <View style={styles.onboardingContainer}>
            <Text style={styles.onboardingTitle}>¡Hola, {user.name}!</Text>
            <Text style={styles.onboardingSubtitle}>Configuremos tu rutina matutina</Text>

            <View style={styles.taskPreview}>
              {tasks.map((task) => (
                <View key={task.id} style={styles.previewTask}>
                  <Text style={styles.previewTaskText}>✓ {task.title}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.onboardingButton}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={styles.onboardingButtonText}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.onboardingContainer}>
            <Text style={styles.onboardingTitle}>Hora de Recordatorio</Text>
            <Text style={styles.onboardingSubtitle}>¿Cuándo quieres que te recordemos?</Text>

            <View style={styles.timeOptions}>
              {['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    reminderTime === time && styles.timeButtonActive
                  ]}
                  onPress={() => setReminderTime(time)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      reminderTime === time && styles.timeButtonTextActive
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.onboardingButton}
              onPress={async () => {
                await firebaseService.updateProgress(user.uid, {
                  reminderTime,
                  onboardingCompleted: true
                });
                setOnboardingComplete(true);
              }}
            >
              <Text style={styles.onboardingButtonText}>¡Empecemos!</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ==================== COACH SCREEN ====================
  if (currentScreen === 'coach') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.coachScreenScroll}>
          <View style={styles.pageWrapper}>
          <View style={styles.topNav}>
            <Text style={styles.topNavName}>MorningWin</Text>
            <View style={styles.topNavRight}>
              <Text style={styles.topNavUser}>{user.name}</Text>
              <TouchableOpacity style={styles.themeToggleBtn} onPress={() => handleDarkModeToggle(!isDark)}>
                <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setCurrentScreen('home'); setCoachScreenVisible(false); }}>
                <Text style={styles.topNavAction}>← Inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.pageTitle}>💬 Tu Coach IA</Text>

          <View style={styles.coachScreenContent}>
            {coachLoading ? (
              <ActivityIndicator size="large" color={theme.textPrimary} style={{ marginVertical: 40 }} />
            ) : (
              <>
                <View style={styles.coachMessageBox}>
                  <Text style={styles.coachScreenMessageText}>{coachMessage}</Text>
                </View>

                <View style={styles.coachScreenButtons}>
                  <TouchableOpacity
                    style={styles.coachScreenShareButton}
                    onPress={handleShareCoach}
                  >
                    <Text style={styles.coachScreenShareButtonText}>📤 Compartir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.coachScreenCloseButton}
                    onPress={() => {
                      setCurrentScreen('home');
                      setCoachScreenVisible(false);
                    }}
                  >
                    <Text style={styles.coachScreenCloseButtonText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          </View>{/* end pageWrapper */}
        </ScrollView>
      </View>
    );
  }

  // ==================== EDIT ROUTINE SCREEN ====================
  if (showEditModal) {
    return (
      <View style={styles.editScreenContainer}>
        <ScrollView style={styles.editScreenScroll}>
          <View style={styles.pageWrapper}>
          <View style={styles.topNav}>
            <Text style={styles.topNavName}>MorningWin</Text>
            <View style={styles.topNavRight}>
              <Text style={styles.topNavUser}>{user.name}</Text>
              <TouchableOpacity style={styles.themeToggleBtn} onPress={() => handleDarkModeToggle(!isDark)}>
                <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.topNavAction}>← Atrás</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.pageTitle}>✏️ Editar Mi Rutina</Text>

          <View style={styles.editScreenContent}>
            <Text style={styles.editSectionTitle}>Mis Tareas</Text>

            <View style={styles.tasksEditList}>
              {editingTasks.map((task, index) => (
                <View key={task.id} style={styles.editTaskItem}>
                  <View style={styles.editTaskInfo}>
                    <Text style={styles.editTaskIndex}>{index + 1}.</Text>
                    <TextInput
                      style={styles.editTaskInput}
                      value={task.title}
                      onChangeText={(text) => updateTaskTitle(task.id, text)}
                      placeholder="Nombre de la tarea"
                      placeholderTextColor={theme.textPlaceholder}
                    />
                  </View>

                  <View style={styles.editTaskButtons}>
                    <TouchableOpacity
                      style={[styles.editArrowButton, index === 0 && styles.editArrowButtonDisabled]}
                      onPress={() => moveTaskUp(index)}
                      disabled={index === 0}
                    >
                      <Text style={styles.editArrowText}>↑</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.editArrowButton, index === editingTasks.length - 1 && styles.editArrowButtonDisabled]}
                      onPress={() => moveTaskDown(index)}
                      disabled={index === editingTasks.length - 1}
                    >
                      <Text style={styles.editArrowText}>↓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editDeleteButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Text style={styles.editDeleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.editSectionTitle}>Agregar Nueva Tarea</Text>

            <View style={styles.addTaskContainer}>
              <TextInput
                style={styles.addTaskInput}
                placeholder="Escribe una nueva tarea"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholderTextColor={theme.textPlaceholder}
              />
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={addNewTask}
              >
                <Text style={styles.addTaskButtonText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editScreenButtons}>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={saveEditedRoutine}
              >
                <Text style={styles.editSaveButtonText}>✅ Guardar Cambios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>{/* end pageWrapper */}
        </ScrollView>
      </View>
    );
  }

  // ==================== STATS SCREEN ====================
  if (currentScreen === 'stats') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.topNavName}>MorningWin</Text>
          </TouchableOpacity>
          <View style={styles.topNavRight}>
            <Text style={styles.topNavUser}>{user.name}</Text>
            <TouchableOpacity style={styles.themeToggleBtn} onPress={() => handleDarkModeToggle(!isDark)}>
              <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentScreen('home')}>
              <Text style={styles.topNavAction}>← Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.pageTitle}>Estadísticas</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Racha Actual</Text>
          <View style={styles.statRow}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statUnit}>días</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mejor Racha</Text>
          <View style={styles.statRow}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{bestStreak}</Text>
            <Text style={styles.statUnit}>días</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completitud Mensual</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${monthlyStats.percentage}%` }
                ]}
              />
            </View>
            <Text style={styles.percentageText}>
              {monthlyStats.completedInMonth}/{monthlyStats.daysInMonth} ({monthlyStats.percentage}%)
            </Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.statLabel}>Este Mes</Text>
          <View style={styles.weekDaysHeader}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.calendarDay,
                  item.day === null && styles.emptyDay,
                  item.completed && styles.completedDay,
                  !item.completed && item.day !== null && styles.incompleteDay,
                ]}
              >
                {item.day !== null && (
                  <Text
                    style={[
                      styles.calendarDayText,
                      item.completed && styles.completedDayText,
                    ]}
                  >
                    {item.day}
                  </Text>
                )}
                {item.completed && <Text style={styles.checkmarkOverlay}>✓</Text>}
              </View>
            ))}
          </View>
        </View>
        </View>{/* end pageWrapper */}
      </ScrollView>
    );
  }

  // ==================== SETTINGS SCREEN ====================
  if (currentScreen === 'settings') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.topNavName}>MorningWin</Text>
          </TouchableOpacity>
          <View style={styles.topNavRight}>
            <Text style={styles.topNavUser}>{user.name}</Text>
            <TouchableOpacity style={styles.themeToggleBtn} onPress={() => handleDarkModeToggle(!isDark)}>
              <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentScreen('home')}>
              <Text style={styles.topNavAction}>← Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.pageTitle}>Configuración</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileSubtext}>{user.email}</Text>
            <Text style={styles.profileSubtext2}>
              Miembro desde: {new Date(user.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <TouchableOpacity
            style={styles.coachButtonSettings}
            onPress={openEditRoutine}
          >
            <Text style={styles.coachButtonText}>✏️ Editar Mi Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.coachButtonSettings}
            onPress={generateDailyCoach}
          >
            <Text style={styles.coachButtonText}>💬 Obtener Mensaje del Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Apariencia: toggle movido al topNav global */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>🔔 Notificaciones Push</Text>
              <Text style={styles.settingSubtitle}>Recordatorio diario a las {reminderTime}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                await firebaseService.updateProgress(user.uid, {
                  notificationsEnabled: value
                });

                if (value) {
                  notificationService.sendNotification('🔔 Notificaciones Habilitadas', {
                    body: 'Recibirás recordatorios diarios a las ' + reminderTime
                  });
                }
              }}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={notificationsEnabled ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>🔊 Sonido</Text>
              <Text style={styles.settingSubtitle}>Sonido en notificaciones</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={async (value) => {
                setSoundEnabled(value);
                await firebaseService.updateProgress(user.uid, {
                  soundEnabled: value
                });
              }}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={soundEnabled ? theme.switchThumbOn : theme.switchThumbOff}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>✨ Actualiza a Pro</Text>
            <Text style={styles.premiumSubtitle}>$8.99/mes • Stats ilimitadas • Sin ads</Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Suscribirse Ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
        </View>{/* end pageWrapper */}
      </ScrollView>
    );
  }

  // ==================== HOME SCREEN ====================
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => setCurrentScreen('stats')}>
            <Text style={styles.topNavName}>MorningWin</Text>
          </TouchableOpacity>
          <View style={styles.topNavRight}>
            <Text style={styles.topNavUser}>{user.name}</Text>
            <TouchableOpacity
              style={styles.themeToggleBtn}
              onPress={() => handleDarkModeToggle(!isDark)}
            >
              <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentScreen('settings')}>
              <Text style={styles.topNavAction}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.topNavAction}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.homeDate}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View style={styles.streakContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>racha de días</Text>
        </View>

        <View style={styles.titleSection}>
          {completedDays.includes(new Date().toISOString().split('T')[0]) ? (
            <>
              <Text style={styles.title}>🎉 ¡Felicidades!</Text>
              <Text style={styles.subtitle}>Haz completado tu rutina antes de las 9am. Nos vemos mañana</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Gana tu Mañana</Text>
              <Text style={styles.subtitle}>Completa tu rutina antes de las 9am</Text>
            </>
          )}
        </View>

        <View style={styles.tasksContainer}>
          {tasks.map((task) => {
            const today = new Date().toISOString().split('T')[0];
            const isCompletedToday = completedDays.includes(today);

            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  task.completed && styles.taskCompleted,
                  isCompletedToday && styles.taskDisabled
                ]}
                onPress={() => toggleTask(task.id)}
                disabled={isCompletedToday}
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
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            allCompleted && !completedDays.includes(new Date().toISOString().split('T')[0]) && styles.completeButtonActive
          ]}
          onPress={handleComplete}
          disabled={!allCompleted || completedDays.includes(new Date().toISOString().split('T')[0])}
        >
          <Text style={styles.completeButtonText}>
            {allCompleted ? '🎉 ¡Mañana Ganada!' : `${tasks.filter(t => t.completed).length}/${tasks.length} hecho`}
          </Text>
        </TouchableOpacity>
        </View>{/* end pageWrapper */}
      </ScrollView>
    </>
  );
}

// ==================== DYNAMIC STYLES ====================
function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },

    // ── Layout global ─────────────────────────────────────────
    // Wrapper centrado con maxWidth 680px para web
    pageWrapper: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      paddingHorizontal: 20,
    },

    // TopNav estilo Forgia: nombre app | usuario + tema + acción
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 24,
    },
    topNavName: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    topNavRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    topNavUser: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
    },
    themeToggleBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    themeToggleIcon: { fontSize: 16 },
    topNavAction: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '600',
    },

    // Título de página (reemplaza screenTitle)
    pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 24,
    },

    // Fecha en home (sin header propio)
    homeDate: { marginBottom: 16 },

    // Auth
    authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40, width: '100%' },
    authFormWrapper: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 20 },
    authTitle: { fontSize: 32, fontWeight: '900', color: theme.textPrimary, marginBottom: 10, textAlign: 'center' },
    authSubtitle: { fontSize: 16, color: theme.textMuted, marginBottom: 20, textAlign: 'center' },
    errorBox: { width: '100%', backgroundColor: theme.redBg, borderRadius: 8, padding: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: theme.redBorder },
    errorText: { color: theme.red, fontSize: 14, fontWeight: '600' },
    input: { width: '100%', borderWidth: 1, borderColor: theme.borderInput, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, backgroundColor: theme.bgInput, color: theme.textPrimary },
    authButton: { width: '100%', paddingVertical: 16, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    authButtonDisabled: { opacity: 0.5 },
    authButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },
    toggleAuthText: { fontSize: 14, color: theme.blue, textAlign: 'center', marginTop: 10 },

    // Onboarding
    onboardingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
    onboardingTitle: { fontSize: 32, fontWeight: '900', color: theme.textPrimary, marginBottom: 10, textAlign: 'center' },
    onboardingSubtitle: { fontSize: 16, color: theme.textMuted, marginBottom: 40, textAlign: 'center' },
    taskPreview: { width: '100%', marginBottom: 30, gap: 10 },
    previewTask: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.bgSecondary, borderRadius: 8 },
    previewTaskText: { fontSize: 14, color: theme.textSecondary },
    timeOptions: { width: '100%', marginBottom: 30, gap: 12 },
    timeButton: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.bgSecondary, borderRadius: 12, alignItems: 'center' },
    timeButtonActive: { backgroundColor: theme.btnPrimary },
    timeButtonText: { fontSize: 16, color: theme.textSecondary, fontWeight: '600' },
    timeButtonTextActive: { color: theme.btnPrimaryText },
    onboardingButton: { width: '100%', paddingVertical: 16, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center' },
    onboardingButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },

    // Headers
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
    headerSettings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
    headerButtons: { flexDirection: 'row', gap: 10 },
    date: { fontSize: 14, color: theme.textMuted },
    backButton: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
    screenTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary },
    statsButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.bgSecondary, borderRadius: 8 },
    statsButtonText: { fontSize: 16 },
    settingsButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.bgSecondary, borderRadius: 8 },
    settingsButtonText: { fontSize: 16 },

    // Home
    streakContainer: { alignItems: 'center', marginBottom: 30 },
    streakEmoji: { fontSize: 40, marginBottom: 8 },
    streakNumber: { fontSize: 48, fontWeight: '900', color: theme.textPrimary },
    streakLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    titleSection: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.textMuted },
    tasksContainer: { marginBottom: 30, gap: 12 },
    taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: theme.bgSecondary, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
    taskCompleted: { borderColor: theme.greenBorder, backgroundColor: theme.greenBg },
    taskCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.borderInput, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkmark: { color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' },
    taskText: { fontSize: 16, color: theme.textSecondary, flex: 1, fontWeight: '500' },
    taskTextCompleted: { color: theme.textMuted, textDecorationLine: 'line-through' },
    taskDisabled: { opacity: 0.5, pointerEvents: 'none' },
    completeButton: { paddingVertical: 18, paddingHorizontal: 20, backgroundColor: theme.bgDisabled, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
    completeButtonActive: { backgroundColor: theme.btnPrimary },
    completeButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },

    // Stats
    statCard: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    statLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statEmoji: { fontSize: 32 },
    statNumber: { fontSize: 40, fontWeight: '900', color: theme.textPrimary },
    statUnit: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
    progressContainer: { gap: 8 },
    progressBar: { height: 12, backgroundColor: theme.progressBg, borderRadius: 6, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: theme.green, borderRadius: 6 },
    percentageText: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
    calendarCard: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    weekDayText: { fontSize: 12, fontWeight: '600', color: theme.textMuted, width: '14%', textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    calendarDay: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, position: 'relative' },
    emptyDay: { backgroundColor: 'transparent' },
    completedDay: { backgroundColor: theme.green },
    incompleteDay: { backgroundColor: theme.bgSecondary },
    calendarDayText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    completedDayText: { color: '#000', fontWeight: '700' },
    checkmarkOverlay: { position: 'absolute', fontSize: 14, fontWeight: '700', color: '#000' },

    // Settings
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginBottom: 12, textTransform: 'uppercase' },
    profileCard: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
    profileName: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    profileSubtext: { fontSize: 14, color: theme.textMuted },
    profileSubtext2: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
    coachButtonSettings: { width: '100%', paddingVertical: 12, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    coachButtonText: { color: theme.btnPrimaryText, fontSize: 14, fontWeight: '700' },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    settingLabel: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
    settingSubtitle: { fontSize: 12, color: theme.textMuted },
    premiumCard: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
    premiumTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    premiumSubtitle: { fontSize: 12, color: theme.textMuted, marginBottom: 12 },
    premiumButton: { paddingVertical: 12, backgroundColor: theme.premiumBtnBg, borderRadius: 8, alignItems: 'center' },
    premiumButtonText: { color: theme.btnPrimaryText, fontSize: 14, fontWeight: '700' },
    logoutButton: { paddingVertical: 16, paddingHorizontal: 20, backgroundColor: theme.bgSecondary, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: theme.borderInput },
    logoutButtonText: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    spacer: { height: 20 },

    // Coach screen
    coachScreenScroll: { flex: 1 },
    coachScreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
    coachScreenBackButton: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
    coachScreenTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
    coachScreenContent: { paddingHorizontal: 20, paddingVertical: 40, justifyContent: 'center' },
    coachMessageBox: { backgroundColor: theme.bgCard, borderRadius: 16, padding: 24, marginBottom: 30, borderWidth: 1, borderColor: theme.border },
    coachScreenMessageText: { fontSize: 18, color: theme.textSecondary, textAlign: 'center', lineHeight: 28, fontWeight: '500' },
    coachScreenButtons: { flexDirection: 'column', gap: 12 },
    coachScreenShareButton: { paddingVertical: 14, backgroundColor: theme.btnSecondary, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: theme.btnSecondaryBorder },
    coachScreenShareButtonText: { color: theme.btnSecondaryText, fontSize: 16, fontWeight: '700' },
    coachScreenCloseButton: { paddingVertical: 14, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center' },
    coachScreenCloseButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },

    // Edit routine screen
    editScreenContainer: { flex: 1, backgroundColor: theme.bg },
    editScreenScroll: { flex: 1 },
    editScreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
    editScreenBackButton: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
    editScreenTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
    editScreenContent: { paddingHorizontal: 20, paddingVertical: 20 },
    editSectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginBottom: 12, marginTop: 20, textTransform: 'uppercase' },
    tasksEditList: { gap: 12, marginBottom: 20 },
    editTaskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: theme.bgSecondary, borderRadius: 12 },
    editTaskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
    editTaskIndex: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginRight: 8, minWidth: 20 },
    editTaskInput: { flex: 1, borderWidth: 1, borderColor: theme.borderInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: theme.bg, color: theme.textPrimary },
    editTaskButtons: { flexDirection: 'row', gap: 8 },
    editArrowButton: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.borderInput },
    editArrowButtonDisabled: { opacity: 0.5 },
    editArrowText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
    editDeleteButton: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: theme.redBg, borderRadius: 8 },
    editDeleteText: { fontSize: 14 },
    addTaskContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    addTaskInput: { flex: 1, borderWidth: 1, borderColor: theme.borderInput, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, backgroundColor: theme.bgInput, color: theme.textPrimary },
    addTaskButton: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addTaskButtonText: { color: theme.btnPrimaryText, fontSize: 14, fontWeight: '700' },
    editScreenButtons: { flexDirection: 'column', gap: 12, marginTop: 20, marginBottom: 30 },
    editSaveButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center' },
    editSaveButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },
    editCancelButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnSecondary, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: theme.btnSecondaryBorder },
    editCancelButtonText: { color: theme.btnSecondaryText, fontSize: 16, fontWeight: '700' },

    // Legacy modal styles (kept for compatibility)
    coachOverlay: { flex: 1, backgroundColor: theme.coachOverlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
    coachContent: { backgroundColor: theme.bg, borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', alignItems: 'center' },
    coachClose: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.bgSecondary, justifyContent: 'center', alignItems: 'center' },
    coachCloseText: { fontSize: 18, color: theme.textMuted, fontWeight: '700' },
    coachTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginBottom: 16 },
    coachMessageText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 24, fontWeight: '500' },
    coachButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    coachShareButton: { flex: 1, paddingVertical: 12, backgroundColor: theme.bgSecondary, borderRadius: 8, alignItems: 'center' },
    coachShareButtonText: { color: theme.textPrimary, fontSize: 14, fontWeight: '700' },
    coachCloseButton: { flex: 1, paddingVertical: 12, backgroundColor: theme.btnPrimary, borderRadius: 8, alignItems: 'center' },
    coachCloseButtonText: { color: theme.btnPrimaryText, fontSize: 14, fontWeight: '700' },
    editModalContainer: { flex: 1, backgroundColor: theme.bg },
    editModalScroll: { flex: 1 },
    editModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
    editModalBackButton: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
    editModalTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
    editModalContent: { paddingHorizontal: 20, paddingVertical: 20 },
    editModalButtons: { flexDirection: 'column', gap: 12, marginTop: 20, marginBottom: 30 },
  });
}
