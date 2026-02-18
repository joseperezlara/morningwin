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
    dailyLogRef: string;
    userRef: string;
    score: ScoreResult;
    streakAfter: number;
    bestStreakAfter: number;
    levelAfter: Level;
    zoneAfter: string;
    coach: {
        available: boolean;
        state: string;
        coachId?: string;
    };
}
export declare const completeDay: functions.https.HttpsFunction;
