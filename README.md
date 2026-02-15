# MorningWin 🔥

Dead-simple morning routine streak app. Ship in days, not months.

## MVP Scope

- **Rutina default:** 5 tareas hardcoded
- **Checkmarks:** Solo tap para completar (sin timers)
- **Streak counter:** Visual, dopamina hit
- **Push notifications:** Recordatorio diario
- **Paywall:** Stats, personalización, historial
- **Suscripción:** $8.99/mes | $49.99/año

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Firebase (Auth + Firestore)
- **Subscriptions:** RevenueCat + Superwall
- **Push:** Expo Notifications (FCM/APNS)
- **State:** Zustand

## Quick Start

### Prerrequisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Firebase account
- RevenueCat account
- Xcode (para iOS) / Android Studio (para Android)

### 1. Setup del Proyecto

```bash
# Clone/Extract
cd morningwin

# Install dependencies
npm install
# or
yarn install

# Install Expo CLI
npm install -g expo-cli
```

### 2. Firebase Setup

1. Crea proyecto en [Firebase Console](https://console.firebase.google.com)
2. Configura Authentication (Google + Apple)
3. Crea Firestore database
4. Copia tu config en `src/services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### 3. RevenueCat Setup

1. Crea app en [RevenueCat Dashboard](https://app.revenuecat.com)
2. Conecta con App Store Connect e Google Play Console
3. Crea entitlements: `pro`
4. Crea packages:
   - **Monthly:** $8.99/month (o your local equivalent)
   - **Yearly:** $49.99/year

5. Copia API keys en `src/services/revenuecat.js`:

```javascript
const REVENUECAT_API_KEY_IOS = 'appl_xxxxx';
const REVENUECAT_API_KEY_ANDROID = 'goog_xxxxx';
```

### 4. Run en Desarrollo

```bash
# Start Expo
npm start

# o en emulador directo
npm run android  # Android emulator
npm run ios      # iOS simulator
npm run web      # Web (limited)
```

## Deploy

### iOS

```bash
# Build
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

Requiere:
- Apple Developer Account ($99/año)
- Google Play Developer Account ($25 one-time)

## File Structure

```
morningwin/
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.js       # Onboarding flow (3 pasos)
│   │   ├── HomeScreen.js              # Checklist + streak
│   │   ├── StatsScreen.js             # Stats + paywall
│   │   └── SettingsScreen.js          # Settings
│   ├── navigation/
│   │   └── index.js                   # React Navigation setup
│   ├── store/
│   │   └── index.js                   # Zustand store (estado global)
│   ├── services/
│   │   ├── firebase.js                # Firebase config + methods
│   │   ├── revenuecat.js              # RevenueCat subscriptions
│   │   └── notifications.js           # Expo Notifications
│   └── components/                    # (expandir después)
├── App.js                              # Entry point
├── app.json                            # Expo config
├── package.json
└── README.md
```

## Key Features Implemented

✅ **Onboarding Flow**
- Name input
- Reminder time selection
- Task preview
- Direct to home after first completion

✅ **Home Screen**
- 5 default tasks
- Checkmark system
- Streak counter (hero metric)
- Complete button
- Day reset logic

✅ **Stats Screen**
- Current streak (HERO)
- Monthly completion %
- Best streak ever
- Calendar grid (verde/rojo)
- Paywall gate

✅ **Notifications**
- Daily reminder before 9am
- Settable time
- Toggle on/off

✅ **Paywall**
- 3-day free trial
- Monthly + yearly options
- RevenueCat integration
- Entitlements management

✅ **Persistence**
- Zustand store
- AsyncStorage (local)
- Firebase Firestore (cloud)

## Entitlements (Pro Features)

### FREE
- 5-task default routine
- Checklist completion
- Current streak (number only)
- Daily reminders
- App access

### PRO ($8.99/month)
- Stats complete (monthly %, best streak, calendar)
- Streak recovery (1/month)
- Edit/customize tasks
- Create custom routines
- Historial visualización
- Visual themes

## Analytics Events

```javascript
// Logged automatically:
- onboarding_complete
- morning_completed (con streak count)
- first_paywall_shown
- first_conversion
- free_trial_started
```

## Testing Checklist

### Funcionalidad Core
- [ ] Onboarding completo
- [ ] Tareas se marcan/desmarcan
- [ ] Rutina se resetea diariamente
- [ ] Racha incrementa correctamente
- [ ] Notificación diaria llega
- [ ] Calendario muestra historial

### Paywall & Subscriptions
- [ ] Paywall aparece en Stats (free users)
- [ ] Trial gratuito se activa
- [ ] Acceso Pro desbloqueado después de trial
- [ ] Stats visibles solo para Pro
- [ ] Edición de tareas detrás de paywall

### Persistencia
- [ ] Datos se guardan localmente
- [ ] Datos se sincronizan con Firebase (si autenticado)
- [ ] App state persiste después de cerrar

## Troubleshooting

### "Cannot find module 'firebase'"
```bash
npm install firebase
```

### Notificaciones no llegan
- Asegurate que los permisos estén dados
- En Android, verifica FCM setup
- En iOS, verifica APNS certificates en Firebase

### RevenueCat no valida compras
- Sandbox mode en testing
- Verificar bundle IDs en app.json
- Check RevenueCat logs en dashboard

## Next Phase (Post-MVP)

🎯 Prioridades para v0.2:
1. Streak recovery logic (Cloud Function)
2. Custom routine creation
3. Dark mode + themes
4. Weekly/monthly email digests
5. Share streak on social
6. Deep linking para TikTok

## Support & Resources

- **Expo Docs:** https://docs.expo.dev
- **Firebase Docs:** https://firebase.google.com/docs
- **RevenueCat Docs:** https://docs.revenuecat.com
- **React Navigation:** https://reactnavigation.org

---

**Build fast. Launch sooner. Iterate with users.** 🚀
