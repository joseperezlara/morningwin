import { StreakResult, TimeZone } from '../types';
export interface UpdateStreakInput {
    dateId: string;
    timezone: TimeZone;
    userCurrentStreak: number;
    yesterdayCompleted: boolean;
    missedDaysCount: number;
}
export declare function updateStreak(input: UpdateStreakInput): StreakResult;
