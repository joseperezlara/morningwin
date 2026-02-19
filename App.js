import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, Modal, ActivityIndicator, Share, useColorScheme } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'morningwin-app',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'morningwin-app.firebaseapp.com',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCesd8LVdz5B28UFHGo-elEwo49w2YeQ2Q',
  appId: '1:95677741192:web:' + Math.random().toString(36).substring(7),
};

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY || 'fallback-key-for-demo';

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const THEMES = {
  light: {
    bg: '#ffffff', bgSecondary: '#f5f5f5', bgCard: '#f9f9f9', bgInput: '#fafafa', bgDisabled: '#f0f0f0',
    textPrimary: '#000000', textSecondary: '#666666', textMuted: '#999999', textPlaceholder: '#999999',
    border: '#f0f0f0', borderInput: '#dddddd',
    accent: '#000000', accentText: '#ffffff',
    green: '#00ff00', greenBg: '#f0fff0', greenBorder: '#00ff00',
    red: '#c62828', redBg: '#ffebee', redBorder: '#f44336', blue: '#0066cc',
    btnPrimary: '#000000', btnPrimaryText: '#ffffff',
    btnSecondary: '#f5f5f5', btnSecondaryText: '#000000', btnSecondaryBorder: '#dddddd',
    switchTrackOn: '#81c784', switchTrackOff: '#f0f0f0', switchThumbOn: '#00ff00', switchThumbOff: '#f0f0f0',
    progressBg: '#f0f0f0', coachOverlay: 'rgba(0,0,0,0.7)', premiumBtnBg: '#000000',
  },
  dark: {
    bg: '#1c1c1e', bgSecondary: '#2c2c2e', bgCard: '#2c2c2e', bgInput: '#3a3a3c', bgDisabled: '#3a3a3c',
    textPrimary: '#ffffff', textSecondary: '#ebebf5cc', textMuted: '#ebebf599', textPlaceholder: '#636366',
    border: '#3a3a3c', borderInput: '#48484a',
    accent: '#ffffff', accentText: '#000000',
    green: '#30d158', greenBg: '#1a2e1a', greenBorder: '#30d158',
    red: '#ff453a', redBg: '#2d1515', redBorder: '#ff453a', blue: '#0a84ff',
    btnPrimary: '#ffffff', btnPrimaryText: '#000000',
    btnSecondary: '#3a3a3c', btnSecondaryText: '#ffffff', btnSecondaryBorder: '#48484a',
    switchTrackOn: '#30d158', switchTrackOff: '#3a3a3c', switchThumbOn: '#30d158', switchThumbOff: '#636366',
    progressBg: '#3a3a3c', coachOverlay: 'rgba(0,0,0,0.85)', premiumBtnBg: '#ffffff',
  }
};

class NotificationService {
  constructor() { this.requestPermission(); }
  requestPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') Notification.requestPermission();
    }
  }
  sendNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') return new Notification(title, { icon: '🔥', ...options });
  }
}
const notificationService = new NotificationService();

class FirebaseService {
  constructor() { this.currentUser = null; this.unsubscribeAuth = null; this.unsubscribeProgress = null; }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    const fakeDomains = ['yomero.com', 'test.com', 'example.com', 'fake.com'];
    const domain = email.split('@')[1].toLowerCase();
    if (fakeDomains.includes(domain)) return false;
    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (validDomains.includes(domain)) return true;
    return email.split('@')[0].length >= 2 && domain.length >= 5;
  }

  onAuthStateChanged(callback) {
    if (!auth) { callback(null); return; }
    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = { uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0], createdAt: user.metadata.creationTime };
      } else { this.currentUser = null; }
      callback(user);
    });
  }

  async signup(name, email, password) {
    if (!name || name.trim().length < 2) throw new Error('El nombre debe tener al menos 2 caracteres');
    if (!this.isValidEmail(email)) throw new Error('Email no válido');
    if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userProgress = {
      uid: user.uid, name, email, streak: 0, bestStreak: 0, completedDays: [],
      reminderTime: '6:00 AM', notificationsEnabled: true, soundEnabled: true, darkMode: null,
      customTasks: [
        { id: '1', title: 'Wake up (on time)', order: 1 }, { id: '2', title: 'Make bed', order: 2 },
        { id: '3', title: 'Drink water', order: 3 }, { id: '4', title: 'Move body (5 min)', order: 4 },
        { id: '5', title: 'No phone (10 min)', order: 5 },
      ],
      createdAt: new Date().toISOString(), lastUpdate: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), userProgress);
    this.currentUser = { uid: user.uid, email, name, createdAt: new Date().toISOString() };
    return { user: this.currentUser, uid: user.uid, progress: userProgress };
  }

  async login(email, password) {
    if (!email || !password) throw new Error('Email y contraseña requeridos');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocSnap = await getDoc(doc(db, 'users', user.uid));
    if (!userDocSnap.exists()) throw new Error('Datos de usuario no encontrados');
    const userData = userDocSnap.data();
    this.currentUser = { uid: user.uid, email: userData.email, name: userData.name, createdAt: userData.createdAt };
    return { user: this.currentUser, progress: userData };
  }

  async logout() {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeProgress) this.unsubscribeProgress();
    await signOut(auth);
    this.currentUser = null;
  }

  async updateProgress(uid, progressData) {
    const updateData = { ...progressData, lastUpdate: new Date().toISOString() };
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
    return updateData;
  }

  async getProgress(uid) {
    const userDocSnap = await getDoc(doc(db, 'users', uid));
    if (!userDocSnap.exists()) return {
      uid, streak: 0, bestStreak: 0, completedDays: [], reminderTime: '6:00 AM',
      notificationsEnabled: true, soundEnabled: true, darkMode: null,
      customTasks: [
        { id: '1', title: 'Wake up (on time)', order: 1 }, { id: '2', title: 'Make bed', order: 2 },
        { id: '3', title: 'Drink water', order: 3 }, { id: '4', title: 'Move body (5 min)', order: 4 },
        { id: '5', title: 'No phone (10 min)', order: 5 },
      ]
    };
    return userDocSnap.data();
  }

  listenToProgress(uid, callback) {
    this.unsubscribeProgress = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) callback(snap.data());
    });
    return this.unsubscribeProgress;
  }
}
const firebaseService = new FirebaseService();

class CoachService {
  async generateCoachMessage(userName, streak, bestStreak, monthlyCompletion, context = 'daily') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY },
        body: JSON.stringify({
          model: 'claude-opus-4-5-20251101', max_tokens: 200,
          system: `Eres un entrenador personal motivacional. Máximo 3 líneas. Usa emojis. Menciona el nombre. No hagas listas.`,
          messages: [{ role: 'user', content: `Usuario: ${userName}, Racha: ${streak} días, Mejor: ${bestStreak}, Mes: ${monthlyCompletion}%. Contexto: ${context}. Genera UN mensaje motivacional.` }]
        })
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      return this.getFallbackMessage(userName, streak, context);
    }
  }

  getFallbackMessage(userName, streak, context) {
    if (context === 'celebration') return `¡${userName}! 🔥 ¡LO HICISTE! Racha de ${streak} días. Eres IMPARABLE.`;
    if (streak === 0) return `Hola ${userName} 👋 Hoy es tu primer día. ¿Vamos? 🚀`;
    if (streak < 7) return `${userName}, llevas ${streak} días. ¡Eso es consistencia! 🔥 Sigue adelante.`;
    if (streak < 30) return `${userName}, ${streak} días. NO ES ACCIDENTE, ES DISCIPLINA. 💪`;
    return `${userName}, ${streak} DÍAS. 👑 Ya eres una MÁQUINA.`;
  }
}
const coachService = new CoachService();

export default function App() {
  const systemColorScheme = useColorScheme();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('login');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [coachScreenVisible, setCoachScreenVisible] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);
  const [appJustOpened, setAppJustOpened] = React.useState(true);
  const [coachMessage, setCoachMessage] = React.useState('');
  const [coachLoading, setCoachLoading] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingTasks, setEditingTasks] = React.useState([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [formData, setFormData] = React.useState({ name: '', email: '', password: '', confirmPassword: '' });
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
  const [darkModeOverride, setDarkModeOverride] = React.useState(null);

  const isDark = darkModeOverride !== null ? darkModeOverride : systemColorScheme === 'dark';
  const theme = isDark ? THEMES.dark : THEMES.light;
  const styles = getStyles(theme);

  // Fix definitivo: forzar scrollbar siempre visible para centrado consistente entre pantallas
  // El problema: Coach tiene poco contenido (sin scrollbar), otras pantallas tienen scrollbar.
  // El scrollbar ocupa ~15px, moviendo el centrado del pageWrapper.
  // Solución: CSS global que reserva el espacio del scrollbar siempre.
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      // Método 1: scrollbar-gutter en html/body
      document.documentElement.style.scrollbarGutter = 'stable';
      document.body.style.scrollbarGutter = 'stable';
      // Método 2: inyectar CSS global como fallback para todos los navegadores
      const styleId = 'morningwin-scrollfix';
      if (!document.getElementById(styleId)) {
        // React Native Web genera clases CSS atómicas para overflow.
        // Buscamos la clase exacta que define overflow-y:auto y la sobrescribimos con scroll.
        // Esto hace que el scrollbar siempre esté visible, evitando que el centrado salte.
        const findAndFixScrollClass = () => {
          let fixed = false;
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              Array.from(sheet.cssRules || []).forEach(rule => {
                if (rule.style && rule.style.overflowY === 'auto' && rule.selectorText) {
                  const style = document.createElement('style');
                  style.id = styleId;
                  style.textContent = `${rule.selectorText} { overflow-y: scroll !important; }`;
                  document.head.appendChild(style);
                  fixed = true;
                }
              });
            } catch(e) {}
          });
          return fixed;
        };
        
        // Intentar inmediatamente, y si no hay estilos cargados aún, reintentar
        if (!findAndFixScrollClass()) {
          setTimeout(findAndFixScrollClass, 100);
          setTimeout(findAndFixScrollClass, 500);
        }
      }
    }
  }, []);

  const handleDarkModeToggle = async (value) => {
    const newOverride = value === (systemColorScheme === 'dark') ? null : value;
    setDarkModeOverride(newOverride);
    if (user) await firebaseService.updateProgress(user.uid, { darkMode: newOverride });
  };

  const loadUserData = async (userProgress) => {
    setStreak(userProgress.streak || 0);
    setBestStreak(userProgress.bestStreak || 0);
    setCompletedDays(userProgress.completedDays || []);
    setReminderTime(userProgress.reminderTime || '6:00 AM');
    setNotificationsEnabled(userProgress.notificationsEnabled !== false);
    setSoundEnabled(userProgress.soundEnabled !== false);
    if (userProgress.darkMode !== undefined) setDarkModeOverride(userProgress.darkMode);
    if (userProgress.customTasks?.length > 0) {
      setTasks(userProgress.customTasks.sort((a, b) => (a.order || 0) - (b.order || 0)).map(t => ({ ...t, completed: false })));
    }
    setOnboardingComplete(true);
  };

  React.useEffect(() => {
    firebaseService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseService.currentUser);
        const progress = await firebaseService.getProgress(firebaseUser.uid);
        if (progress) await loadUserData(progress);
        firebaseService.listenToProgress(firebaseUser.uid, (updated) => {
  setStreak(updated.streak || 0);
  setBestStreak(updated.bestStreak || 0);
  setCompletedDays(updated.completedDays || []);
  console.log('DEBUG - completedDays from Firebase:', updated.completedDays);
          setReminderTime(updated.reminderTime || '6:00 AM');
          setNotificationsEnabled(updated.notificationsEnabled !== false);
          setSoundEnabled(updated.soundEnabled !== false);
          if (updated.darkMode !== undefined) setDarkModeOverride(updated.darkMode);
          if (updated.customTasks?.length > 0) setTasks(updated.customTasks.sort((a, b) => (a.order || 0) - (b.order || 0)).map(t => ({ ...t, completed: false })));
        });
      } else { setUser(null); setOnboardingComplete(false); }
    });
  }, []);

  React.useEffect(() => {
    if (user && onboardingComplete && appJustOpened) {
      setTimeout(() => { generateDailyCoach(); setAppJustOpened(false); }, 1500);
    }
  }, [user, onboardingComplete, appJustOpened]);

  const getMonthlyStats = () => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let completedInMonth = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (completedDays.includes(new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0])) completedInMonth++;
    }
    return { completedInMonth, daysInMonth, percentage: Math.round((completedInMonth / daysInMonth) * 100) };
  };

  const getCalendarDays = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = domingo
  
  const days = [];
  
  // Agregar días vacíos al inicio (antes del día 1)
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ day: null, completed: false });
  }
  
  // Agregar todos los días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    days.push({ 
      day, 
      completed: completedDays.includes(dateString),
      isToday: dateString === today
    });
  }
  
  return days;
};

  const generateDailyCoach = async () => {
    setCoachLoading(true);
    try {
      const stats = getMonthlyStats();
      const message = await coachService.generateCoachMessage(user.name, streak, bestStreak, stats.percentage, 'daily');
      setCoachMessage(message);
      setCurrentScreen('coach');
      setCoachScreenVisible(true);
    } catch (e) { console.error(e); } finally { setCoachLoading(false); }
  };

  const generateCelebrationCoach = async () => {
    setCoachLoading(true);
    try {
      const stats = getMonthlyStats();
      const message = await coachService.generateCoachMessage(user.name, streak + 1, bestStreak, stats.percentage, 'celebration');
      setCoachMessage(message);
      setCurrentScreen('coach');
      setCoachScreenVisible(true);
    } catch (e) { console.error(e); } finally { setCoachLoading(false); }
  };

  const handleShareCoach = async () => {
    try { await Share.share({ message: `${coachMessage}\n\n🏆 Sigo mis mañanas con MorningWin.\nhttps://morningwin.app` }); } catch (e) { console.error(e); }
  };

  const handleSignup = async () => {
    setErrorMessage('');
    if (!formData.name || !formData.email || !formData.password) { setErrorMessage('Completa todos los campos'); return; }
    if (formData.password !== formData.confirmPassword) { setErrorMessage('Las contraseñas no coinciden'); return; }
    if (formData.password.length < 6) { setErrorMessage('Mínimo 6 caracteres'); return; }
    setIsLoading(true);
    try {
      const result = await firebaseService.signup(formData.name, formData.email, formData.password);
      setUser(result.user); await loadUserData(result.progress);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (e) { setErrorMessage(e.message); } finally { setIsLoading(false); }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!formData.email || !formData.password) { setErrorMessage('Completa email y contraseña'); return; }
    setIsLoading(true);
    try {
      const result = await firebaseService.login(formData.email, formData.password);
      setUser(result.user); await loadUserData(result.progress);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setAppJustOpened(true);
    } catch (e) { setErrorMessage(e.message); } finally { setIsLoading(false); }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try { await firebaseService.logout(); setUser(null); setOnboardingComplete(false); } finally { setIsLoading(false); }
  };

  const toggleTask = (id) => {
    const today = new Date().toLocaleDateString('en-CA');
console.log('Today is:', today); // Debug
    if (completedDays.includes(today)) { Alert.alert('¡Ya completaste hoy! 🎉', 'Regresa mañana.'); return; }
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleComplete = async () => {
  const today = new Date().toLocaleDateString('en-CA');
  if (completedDays.includes(today)) { Alert.alert('¡Ya completaste hoy! 🎉'); return; }
  if (!tasks.every(t => t.completed)) return;
  
  // Calcular streak correctamente
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');
  
  const newStreak = completedDays.includes(yesterdayStr) ? streak + 1 : 1;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);
    const newCompletedDays = [...completedDays, today];
    setCompletedDays(newCompletedDays);
    if (user) await firebaseService.updateProgress(user.uid, { streak: newStreak, bestStreak: Math.max(bestStreak, newStreak), completedDays: newCompletedDays });
    setTasks(tasks.map(t => ({ ...t, completed: false })));
    if (notificationsEnabled) notificationService.sendNotification('🎉 ¡Mañana Ganada!', { body: `Racha: ${newStreak} días 🔥` });
    await generateCelebrationCoach();
  };

  const openEditRoutine = () => { setEditingTasks(JSON.parse(JSON.stringify(tasks))); setShowEditModal(true); };
  const saveEditedRoutine = async () => {
    if (editingTasks.length === 0) { Alert.alert('Error', 'Debes tener al menos 1 tarea'); return; }
    const customTasks = editingTasks.map((t, i) => ({ id: t.id, title: t.title, order: i + 1 }));
    if (user) await firebaseService.updateProgress(user.uid, { customTasks });
    setTasks(editingTasks.map(t => ({ ...t, completed: false })));
    setShowEditModal(false); setNewTaskTitle('');
    Alert.alert('Éxito', 'Rutina actualizada');
  };
  const addNewTask = () => {
    if (!newTaskTitle.trim()) { Alert.alert('Error', 'Escribe el título'); return; }
    setEditingTasks([...editingTasks, { id: 'task_' + Date.now(), title: newTaskTitle, completed: false }]);
    setNewTaskTitle('');
  };
  const deleteTask = (id) => setEditingTasks(editingTasks.filter(t => t.id !== id));
  const updateTaskTitle = (id, title) => setEditingTasks(editingTasks.map(t => t.id === id ? { ...t, title } : t));
  const moveTaskUp = (i) => { if (i > 0) { const t = [...editingTasks]; [t[i], t[i-1]] = [t[i-1], t[i]]; setEditingTasks(t); } };
  const moveTaskDown = (i) => { if (i < editingTasks.length - 1) { const t = [...editingTasks]; [t[i], t[i+1]] = [t[i+1], t[i]]; setEditingTasks(t); } };

  const monthlyStats = getMonthlyStats();
  const today = new Date().toLocaleDateString('en-CA');
const calendarDays = getCalendarDays();
const allCompleted = tasks.every(t => t.completed);

  // ==================== AUTH ====================
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.authFormWrapper}>
            <Text style={styles.authTitle}>{authMode === 'login' ? 'Inicia Sesión' : 'Crea tu Cuenta'}</Text>
            <Text style={styles.authSubtitle}>{authMode === 'login' ? 'Bienvenido de vuelta a MorningWin' : 'Únete a MorningWin'}</Text>
            {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorText}>❌ {errorMessage}</Text></View> : null}
            {authMode === 'signup' && <TextInput style={styles.input} placeholder="Tu nombre" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} placeholderTextColor={theme.textPlaceholder} />}
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} placeholderTextColor={theme.textPlaceholder} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Contraseña (mín. 6)" value={formData.password} onChangeText={t => setFormData({...formData, password: t})} placeholderTextColor={theme.textPlaceholder} secureTextEntry />
            {authMode === 'signup' && <TextInput style={styles.input} placeholder="Confirmar Contraseña" value={formData.confirmPassword} onChangeText={t => setFormData({...formData, confirmPassword: t})} placeholderTextColor={theme.textPlaceholder} secureTextEntry />}
            <TouchableOpacity style={[styles.authButton, isLoading && styles.authButtonDisabled]} onPress={authMode === 'login' ? handleLogin : handleSignup} disabled={isLoading}>
              <Text style={styles.authButtonText}>{isLoading ? 'Cargando...' : authMode === 'login' ? 'Inicia Sesión' : 'Registrarse'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setFormData({name:'',email:'',password:'',confirmPassword:''}); setErrorMessage(''); }}>
              <Text style={styles.toggleAuthText}>{authMode === 'login' ? '¿No tienes cuenta? Registrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
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
            <View style={styles.taskPreview}>{tasks.map(t => <View key={t.id} style={styles.previewTask}><Text style={styles.previewTaskText}>✓ {t.title}</Text></View>)}</View>
            <TouchableOpacity style={styles.onboardingButton} onPress={() => setCurrentStep(1)}><Text style={styles.onboardingButtonText}>Siguiente</Text></TouchableOpacity>
          </View>
        )}
        {currentStep === 1 && (
          <View style={styles.onboardingContainer}>
            <Text style={styles.onboardingTitle}>Hora de Recordatorio</Text>
            <Text style={styles.onboardingSubtitle}>¿Cuándo quieres que te recordemos?</Text>
            <View style={styles.timeOptions}>
              {['5:00 AM','6:00 AM','7:00 AM','8:00 AM'].map(time => (
                <TouchableOpacity key={time} style={[styles.timeButton, reminderTime===time && styles.timeButtonActive]} onPress={() => setReminderTime(time)}>
                  <Text style={[styles.timeButtonText, reminderTime===time && styles.timeButtonTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.onboardingButton} onPress={async () => { await firebaseService.updateProgress(user.uid, { reminderTime, onboardingCompleted: true }); setOnboardingComplete(true); }}>
              <Text style={styles.onboardingButtonText}>¡Empecemos!</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ==================== TOP NAV ====================
  // Siempre 4 elementos: nombre · 🌙/☀️ · ⚙️ · ⏻/🏠
  // Home: ⚙️ y ⏻ visibles, 🏠 invisible
  // Secundarias: ⚙️ invisible, 🏠 visible en posición de ⏻
  // Home:        🌙 · 📊(visible) · ⚙️(visible)  · ⏻(visible)
  // Secundarias: 🌙 · 📊(invisible) · ⚙️(invisible) · 🏠(visible)
  const TopNav = ({ onBack = null, showSettings = false, showPower = false, showStats = false }) => (
    <View style={styles.topNav}>
      <TouchableOpacity onPress={() => setCurrentScreen('home')}>
        <Text style={styles.topNavName}>MorningWin</Text>
      </TouchableOpacity>
      <View style={styles.topNavRight}>
        <Text style={styles.topNavUser}>{user.name}</Text>
        <TouchableOpacity style={styles.themeToggleBtn} onPress={() => handleDarkModeToggle(!isDark)}>
          <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navIconBtn, !showStats && styles.navIconInvisible]} onPress={showStats ? () => setCurrentScreen('stats') : undefined}>
          <Text style={styles.navIconText}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navIconBtn, !showSettings && styles.navIconInvisible]} onPress={showSettings ? () => setCurrentScreen('settings') : undefined}>
          <Text style={styles.navIconText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIconBtn} onPress={showPower ? handleLogout : (onBack || (() => setCurrentScreen('home')))}>
          <Text style={styles.navIconText}>{showPower ? '⏻' : '🏠'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==================== COACH SCREEN ====================
  if (currentScreen === 'coach') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
          <TopNav onBack={() => { setCurrentScreen('home'); setCoachScreenVisible(false); }} />
          <Text style={styles.pageTitle}>💬 Tu Coach IA</Text>
          <View style={styles.coachScreenContent}>
            {coachLoading
              ? <ActivityIndicator size="large" color={theme.textPrimary} style={{ marginVertical: 40 }} />
              : <>
                  <View style={styles.coachMessageBox}>
                    <Text style={styles.coachScreenMessageText}>{coachMessage}</Text>
                  </View>
                  <View style={styles.coachScreenButtons}>
                    <TouchableOpacity style={styles.coachScreenShareButton} onPress={handleShareCoach}>
                      <Text style={styles.coachScreenShareButtonText}>📤 Compartir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.coachScreenCloseButton} onPress={() => { setCurrentScreen('home'); setCoachScreenVisible(false); }}>
                      <Text style={styles.coachScreenCloseButtonText}>Continuar</Text>
                    </TouchableOpacity>
                  </View>
                </>
            }
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== EDIT ROUTINE ====================
  if (showEditModal) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
          <TopNav onBack={() => setShowEditModal(false)} />
          <Text style={styles.pageTitle}>✏️ Editar Mi Rutina</Text>
          <View style={styles.editScreenContent}>
            <Text style={styles.editSectionTitle}>Mis Tareas</Text>
            <View style={styles.tasksEditList}>
              {editingTasks.map((task, index) => (
                <View key={task.id} style={styles.editTaskItem}>
                  <View style={styles.editTaskInfo}>
                    <Text style={styles.editTaskIndex}>{index + 1}.</Text>
                    <TextInput style={styles.editTaskInput} value={task.title} onChangeText={t => updateTaskTitle(task.id, t)} placeholder="Nombre de la tarea" placeholderTextColor={theme.textPlaceholder} />
                  </View>
                  <View style={styles.editTaskButtons}>
                    <TouchableOpacity style={[styles.editArrowButton, index===0 && styles.editArrowButtonDisabled]} onPress={() => moveTaskUp(index)} disabled={index===0}><Text style={styles.editArrowText}>↑</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.editArrowButton, index===editingTasks.length-1 && styles.editArrowButtonDisabled]} onPress={() => moveTaskDown(index)} disabled={index===editingTasks.length-1}><Text style={styles.editArrowText}>↓</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.editDeleteButton} onPress={() => deleteTask(task.id)}><Text style={styles.editDeleteText}>🗑️</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.editSectionTitle}>Agregar Nueva Tarea</Text>
            <View style={styles.addTaskContainer}>
              <TextInput style={styles.addTaskInput} placeholder="Escribe una nueva tarea" value={newTaskTitle} onChangeText={setNewTaskTitle} placeholderTextColor={theme.textPlaceholder} />
              <TouchableOpacity style={styles.addTaskButton} onPress={addNewTask}><Text style={styles.addTaskButtonText}>+ Agregar</Text></TouchableOpacity>
            </View>
            <View style={styles.editScreenButtons}>
              <TouchableOpacity style={styles.editSaveButton} onPress={saveEditedRoutine}><Text style={styles.editSaveButtonText}>✅ Guardar Cambios</Text></TouchableOpacity>
              <TouchableOpacity style={styles.editCancelButton} onPress={() => setShowEditModal(false)}><Text style={styles.editCancelButtonText}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== STATS ====================
  if (currentScreen === 'stats') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
          <TopNav onBack={() => setCurrentScreen('home')} />
          <Text style={styles.pageTitle}>Estadísticas</Text>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Racha Actual</Text>
            <View style={styles.statRow}><Text style={styles.statEmoji}>🔥</Text><Text style={styles.statNumber}>{streak}</Text><Text style={styles.statUnit}>días</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mejor Racha</Text>
            <View style={styles.statRow}><Text style={styles.statEmoji}>⭐</Text><Text style={styles.statNumber}>{bestStreak}</Text><Text style={styles.statUnit}>días</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completitud Mensual</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}><View style={[styles.progressFill, {width:`${monthlyStats.percentage}%`}]} /></View>
              <Text style={styles.percentageText}>{monthlyStats.completedInMonth}/{monthlyStats.daysInMonth} ({monthlyStats.percentage}%)</Text>
            </View>
          </View>
          <View style={styles.calendarCard}>
            <Text style={styles.statLabel}>Este Mes</Text>
            <View style={styles.weekDaysHeader}>{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}</View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, i) => (
                <View key={i} style={[styles.calendarDay, item.day===null && styles.emptyDay, item.completed && styles.completedDay, !item.completed && item.day!==null && styles.incompleteDay]}>
                  {item.day!==null && <Text style={[styles.calendarDayText, item.completed && styles.completedDayText]}>{item.day}</Text>}
                  {/* Marca eliminada - color verde indica completado */}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== SETTINGS ====================
  if (currentScreen === 'settings') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pageWrapper}>
          <TopNav onBack={() => setCurrentScreen('home')} />
          <Text style={styles.pageTitle}>Configuración</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perfil</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileSubtext}>{user.email}</Text>
              <Text style={styles.profileSubtext2}>Miembro desde: {new Date(user.createdAt).toLocaleDateString('es-ES')}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>
            <TouchableOpacity style={styles.coachButtonSettings} onPress={openEditRoutine}><Text style={styles.coachButtonText}>✏ Editar Mi Rutina</Text></TouchableOpacity>
            <TouchableOpacity style={styles.coachButtonSettings} onPress={generateDailyCoach}><Text style={styles.coachButtonText}>◎ Obtener Mensaje del Coach</Text></TouchableOpacity>
            <View style={styles.premiumCard}>
              <Text style={styles.premiumTitle}>Actualiza a Pro</Text>
              <Text style={styles.premiumSubtitle}>$8.99/mes · Stats ilimitadas · Sin ads</Text>
              <TouchableOpacity style={styles.premiumButton}><Text style={styles.premiumButtonText}>Suscribirse Ahora</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}><Text style={styles.settingTitle}>Notificaciones Push</Text><Text style={styles.settingSubtitle}>Recordatorio diario a las {reminderTime}</Text></View>
              <Switch value={notificationsEnabled} onValueChange={async v => { setNotificationsEnabled(v); await firebaseService.updateProgress(user.uid, {notificationsEnabled: v}); }} trackColor={{false: theme.switchTrackOff, true: theme.switchTrackOn}} thumbColor={notificationsEnabled ? theme.switchThumbOn : theme.switchThumbOff} />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}><Text style={styles.settingTitle}>Sonido</Text><Text style={styles.settingSubtitle}>Sonido en notificaciones</Text></View>
              <Switch value={soundEnabled} onValueChange={async v => { setSoundEnabled(v); await firebaseService.updateProgress(user.uid, {soundEnabled: v}); }} trackColor={{false: theme.switchTrackOff, true: theme.switchTrackOn}} thumbColor={soundEnabled ? theme.switchThumbOn : theme.switchThumbOff} disabled={!notificationsEnabled} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Text style={styles.logoutButtonText}>Cerrar Sesión</Text></TouchableOpacity>
          </View>
          <View style={styles.spacer} />
        </View>
      </ScrollView>
    );
  }

  // ==================== HOME ====================
  return (
    <ScrollView style={styles.container}>
      <View style={styles.pageWrapper}>
        <TopNav onBack={null} showStats={true} showSettings={true} showPower={true} />
        <View style={styles.homeDate}>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', {weekday:'long', month:'long', day:'numeric'})}</Text>
        </View>
        <View style={styles.streakContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>racha de días</Text>
        </View>
        <View style={styles.titleSection}>
          {completedDays.includes(today)
            ? <><Text style={styles.title}>🎉 ¡Felicidades!</Text><Text style={styles.subtitle}>Haz completado tu rutina antes de las 9am. Nos vemos mañana</Text></>
            : <><Text style={styles.title}>Gana tu Mañana</Text><Text style={styles.subtitle}>Completa tu rutina antes de las 9am</Text></>
          }
        </View>
        <View style={styles.tasksContainer}>
          {tasks.map(task => {
            const isCompletedToday = completedDays.includes(today);
            return (
              <TouchableOpacity key={task.id} style={[styles.taskItem, task.completed && styles.taskCompleted, isCompletedToday && styles.taskDisabled]} onPress={() => toggleTask(task.id)} disabled={isCompletedToday}>
                <View style={styles.taskCheckbox}>{task.completed && <Text style={styles.checkmark}>✓</Text>}</View>
                <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>{task.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.completeButton, allCompleted && !completedDays.includes(today) && styles.completeButtonActive]} onPress={handleComplete} disabled={!allCompleted || completedDays.includes(today)}>
          <Text style={styles.completeButtonText}>{allCompleted ? '🎉 ¡Mañana Ganada!' : `${tasks.filter(t=>t.completed).length}/${tasks.length} hecho`}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ==================== STYLES ====================
function getStyles(theme) {
  return StyleSheet.create({
    // ── Global ────────────────────────────────────────────────
    container: { flex: 1, backgroundColor: theme.bg, width: '100%', overflowY: 'scroll' },
    pageWrapper: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20 },

    // ── TopNav ────────────────────────────────────────────────
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 24 },
    topNavName: { fontSize: 18, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 },
    topNavRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    topNavUser: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
    themeToggleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    themeToggleIcon: { fontSize: 14 },
    navIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    navIconText: { fontSize: 14 },
    navIconInvisible: { opacity: 0, pointerEvents: 'none' },
    pageTitle: { fontSize: 28, fontWeight: '800', color: theme.textPrimary, marginBottom: 24 },
    homeDate: { marginBottom: 16 },
    date: { fontSize: 14, color: theme.textMuted },

    // ── Auth ──────────────────────────────────────────────────
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

    // ── Onboarding ────────────────────────────────────────────
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

    // ── Home ──────────────────────────────────────────────────
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

    // ── Stats ─────────────────────────────────────────────────
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
    calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: '100%' },
calendarDay: { width: '100%', aspectRatio: '1', justifyContent: 'center', alignItems: 'center', borderRadius: 8, position: 'relative', display: 'flex' },
    emptyDay: { backgroundColor: 'transparent' },
    completedDay: { backgroundColor: theme.green },
    incompleteDay: { backgroundColor: theme.bgSecondary },
    calendarDayText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    completedDayText: { color: '#000', fontWeight: '700' },
    checkmarkOverlay: { display: 'none' }, // Marca eliminada (día verde = completado)

    // ── Settings ──────────────────────────────────────────────
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

    // ── Coach Screen ──────────────────────────────────────────
    // CLAVE: width: '100%' en TODOS los elementos para que coincida con pageWrapper
    coachScreenContent: { width: '100%', paddingVertical: 40 },
    coachMessageBox: { width: '100%', backgroundColor: theme.bgCard, borderRadius: 16, padding: 24, marginBottom: 30, borderWidth: 1, borderColor: theme.border },
    coachScreenMessageText: { fontSize: 16, color: theme.textPrimary, lineHeight: 24, textAlign: 'center' },
    coachScreenButtons: { width: '100%', flexDirection: 'column', gap: 12 },
    coachScreenShareButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnSecondary, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: theme.btnSecondaryBorder },
    coachScreenShareButtonText: { color: theme.btnSecondaryText, fontSize: 16, fontWeight: '700' },
    coachScreenCloseButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center' },
    coachScreenCloseButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },

    // ── Edit Routine Screen ───────────────────────────────────
    editScreenContent: { width: '100%', paddingVertical: 20 },
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
    editScreenButtons: { width: '100%', flexDirection: 'column', gap: 12, marginTop: 20, marginBottom: 30 },
    editSaveButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnPrimary, borderRadius: 12, alignItems: 'center' },
    editSaveButtonText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: '700' },
    editCancelButton: { width: '100%', paddingVertical: 14, backgroundColor: theme.btnSecondary, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: theme.btnSecondaryBorder },
    editCancelButtonText: { color: theme.btnSecondaryText, fontSize: 16, fontWeight: '700' },
  });
}
