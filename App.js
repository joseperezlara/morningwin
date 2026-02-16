import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, Modal, ActivityIndicator, Share } from 'react-native';

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY || 'fallback-key-for-demo';

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

// ==================== FIREBASE SERVICE ====================
class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.checkSession();
  }

  checkSession() {
    const sessionId = localStorage.getItem('morningwin_session_id');
    if (sessionId) {
      const sessions = JSON.parse(localStorage.getItem('morningwin_sessions') || '{}');
      if (sessions[sessionId]) {
        this.currentUser = sessions[sessionId];
      }
    }
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

  async signup(name, email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!name || name.trim().length < 2) {
          reject(new Error('El nombre debe tener al menos 2 caracteres'));
          return;
        }

        if (!this.isValidEmail(email)) {
          reject(new Error('Email no válido. Usa un dominio real (ej: ejemplo@gmail.com)'));
          return;
        }

        if (!password || password.length < 6) {
          reject(new Error('La contraseña debe tener al menos 6 caracteres'));
          return;
        }

        const users = JSON.parse(localStorage.getItem('morningwin_users') || '{}');
        if (users[email]) {
          reject(new Error('Este email ya está registrado'));
          return;
        }

        const uid = 'user_' + Date.now();
        const user = {
          uid,
          name,
          email,
          password: btoa(password),
          createdAt: new Date().toISOString(),
          emailVerified: false
        };

        users[email] = user;
        localStorage.setItem('morningwin_users', JSON.stringify(users));

        const userProgress = {
          uid,
          streak: 0,
          bestStreak: 0,
          completedDays: [],
          reminderTime: '6:00 AM',
          notificationsEnabled: true,
          soundEnabled: true,
          customTasks: [
            { id: '1', title: 'Wake up (on time)', order: 1 },
            { id: '2', title: 'Make bed', order: 2 },
            { id: '3', title: 'Drink water', order: 3 },
            { id: '4', title: 'Move body (5 min)', order: 4 },
            { id: '5', title: 'No phone (10 min)', order: 5 },
          ],
          lastUpdate: new Date().toISOString()
        };

        const progressData = JSON.parse(localStorage.getItem('morningwin_progress') || '{}');
        progressData[uid] = userProgress;
        localStorage.setItem('morningwin_progress', JSON.stringify(progressData));

        const sessionId = 'session_' + Date.now();
        const sessions = JSON.parse(localStorage.getItem('morningwin_sessions') || '{}');
        sessions[sessionId] = user;
        localStorage.setItem('morningwin_sessions', JSON.stringify(sessions));
        localStorage.setItem('morningwin_session_id', sessionId);

        this.currentUser = user;
        resolve({ user, uid, progress: userProgress });
      }, 500);
    });
  }

  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password) {
          reject(new Error('Email y contraseña requeridos'));
          return;
        }

        const users = JSON.parse(localStorage.getItem('morningwin_users') || '{}');
        const user = users[email];

        if (!user || user.password !== btoa(password)) {
          reject(new Error('Email o contraseña incorrectos'));
          return;
        }

        const progressData = JSON.parse(localStorage.getItem('morningwin_progress') || '{}');
        const progress = progressData[user.uid] || {
          uid: user.uid,
          streak: 0,
          bestStreak: 0,
          completedDays: [],
          reminderTime: '6:00 AM',
          notificationsEnabled: true,
          soundEnabled: true,
          customTasks: [
            { id: '1', title: 'Wake up (on time)', order: 1 },
            { id: '2', title: 'Make bed', order: 2 },
            { id: '3', title: 'Drink water', order: 3 },
            { id: '4', title: 'Move body (5 min)', order: 4 },
            { id: '5', title: 'No phone (10 min)', order: 5 },
          ]
        };

        const sessionId = 'session_' + Date.now();
        const sessions = JSON.parse(localStorage.getItem('morningwin_sessions') || '{}');
        sessions[sessionId] = user;
        localStorage.setItem('morningwin_sessions', JSON.stringify(sessions));
        localStorage.setItem('morningwin_session_id', sessionId);

        this.currentUser = user;
        resolve({ user, progress });
      }, 500);
    });
  }

  async logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessionId = localStorage.getItem('morningwin_session_id');
        if (sessionId) {
          const sessions = JSON.parse(localStorage.getItem('morningwin_sessions') || '{}');
          delete sessions[sessionId];
          localStorage.setItem('morningwin_sessions', JSON.stringify(sessions));
          localStorage.removeItem('morningwin_session_id');
        }
        this.currentUser = null;
        resolve();
      }, 300);
    });
  }

  async updateProgress(uid, progressData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allProgress = JSON.parse(localStorage.getItem('morningwin_progress') || '{}');
        allProgress[uid] = {
          ...allProgress[uid],
          ...progressData,
          lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('morningwin_progress', JSON.stringify(allProgress));
        resolve(allProgress[uid]);
      }, 300);
    });
  }

  async getProgress(uid) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allProgress = JSON.parse(localStorage.getItem('morningwin_progress') || '{}');
        resolve(allProgress[uid] || {
          uid,
          streak: 0,
          bestStreak: 0,
          completedDays: [],
          reminderTime: '6:00 AM',
          notificationsEnabled: true,
          soundEnabled: true,
          customTasks: [
            { id: '1', title: 'Wake up (on time)', order: 1 },
            { id: '2', title: 'Make bed', order: 2 },
            { id: '3', title: 'Drink water', order: 3 },
            { id: '4', title: 'Move body (5 min)', order: 4 },
            { id: '5', title: 'No phone (10 min)', order: 5 },
          ]
        });
      }, 200);
    });
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
  const [user, setUser] = React.useState(firebaseService.currentUser);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('login');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [currentScreen, setCurrentScreen] = React.useState('home');
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

  const loadUserData = async (userProgress) => {
    setStreak(userProgress.streak || 0);
    setBestStreak(userProgress.bestStreak || 0);
    setCompletedDays(userProgress.completedDays || []);
    setReminderTime(userProgress.reminderTime || '6:00 AM');
    setNotificationsEnabled(userProgress.notificationsEnabled !== false);
    setSoundEnabled(userProgress.soundEnabled !== false);
    
    if (userProgress.customTasks && userProgress.customTasks.length > 0) {
      const sortedTasks = userProgress.customTasks
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(task => ({ ...task, completed: false }));
      setTasks(sortedTasks);
    }
    
    setOnboardingComplete(true);
  };

  React.useEffect(() => {
    if (user) {
      firebaseService.getProgress(user.uid).then((userProgress) => {
        if (userProgress) {
          setStreak(userProgress.streak || 0);
          setBestStreak(userProgress.bestStreak || 0);
          setCompletedDays(userProgress.completedDays || []);
          setReminderTime(userProgress.reminderTime || '6:00 AM');
          setNotificationsEnabled(userProgress.notificationsEnabled !== false);
          setSoundEnabled(userProgress.soundEnabled !== false);
          
          if (userProgress.customTasks && userProgress.customTasks.length > 0) {
            const sortedTasks = userProgress.customTasks
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(task => ({ ...task, completed: false }));
            setTasks(sortedTasks);
          }
          
          if (userProgress.onboardingCompleted) {
            setOnboardingComplete(true);
          }
        }
      });
    }
  }, [user]);

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
      setShowCoachModal(true);
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
      setShowCoachModal(true);
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
    setEditingTasks(JSON.parse(JSON.stringify(tasks)));
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

  // ==================== COACH MODAL ====================
  const CoachModal = () => (
    <Modal
      visible={showCoachModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCoachModal(false)}
    >
      <View style={styles.coachOverlay}>
        <View style={styles.coachContent}>
          <TouchableOpacity 
            style={styles.coachClose}
            onPress={() => setShowCoachModal(false)}
          >
            <Text style={styles.coachCloseText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.coachTitle}>💬 Tu Coach IA</Text>

          {coachLoading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginVertical: 20 }} />
          ) : (
            <Text style={styles.coachMessageText}>{coachMessage}</Text>
          )}

          <View style={styles.coachButtons}>
            <TouchableOpacity
              style={styles.coachShareButton}
              onPress={handleShareCoach}
            >
              <Text style={styles.coachShareButtonText}>📤 Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.coachCloseButton}
              onPress={() => setShowCoachModal(false)}
            >
              <Text style={styles.coachCloseButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
                placeholderTextColor="#999"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email (ej: pepé@gmail.com)"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholderTextColor="#999"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholderTextColor="#999"
              secureTextEntry
            />

            {authMode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholderTextColor="#999"
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

  // ==================== STATS SCREEN ====================
  if (currentScreen === 'stats') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Estadísticas</Text>
        </View>

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
      </ScrollView>
    );
  }

  // ==================== SETTINGS SCREEN ====================
  if (currentScreen === 'settings') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerSettings}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Configuración</Text>
        </View>

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
              trackColor={{ false: '#f0f0f0', true: '#81c784' }}
              thumbColor={notificationsEnabled ? '#00ff00' : '#f0f0f0'}
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
              trackColor={{ false: '#f0f0f0', true: '#81c784' }}
              thumbColor={soundEnabled ? '#00ff00' : '#f0f0f0'}
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
      </ScrollView>
    );
  }

// ==================== EDIT ROUTINE SCREEN ====================
  if (showEditModal) {
    return (
      <View style={styles.editModalContainer}>
        <ScrollView style={styles.editModalScroll}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.editModalBackButton}>← Atrás</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>✏️ Editar Mi Rutina</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.editModalContent}>
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
                    />
                  </View>

                  <View style={styles.editTaskButtons}>
                    <TouchableOpacity
                      style={styles.editArrowButton}
                      onPress={() => moveTaskUp(index)}
                      disabled={index === 0}
                    >
                      <Text style={styles.editArrowText}>↑</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editArrowButton}
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
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={addNewTask}
              >
                <Text style={styles.addTaskButtonText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editModalButtons}>
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
        </ScrollView>
      </View>
    );
  }

// ==================== HOME SCREEN ====================
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => setCurrentScreen('stats')}
            >
              <Text style={styles.statsButtonText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setCurrentScreen('settings')}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
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
      </ScrollView>

      <CoachModal />
    </>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20 },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40, width: '100%' },
  authFormWrapper: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 20 },
  authTitle: { fontSize: 32, fontWeight: '900', color: '#000', marginBottom: 10, textAlign: 'center' },
  authSubtitle: { fontSize: 16, color: '#999', marginBottom: 20, textAlign: 'center' },
  errorBox: { width: '100%', backgroundColor: '#ffebee', borderRadius: 8, padding: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#f44336' },
  errorText: { color: '#c62828', fontSize: 14, fontWeight: '600' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, backgroundColor: '#fafafa' },
  authButton: { width: '100%', paddingVertical: 16, backgroundColor: '#000', borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  authButtonDisabled: { opacity: 0.5 },
  authButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleAuthText: { fontSize: 14, color: '#0066cc', textAlign: 'center', marginTop: 10 },
  onboardingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  onboardingTitle: { fontSize: 32, fontWeight: '900', color: '#000', marginBottom: 10, textAlign: 'center' },
  onboardingSubtitle: { fontSize: 16, color: '#999', marginBottom: 40, textAlign: 'center' },
  taskPreview: { width: '100%', marginBottom: 30, gap: 10 },
  previewTask: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f5f5f5', borderRadius: 8 },
  previewTaskText: { fontSize: 14, color: '#333' },
  timeOptions: { width: '100%', marginBottom: 30, gap: 12 },
  timeButton: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center' },
  timeButtonActive: { backgroundColor: '#000' },
  timeButtonText: { fontSize: 16, color: '#333', fontWeight: '600' },
  timeButtonTextActive: { color: '#fff' },
  onboardingButton: { width: '100%', paddingVertical: 16, backgroundColor: '#000', borderRadius: 12, alignItems: 'center' },
  onboardingButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
  headerSettings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
  headerButtons: { flexDirection: 'row', gap: 10 },
  date: { fontSize: 14, color: '#999' },
  backButton: { fontSize: 16, color: '#000', fontWeight: '600' },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#000' },
  statsButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  statsButtonText: { fontSize: 16 },
  settingsButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  settingsButtonText: { fontSize: 16 },
  streakContainer: { alignItems: 'center', marginBottom: 30 },
  streakEmoji: { fontSize: 40, marginBottom: 8 },
  streakNumber: { fontSize: 48, fontWeight: '900', color: '#000' },
  streakLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  titleSection: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#999' },
  tasksContainer: { marginBottom: 30, gap: 12 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#f5f5f5', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  taskCompleted: { borderColor: '#00ff00', backgroundColor: '#f0fff0' },
  taskCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkmark: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  taskText: { fontSize: 16, color: '#333', flex: 1, fontWeight: '500' },
  taskTextCompleted: { color: '#999', textDecorationLine: 'line-through' },
  taskDisabled: { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' },
  completeButton: { paddingVertical: 18, paddingHorizontal: 20, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  completeButtonActive: { backgroundColor: '#000' },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  statLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statEmoji: { fontSize: 32 },
  statNumber: { fontSize: 40, fontWeight: '900', color: '#000' },
  statUnit: { fontSize: 14, color: '#999', fontWeight: '500' },
  progressContainer: { gap: 8 },
  progressBar: { height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00ff00', borderRadius: 6 },
  percentageText: { fontSize: 14, color: '#666', fontWeight: '600' },
  calendarCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekDayText: { fontSize: 12, fontWeight: '600', color: '#999', width: '14%', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calendarDay: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, position: 'relative' },
  emptyDay: { backgroundColor: 'transparent' },
  completedDay: { backgroundColor: '#00ff00' },
  incompleteDay: { backgroundColor: '#f5f5f5' },
  calendarDayText: { fontSize: 12, fontWeight: '600', color: '#333' },
  completedDayText: { color: '#000', fontWeight: '700' },
  checkmarkOverlay: { position: 'absolute', fontSize: 14, fontWeight: '700', color: '#000' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 12, textTransform: 'uppercase' },
  profileCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 4 },
  profileSubtext: { fontSize: 14, color: '#999' },
  profileSubtext2: { fontSize: 12, color: '#ccc', marginTop: 4 },
  coachButtonSettings: { width: '100%', paddingVertical: 12, backgroundColor: '#000', borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  coachButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  settingLabel: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  settingSubtitle: { fontSize: 12, color: '#999' },
  premiumCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  premiumSubtitle: { fontSize: 12, color: '#999', marginBottom: 12 },
  premiumButton: { paddingVertical: 12, backgroundColor: '#000', borderRadius: 8, alignItems: 'center' },
  premiumButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutButton: { paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#ddd' },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
  spacer: { height: 20 },
  coachOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  coachContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', alignItems: 'center' },
  coachClose: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  coachCloseText: { fontSize: 18, color: '#666', fontWeight: '700' },
  coachTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16 },
  coachMessageText: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20, lineHeight: 24, fontWeight: '500' },
  coachButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  coachShareButton: { flex: 1, paddingVertical: 12, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' },
  coachShareButtonText: { color: '#000', fontSize: 14, fontWeight: '700' },
  coachCloseButton: { flex: 1, paddingVertical: 12, backgroundColor: '#000', borderRadius: 8, alignItems: 'center' },
  coachCloseButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  editModalContainer: { flex: 1, backgroundColor: '#fff' },
  editModalScroll: { flex: 1 },
  editModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  editModalBackButton: { fontSize: 16, color: '#000', fontWeight: '600' },
  editModalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  editModalContent: { paddingHorizontal: 20, paddingVertical: 20 },
  editSectionTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 12, marginTop: 20, textTransform: 'uppercase' },
  tasksEditList: { gap: 12, marginBottom: 20 },
  editTaskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 12 },
  editTaskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  editTaskIndex: { fontSize: 14, fontWeight: '700', color: '#000', marginRight: 8, minWidth: 20 },
  editTaskInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#fff' },
  editTaskButtons: { flexDirection: 'row', gap: 8 },
  editArrowButton: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  editArrowText: { fontSize: 14, fontWeight: '700', color: '#000' },
  editDeleteButton: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#ffebee', borderRadius: 8 },
  editDeleteText: { fontSize: 14 },
  addTaskContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  addTaskInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, backgroundColor: '#fafafa' },
  addTaskButton: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#000', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addTaskButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  editModalButtons: { flexDirection: 'column', gap: 12, marginTop: 20, marginBottom: 30 },
  editSaveButton: { width: '100%', paddingVertical: 14, backgroundColor: '#000', borderRadius: 12, alignItems: 'center' },
  editSaveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  editCancelButton: { width: '100%', paddingVertical: 14, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#ddd' },
  editCancelButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});