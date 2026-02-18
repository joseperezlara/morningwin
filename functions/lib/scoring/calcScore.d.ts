import { ScoreResult } from '../types';
export interface CalcScoreInput {
    tasksCompleted: number;
    tasksTotal: number;
    completedAtLocal: string;
    currentStreakBefore: number;
}
export declare function calcScore(input: CalcScoreInput): ScoreResult;
