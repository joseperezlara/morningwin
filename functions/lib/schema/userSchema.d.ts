export interface UserMonthly {
    monthId: string;
    completedDays: number;
    totalDays: number;
    completionRate: number;
}
export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    timezone: string;
    level: string;
    totalScore: number;
    currentStreak: number;
    bestStreak: number;
    monthly: UserMonthly;
    createdAt: string;
    updatedAt: string;
    lastActiveAt: string;
}
export declare function createEmptyUser(uid: string, email: string, name: string, timezone: string): UserProfile;
