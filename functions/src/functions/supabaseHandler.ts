import * as functions from 'firebase-functions'
import { createClient } from '@supabase/supabase-js'
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

const SUPABASE_URL = 'https://hzmeifzruvsbjuozfetm.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWVpZnpydXZzYmp1b3pmZXRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgxMjA2MSwiZXhwIjoyMDg3Mzg4MDYxfQ.eAnwhdr0siq90uuyUK6P6PKJlPjUOhYbyNvjRNy2pBo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
  dailyLogId: string
  userId: string
  score: ScoreResult
  streakAfter: number
  bestStreakAfter: number
  levelAfter: Level
  zoneAfter: string
}

export const completeDaySupabase = functions.https.onRequest(async (req, res): Promise<void> => {
  // Enable CORS
  const origin = req.headers.origin || ''
  const allowedOrigins = [
    'https://www.morningwin.app',
    'https://morningwin.app',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:19000',
    'http://localhost:19001'
  ]
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  try {
    const uid = (req.headers['x-user-id'] as string) || 'test-user-123'
    const data = req.body as CompleteDayInput
    const { dateId, timezone, completedAt, tasksTotal, tasksCompleted, tasksSnapshot } = data

    if (!dateId || !/^\d{4}-\d{2}-\d{2}$/.test(dateId)) {
      res.status(400).json({ error: 'Invalid dateId format' })
      return
    }

    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single()

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ uid, email: `${uid}@morningwin.local` }])
        .select()
        .single()

      if (createError) throw createError
      user = newUser
    } else if (userError) {
      throw userError
    }

    // Check if day already completed
    let { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_id', dateId)
      .single()

    if (dailyLog && dailyLog.status === 'completed') {
      res.status(200).json({
        ok: true,
        dailyLogId: dailyLog.id,
        userId: user.id,
        score: dailyLog.score,
        streakAfter: dailyLog.streak_after,
        bestStreakAfter: user.best_streak,
        levelAfter: dailyLog.level_after,
        zoneAfter: dailyLog.zone
      })
      return
    }

    // Calculate score
    const completedAtLocal = new Date(completedAt)
      .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    const scoreResult = calcScore({
      tasksCompleted,
      tasksTotal,
      completedAtLocal,
      currentStreakBefore: user.current_streak || 0
    })

    // Check yesterday
    const yesterday = new Date(dateId)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayId = yesterday.toISOString().split('T')[0]

    const { data: yesterdayLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_id', yesterdayId)
      .single()

    const yesterdayCompleted = yesterdayLog?.status === 'completed'

    let missedDaysCount = 0
    if (!yesterdayCompleted) missedDaysCount++

    const twoDaysAgo = new Date(dateId)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const twoDaysAgoId = twoDaysAgo.toISOString().split('T')[0]

    const { data: twoDaysAgoLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_id', twoDaysAgoId)
      .single()

    if (!twoDaysAgoLog || twoDaysAgoLog.status !== 'completed') {
      missedDaysCount++
    }

    // Calculate streak
    const streakResult = updateStreak({
      dateId,
      timezone: timezone as any,
      userCurrentStreak: user.current_streak || 0,
      yesterdayCompleted,
      missedDaysCount
    })

    // Update total score and level
    const newTotalScore = (user.total_score || 0) + scoreResult.finalScore
    const levelAfter = computeLevel({ totalScore: newTotalScore })
    const newBestStreak = Math.max(user.best_streak || 0, streakResult.streakAfter)

    // Update completed days
    const completedDays = user.completed_days || []
    if (!completedDays.includes(dateId)) {
      completedDays.push(dateId)
    }

    // Create daily log
    const { data: newLog, error: logError } = await supabase
      .from('daily_logs')
      .insert([
        {
          user_id: user.id,
          date_id: dateId,
          status: 'completed',
          tasks_total: tasksTotal,
          tasks_completed: tasksCompleted,
          tasks_snapshot: tasksSnapshot,
          completed_at: completedAt,
          completed_at_local: completedAtLocal,
          score: scoreResult,
          streak_after: streakResult.streakAfter,
          level_after: levelAfter,
          zone: streakResult.zoneAfter,
          coach: {
            available: false,
            state: 'new'
          }
        }
      ])
      .select()
      .single()

    if (logError) throw logError

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_streak: streakResult.streakAfter,
        best_streak: newBestStreak,
        total_score: newTotalScore,
        completed_days: completedDays,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    res.status(200).json({
      ok: true,
      dailyLogId: newLog.id,
      userId: user.id,
      score: scoreResult,
      streakAfter: streakResult.streakAfter,
      bestStreakAfter: newBestStreak,
      levelAfter,
      zoneAfter: streakResult.zoneAfter
    })

  } catch (error: any) {
    console.error('completeDaySupabase error:', error)
    res.status(500).json({ error: error.message })
  }
})