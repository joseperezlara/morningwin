import { ScoreResult } from '../types'

export interface CalcScoreInput {
  tasksCompleted: number
  tasksTotal: number
  completedAtLocal: string // HH:MM
  currentStreakBefore: number
}

export function calcScore(input: CalcScoreInput): ScoreResult {
  const { tasksCompleted, tasksTotal, completedAtLocal, currentStreakBefore } = input

  // Base score
  const baseScore = (tasksCompleted / tasksTotal) * 10

  // If base score too low, return 0 (optional threshold)
  if (baseScore < 6) {
    return {
      baseScore: 0,
      timeBonus: 0,
      streakBonus: 0,
      finalScore: 0
    }
  }

  // Time bonus
  const [hours, minutes] = completedAtLocal.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes

  let timeBonus = 0
  if (totalMinutes <= 7 * 60 + 30) timeBonus = 3      // <= 7:30
  else if (totalMinutes <= 8 * 60 + 15) timeBonus = 2 // <= 8:15
  else if (totalMinutes <= 9 * 60) timeBonus = 1      // <= 9:00
  else timeBonus = 0                                   // > 9:00

  // Streak bonus
  let streakBonus = 0
  if (currentStreakBefore >= 14) streakBonus = 3
  else if (currentStreakBefore >= 7) streakBonus = 2
  else if (currentStreakBefore >= 3) streakBonus = 1
  else streakBonus = 0

  const finalScore = Math.round(baseScore + timeBonus + streakBonus)

  return {
    baseScore: Math.round(baseScore),
    timeBonus,
    streakBonus,
    finalScore
  }
}