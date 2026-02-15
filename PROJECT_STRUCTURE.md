# MorningWin - Project Structure & Files Overview

## 📁 Project Organization

```
morningwin/
├── App.js                                  # Entry point principal
├── app.json                                # Expo configuration
├── package.json                            # Dependencies
├── README.md                               # Quick start guide
├── PROJECT_STRUCTURE.md                    # Este archivo
│
├── src/
│   ├── screens/                            # Pantallas principales
│   │   ├── OnboardingScreen.js             # Onboarding (3 pasos)
│   │   ├── HomeScreen.js                   # Checklist + Racha
│   │   ├── StatsScreen.js                  # Stats + Paywall
│   │   └── SettingsScreen.js               # Settings
│   │
│   ├── navigation/
│   │   └── index.js                        # React Navigation setup
│   │
│   ├── store/
│   │   └── index.js                        # Zustand store (estado global)
│   │
│   ├── services/
│   │   ├── firebase.js                     # Firebase config + métodos
│   │   ├── revenuecat.js                   # RevenueCat subscriptions
│   │   └── notifications.js                # Push notifications
│   │
│   └── components/                         # (Para expandir)
│       └── (expandir después)
│
├── docs/
│   ├── FIREBASE_SETUP.md                   # Firebase paso a paso
│   ├── REVENUECAT_SETUP.md                 # RevenueCat config
│   ├── DEPLOYMENT.md                       # Deploy a App Store/Google Play
│   └── ROADMAP.md                          # Fases futuras
│
└── assets/
    ├── icon.png                            # App icon
    ├── splash.png                          # Splash screen
    ├── adaptive-icon.png                   # Android adaptive icon
    └── notification-icon.png               # Push notification icon
```

---

## 📄 Archivos Principales

### `App.js`
**Purpose:** Entry point de la aplicación
**What it does:**
- Inicializa RevenueCat
- Configura notificaciones
- Renderiza RootNavigator

**Key Code:**
```javascript
setupRevenueCat()
notificationServices.requestPermissions()
<RootNavigator />
```

---

### `src/store/index.js`
**Purpose:** Estado global usando Zustand
**What it manages:**
- User auth & subscription status
- Tasks & routine state
- Streak data
- Notification preferences

**Key State:**
```
- userId, isAuthenticated, isPro
- tasks (completed status)
- currentStreak, bestStreak
- streakHistory (historial diario)
- reminderTime, reminderEnabled
```

**Key Actions:**
```javascript
markTaskComplete(taskId)      // Mark tarea como hecha
completeDay()                 // Complete rutina, incrementar racha
missDay()                     // Perder racha
recoverStreak()               // Pro feature: recuperar racha
resetDay()                    // Reset diario
getMonthlyCompletionPercentage() // Calcular %
```

---

### `src/screens/HomeScreen.js`
**Purpose:** Pantalla principal - checklist + racha
**What it displays:**
- Fecha actual
- 🔥 Racha (hero metric)
- 5 tareas con checkboxes
- Botón "Complete Morning"
- Enlace a Stats

**Flow:**
1. Usuario ve racha actual
2. Toca tareas para marcar completadas
3. Cuando todas están checked → botón se activa
4. Toca "Complete" → racha incrementa
5. Se muestra celebración

**Psicología:**
- Hero metric (racha) arriba y grande
- Tasks no tienen timers (simple)
- Immediate feedback (animación)

---

### `src/screens/StatsScreen.js`
**Purpose:** Stats + Paywall (bifurcado)
**What it does:**
1. Si FREE → Muestra PaywallScreen
2. Si PRO → Muestra stats completas

**Free users VEN:**
- Current streak (solo número)
- Botón para ver más (paywall)

**Pro users VEN:**
- 🔥 Current streak (HERO)
- 📊 Monthly completion %
- 🏆 Best streak ever
- 📅 Calendar (verde/rojo)

**Paywall Copy:**
```
"Win your mornings."
"People who track stay consistent 3x longer."
✔️ See your streak history
✔️ Recover missed days
✔️ Build custom routines
✔️ Track monthly discipline
"Start 3-day free trial"
```

---

### `src/screens/OnboardingScreen.js`
**Purpose:** Onboarding flow (3 pasos)
**What it does:**

**Paso 1:** Name input
- Emoji: 🔥
- "Win Your Mornings"
- Input: "What's your name?"

**Paso 2:** Reminder time
- Emoji: ⏰
- "Set Your Reminder"
- Options: 5AM, 6AM, 7AM, 8AM

**Paso 3:** Confirmation
- Emoji: ✅
- "Ready to Win?"
- Preview de 5 tareas default

**After:** SetUp notifications → Navigate to Home

---

### `src/screens/SettingsScreen.js`
**Purpose:** Configuraciones
**What it has:**
- Toggle notifications (on/off)
- Manage subscription (Pro only)
- About section
- Privacy policy link
- Reset progress (peligro)

---

### `src/services/firebase.js`
**Purpose:** Firebase auth + Firestore
**Key Methods:**
```javascript
saveUserStreak(userId, streakData)    // Guardar racha en cloud
getUserData(userId)                    // Obtener datos del usuario
createUserDocument(userId, email)      // Crear documento nuevo
logEvent(eventName, data)              // Log a Analytics
```

**Firestore Collections:**
```
users/{userId}
  - email
  - currentStreak
  - bestStreak
  - streakHistory
  - isPro
  - createdAt
```

---

### `src/services/revenuecat.js`
**Purpose:** Subscriptions + Entitlements
**Key Methods:**
```javascript
setupRevenueCat()                      // Init RevenueCat SDK
getAvailablePackages()                 // Traer offerings
isPro()                                // Check if user has 'pro' entitlement
purchasePackage(package_)              // Hacer compra
startFreeTrial(package_)               // Iniciar trial 3 días
getCustomerInfo()                      // Get user subscription info
restorePurchases()                     // Restore (iOS)
hasEntitlement(entitlementId)          // Check specific entitlement
```

**Entitlements:**
- `pro` → Acceso a stats, personalización, historial

**Packages:**
- `monthly_pro` → $8.99/mes
- `yearly_pro` → $49.99/año

---

### `src/services/notifications.js`
**Purpose:** Push notifications
**Key Methods:**
```javascript
requestPermissions()                   // Ask user for permission
scheduleDailyReminder(hour, minute)    // Schedule (repeating daily)
cancelAllNotifications()               // Cancel all
showImmediateNotification()            // Test notification
listenToNotifications(callback)        // Listen for taps
```

**Default:** 6:00 AM cada día

---

### `src/navigation/index.js`
**Purpose:** React Navigation setup
**Structure:**
```
RootNavigator
  ├── Stack (si !authenticated)
  │   └── OnboardingScreen
  └── Stack (si authenticated)
      └── TabNavigator
          ├── HomeStack
          │   ├── HomeScreen
          │   └── StatsScreen (modal)
          └── SettingsTab
              └── SettingsScreen
```

---

## 🔄 Data Flow

### Signing In (First Time)
```
OnboardingScreen
  → setUser(userId, true)          // Zustand
  → createUserDocument()           // Firebase
  → scheduleDailyReminder()        // Notifications
  → navigate('MainApp')            // RootNavigator re-renders
  → HomeScreen
```

### Completing Morning
```
HomeScreen
  → markTaskComplete(taskId)       // Zustand (UI updates)
  → isRoutineComplete() → true
  → completeDay()                  // Incrementar racha
  → saveUserStreak()               // Firebase (persist)
  → showCelebration()              // Animation
```

### Viewing Stats (Free)
```
HomeScreen
  → "View Stats 📊" button
  → StatsScreen
  → isPro? false
  → PaywallScreen
  → "Start 3-day free trial"
  → revenueCatServices.startFreeTrial()
  → isPro = true (Zustand)
  → StatsScreen re-renders con datos
```

---

## 🎨 Design System

### Colors
```
Primary:     #000000 (black)
Background:  #ffffff (white)
Surface:     #f0f0f0, #f5f5f5
Text:        #333333, #666666, #999999
Success:     #00ff00 (green) for completed
Error:       #ff4444 (red) for missed
Accent:      Emojis (🔥🎉✅)
```

### Typography
```
Display:  48px bold       (streaks)
Title:    28px bold       (screen titles)
Heading:  16px bold       (section headings)
Body:     14-16px regular (content)
Caption:  12px regular    (helper text)
```

### Components
```
Button:       44pt height (touch target)
Input:        44pt height, 16px font
Card/Surface: 12px radius
Spacing:      8px, 12px, 16px, 20px base
```

---

## 🚀 How to Extend

### Add New Screen
1. Create `src/screens/MyNewScreen.js`
2. Add to navigation in `src/navigation/index.js`
3. Style with StyleSheet
4. Access store with `useMorningWinStore()`

### Add New Service
1. Create `src/services/myservice.js`
2. Export methods object
3. Import in screens/app
4. Use: `myService.doSomething()`

### Add New Store State
1. Edit `src/store/index.js`
2. Add to initial state
3. Add setter/action
4. Use in component: `useMorningWinStore(state => state.myField)`

### Add Pro Feature
1. Determine what needs entitlement check
2. In component: `if (!isPro) return <Paywall />`
3. Set entitlement ID (e.g., `pro`)
4. Test in RevenueCat

---

## 📱 Device Compatibility

### iOS
- Minimum: iOS 13.0
- Target: iOS 15+
- Tested: iPhone 12-15

### Android
- Minimum: API 24 (Android 7.0)
- Target: API 34 (Android 14)
- Tested: Pixel 6-8

### Web
- Limited (no subscriptions)
- Works for testing

---

## 🔐 Security & Privacy

### Data Handling
- Email en Firebase Auth (no passwords stored)
- Streak data en Firestore (encrypted at rest)
- No personal health data
- No tracking/analytics by default

### Permissions
- Notifications (requested on first launch)
- Calendar (optional, future)
- Health data (optional, future)

### Compliant With
- GDPR (no tracking, data deletion available)
- COPPA (app for adults, no child data)
- Apple App Store guidelines
- Google Play guidelines

---

## 📊 Metrics & Logging

### Events Logged
```
onboarding_complete    → First time user
morning_completed      → Daily completion
paywall_shown          → Monetization funnel
trial_started          → Conversion event
subscription_renewed   → Retention metric
```

### Dashboard
```
Firebase Analytics
  → Real-time user count
  → Event tracking
  → Crashes/Errors

RevenueCat Dashboard
  → MRR, conversion rate
  → Subscriber count
  → Retention curves
```

---

## ✅ Testing Checklist

- [ ] App launches without errors
- [ ] Onboarding completes successfully
- [ ] Tasks can be marked/unmarked
- [ ] Daily reset works (midnight)
- [ ] Streak increments correctly
- [ ] Notifications arrive at set time
- [ ] Paywall shows for free users
- [ ] Trial activates correctly
- [ ] Pro features visible after trial
- [ ] Offline mode works (local state)
- [ ] Data persists after force close
- [ ] No console errors/warnings

---

## 📞 Support

### Questions?
- Check README.md (quick start)
- Check docs/FIREBASE_SETUP.md (backend)
- Check docs/DEPLOYMENT.md (launch)
- Check docs/ROADMAP.md (future features)

### Issues?
- Check console logs
- Check Firebase console (errors)
- Check RevenueCat logs (subscriptions)
- Check device app logs (iOS Console/Android Logcat)

---

**Built with ❤️ for morning warriors.**

Keep shipping. Keep winning. 🔥
