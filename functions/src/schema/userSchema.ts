export interface UserMonthly {
  monthId: string // YYYY-MM
  completedDays: number
  totalDays: number
  completionRate: number
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  timezone: string // IANA timezone
  
  // Aggregates (backend-only writes)
  level: string // Iniciado | Constante | Disciplinado | Enfocado | Imparable
  totalScore: number // sum of all finalScores (never decreases)
  currentStreak: number
  bestStreak: number
  
  // Monthly cache
  monthly: UserMonthly
  
  // Metadata
  createdAt: string // ISO
  updatedAt: string // ISO
  lastActiveAt: string // ISO
}

export function createEmptyUser(uid: string, email: string, name: string, timezone: string): UserProfile {
  return {
    uid,
    name,
    email,
    timezone,
    level: 'Iniciado',
    totalScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    monthly: {
      monthId: new Date().toISOString().substring(0, 7),
      completedDays: 0,
      totalDays: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
      completionRate: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  }
}