export type TimeZone = 
  | "America/Mexico_City"
  | "America/Monterrey"
  | "UTC"

export type Level = 
  | "Iniciado"
  | "Constante"
  | "Disciplinado"
  | "Enfocado"
  | "Imparable"

export type Zone = "green" | "yellow" | "red"

export type CoachState = 
  | "new"
  | "momentum"
  | "unstable"
  | "risk"
  | "stagnant"

export type ProStatus = 
  | "active"
  | "trial"
  | "past_due"
  | "canceled"
  | "expired"

export type Plan = "monthly" | "yearly"

export interface Task {
  taskId: string
  title: string
  group?: string
  order: number
  done: boolean
}

export interface ScoreResult {
  baseScore: number
  timeBonus: number
  streakBonus: number
  finalScore: number
}

export interface StreakResult {
  streakAfter: number
  zoneAfter: Zone
}

export interface CoachContext {
  name: string
  level: Level
  currentStreak: number
  bestStreak: number
  monthId: string
  monthCompletionRate: number
  score7d: number
  score30d: number
  avgCompleteTime: string
  patterns: {
    weakDays: string[]
    weakTasks: string[]
    trend: "up" | "flat" | "down"
  }
  state: CoachState
  intent: string
}

export interface CoachMessage {
  diagnosis: string
  focus: string
  projection: string
}

export interface DailyLog {
  dateId: string
  dateLocal: string
  timezone: TimeZone
  status: "completed" | "incomplete"
  zone: Zone
  tasksTotal: number
  tasksCompleted: number
  tasksSnapshot: Task[]
  completedAt: string
  completedAtLocal: string
  score: ScoreResult
  streakAfter: number
  levelAfter: Level
  coach: {
    available: boolean
    state: CoachState
    coachId?: string
  }
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  timezone: TimeZone
  level: Level
  totalScore: number
  currentStreak: number
  bestStreak: number
  monthly: {
    monthId: string
    completedDays: number
    totalDays: number
    completionRate: number
  }
  pro: ProStatus
  createdAt: string
  lastActiveAt: string
}