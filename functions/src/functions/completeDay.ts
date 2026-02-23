import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'
import { 
  Task, 
  ScoreResult, 
  StreakResult, 
  DailyLog, 
  Level 
} from '../types'
import { calcScore } from '../scoring/calcScore'
import { updateStreak } from '../scoring/updateStreak'
import { computeLevel } from '../scoring/computeLevel'

if (!admin.apps.length) {
  admin.initializeApp()
}

export interface CompleteDayInput {
  dateId: string
  timezone: string
  completedAt: string
  tasksTotal: number
  tasksCompleted: number
  tasksSnapshot: Task[]
}

export interface CompleteDayResponse {
  ok: boolean
  dailyLogRef: string
  userRef: string
  score: ScoreResult
  streakAfter: number
  bestStreakAfter: number
  levelAfter: Level
  zoneAfter: string
  coach: {
    available: boolean
    state: string
    coachId?: string
  }
}

export const completeDay = functions.https.onRequest(async (req, res) => {
  // Enable CORS for both production and development - Updated 2026-02-23
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://www.morningwin.app',
    'https://morningwin.app',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:19000',
    'http://localhost:19001'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
      // Desarrollo: obtén UID del header o usa default
      const uid = (req.headers['x-user-id'] as string) || 'test-user-123'

      const data = req.body as CompleteDayInput
      const db = admin.firestore()
     

// Conectar al emulator si está disponible
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('Connecting to Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST);
}

      const { dateId, timezone, completedAt, tasksTotal, tasksCompleted, tasksSnapshot } = data

      if (!dateId || !/^\d{4}-\d{2}-\d{2}$/.test(dateId)) {
        res.status(400).json({ error: 'Invalid dateId format' })
        return
      }

      if (tasksCompleted > tasksTotal) {
        res.status(400).json({ error: 'tasksCompleted cannot exceed tasksTotal' })
        return
      }

      if (!completedAt || isNaN(new Date(completedAt).getTime())) {
        res.status(400).json({ error: 'Invalid completedAt timestamp' })
        return
      }

      const result = await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(uid)
        const userSnap = await transaction.get(userRef)
        
        if (!userSnap.exists) {
          throw new Error('User not found')
        }

        const userData = userSnap.data() as any
        const dailyLogRef = userRef.collection('daily_logs').doc(dateId)
        const dailyLogSnap = await transaction.get(dailyLogRef)
        
        if (dailyLogSnap.exists && dailyLogSnap.data()?.status === 'completed') {
          const existing = dailyLogSnap.data() as DailyLog
          return {
            ok: true,
            dailyLogRef: dailyLogRef.path,
            userRef: userRef.path,
            score: existing.score,
            streakAfter: existing.streakAfter,
            bestStreakAfter: userData.bestStreak,
            levelAfter: existing.levelAfter,
            zoneAfter: existing.zone,
            coach: existing.coach
          }
        }

        const completedAtLocal = new Date(completedAt)
          .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

        const scoreResult = calcScore({
          tasksCompleted,
          tasksTotal,
          completedAtLocal,
          currentStreakBefore: userData.currentStreak || 0
        })

        const yesterday = new Date(dateId)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayId = yesterday.toISOString().split('T')[0]
        
        const yesterdaySnap = await transaction.get(
          dailyLogRef.parent.doc(yesterdayId)
        )
        const yesterdayCompleted = 
          yesterdaySnap.exists && yesterdaySnap.data()?.status === 'completed'

        let missedDaysCount = 0
        if (!yesterdayCompleted) missedDaysCount++
        
        const twoDaysAgo = new Date(dateId)
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
        const twoDaysAgoId = twoDaysAgo.toISOString().split('T')[0]
        
        const twoDaysAgoSnap = await transaction.get(
          dailyLogRef.parent.doc(twoDaysAgoId)
        )
        if (!twoDaysAgoSnap.exists || twoDaysAgoSnap.data()?.status !== 'completed') {
          missedDaysCount++
        }

        const streakResult = updateStreak({
          dateId,
          timezone: timezone as any,
          userCurrentStreak: userData.currentStreak || 0,
          yesterdayCompleted,
          missedDaysCount
        })

        const newTotalScore = (userData.totalScore || 0) + scoreResult.finalScore
        const levelAfter = computeLevel({ totalScore: newTotalScore })

        const dailyLog: DailyLog = {
          dateId,
          dateLocal: dateId,
          timezone: timezone as any,
          status: 'completed',
          zone: streakResult.zoneAfter,
          tasksTotal,
          tasksCompleted,
          tasksSnapshot,
          completedAt,
          completedAtLocal,
          score: scoreResult,
          streakAfter: streakResult.streakAfter,
          levelAfter,
          coach: {
            available: false,
            state: 'new',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        transaction.set(dailyLogRef, dailyLog)

        const newBestStreak = Math.max(
          userData.bestStreak || 0,
          streakResult.streakAfter
        )

        const monthId = dateId.substring(0, 7)
        const currentMonth = userData.monthly?.monthId === monthId 
          ? userData.monthly 
          : {
              monthId,
              completedDays: 0,
              totalDays: 31,
              completionRate: 0
            }

        currentMonth.completedDays += 1
        currentMonth.completionRate = currentMonth.completedDays / currentMonth.totalDays

        // Actualizar completedDays array

const userCompletedDays = (userData.completedDays || [])
if (!userCompletedDays.includes(dateId)) {
  userCompletedDays.push(dateId)
}

transaction.update(userRef, {
  totalScore: newTotalScore,
  currentStreak: streakResult.streakAfter,
  bestStreak: newBestStreak,
  level: levelAfter,
  monthly: currentMonth,
  lastActiveAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedDays: userCompletedDays
})

        return {
          ok: true,
          dailyLogRef: dailyLogRef.path,
          userRef: userRef.path,
          score: scoreResult,
          streakAfter: streakResult.streakAfter,
          bestStreakAfter: newBestStreak,
          levelAfter,
          zoneAfter: streakResult.zoneAfter,
          coach: {
            available: false,
            state: 'new'
          }
        }
      })

      res.status(200).json(result)

    } catch (error: any) {
      console.error('completeDay error:', error)
      res.status(500).json({ error: error.message })
    }
  })