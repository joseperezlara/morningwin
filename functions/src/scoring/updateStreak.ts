import { StreakResult, Zone, TimeZone } from '../types'

export interface UpdateStreakInput {
  dateId: string
  timezone: TimeZone
  userCurrentStreak: number
  yesterdayCompleted: boolean
  missedDaysCount: number
}

export function updateStreak(input: UpdateStreakInput): StreakResult {
  const { userCurrentStreak, yesterdayCompleted, missedDaysCount } = input

  let streakAfter = userCurrentStreak

  if (yesterdayCompleted) {
    streakAfter = userCurrentStreak + 1
  } else if (missedDaysCount === 1) {
    streakAfter = userCurrentStreak // Freeze on 1 miss
  } else if (missedDaysCount >= 2) {
    streakAfter = 1 // Restart
  }

  // Zone determination
  let zoneAfter: Zone = 'green'
  if (missedDaysCount === 1) zoneAfter = 'yellow'
  else if (missedDaysCount >= 2) zoneAfter = 'red'

  return {
    streakAfter: Math.max(1, streakAfter),
    zoneAfter
  }
}