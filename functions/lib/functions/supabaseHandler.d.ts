import * as functions from 'firebase-functions';
import { Task, ScoreResult, Level } from '../types';
export interface CompleteDayInput {
    dateId: string;
    timezone: string;
    completedAt: string;
    tasksTotal: number;
    tasksCompleted: number;
    tasksSnapshot: Task[];
}
export interface CompleteDayResponse {
    ok: boolean;
    dailyLogId: string;
    userId: string;
    score: ScoreResult;
    streakAfter: number;
    bestStreakAfter: number;
    levelAfter: Level;
    zoneAfter: string;
}
export declare const completeDaySupabase: functions.https.HttpsFunction;
