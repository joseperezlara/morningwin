/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
/**
 * FIRESTORE SCHEMA v1
 * 
 * users/{uid}
 *   - uid: string
 *   - name: string
 *   - email: string
 *   - timezone: string (IANA timezone, e.g., "America/Mexico_City")
 *   - level: string (Iniciado | Constante | Disciplinado | Enfocado | Imparable)
 *   - totalScore: number (sum of all finalScores, never decreases)
 *   - currentStreak: number (days completed consecutively)
 *   - bestStreak: number (highest streak ever)
 *   - monthly: { monthId, completedDays, totalDays, completionRate }
 *   - createdAt: ISO string
 *   - updatedAt: ISO string
 *   - lastActiveAt: ISO string
 *   - pro: { status, plan, stripeCustomerId, currentPeriodEnd, ... } (Sprint 4)
 * 
 * users/{uid}/tasks/{taskId}
 *   - title: string
 *   - group: string (optional)
 *   - order: number
 *   - done: boolean
 *   - active: boolean
 * 
 * users/{uid}/daily_logs/{dateId} (YYYY-MM-DD)
 *   - dateId: string
 *   - dateLocal: string
 *   - timezone: string
 *   - status: "completed" | "incomplete"
 *   - zone: "green" | "yellow" | "red"
 *   - tasksTotal: number
 *   - tasksCompleted: number
 *   - tasksSnapshot: Task[]
 *   - completedAt: ISO string
 *   - completedAtLocal: HH:MM string
 *   - score: { baseScore, timeBonus, streakBonus, finalScore }
 *   - streakAfter: number
 *   - levelAfter: string
 *   - coach: { available, state, coachId }
 *   - createdAt: ISO string
 *   - updatedAt: ISO string
 * 
 * Immutable collections (backend-only writes):
 *   - daily_logs
 *   - coach_messages
 *   - badges
 *   - challenges
 *   - billing/*
 *   - referrals
 */
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });
export { completeDay } from "./functions/completeDay";
export { completeDaySupabase } from './functions/supabaseHandler'

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
