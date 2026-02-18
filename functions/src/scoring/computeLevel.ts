import { Level } from '../types'

export interface ComputeLevelInput {
  totalScore: number
}

export function computeLevel(input: ComputeLevelInput): Level {
  const { totalScore } = input

  if (totalScore >= 700) return 'Imparable'
  if (totalScore >= 350) return 'Enfocado'
  if (totalScore >= 150) return 'Disciplinado'
  if (totalScore >= 50) return 'Constante'
  return 'Iniciado'
}