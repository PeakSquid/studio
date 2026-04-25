/**
 * IRON RANK COMPLETE SOURCE BUNDLE
 * -----------------------------------------------------------------------------
 * This file contains the core types, constants, utilities, state management, 
 * and AI logic for the IronRank application. 
 * 
 * Target Model: gemini-2.5-flash (Resilient Downlink)
 * -----------------------------------------------------------------------------
 */

import { z } from 'genkit';

// --- 1. TYPES (src/types/iron.ts) ---

export type LiftData = {
  pr: number;
  reps: number;
  history?: { date: string; weight: number }[];
};

export type WorkoutPlan = {
  totalWeeks: number;
  blocks: { name: string; desc: string }[];
  schedule: Record<string, string>;
  workouts: {
    name: string;
    type: string;
    focus: string;
    duration: number;
    xp: number;
    exercises: { name: string; sets: number; reps: string; weight?: number }[];
  }[];
  goals: { lift: string; start: number; target: number }[];
};

export type WorkoutLogEntry = {
  id: string;
  date: string;
  name: string;
  volume: number;
  sets: number;
  type: string;
};

export type IronState = {
  id: string;
  lifts: Record<string, LiftData>;
  streak: number;
  lastWorkout: string | null;
  activity: number[];
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  workoutsCompleted: number;
  workoutLogs: WorkoutLogEntry[];
  plan: WorkoutPlan | null;
  unlockedAchievements: Record<string, string>;
  settings: {
    unit: 'lb' | 'kg';
    name: string;
    bodyweight: number;
    weightHistory?: { date: string; weight: number }[];
    theme: 'iron' | 'stealth';
  };
  muscleRecovery: Record<string, string>;
  totalVolume: number;
  volumeHistory: { date: string; volume: number }[];
  onboardingComplete: boolean;
  weekStart: string | null;
  xp: number;
  level: number;
};

// --- 2. CONSTANTS (src/lib/constants.ts) ---

export const THRESHOLDS = {
  'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
  'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
  'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
  'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
  'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
  'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
} as const;

export const MUSCLES = {
  Chest:     ['Bench Press'],
  Legs:      ['Squat'],
  Back:      ['Deadlift','Barbell Row'],
  Shoulders: ['Overhead Press'],
  Arms:      ['Pull-Up'],
} as const;

// --- 3. BIOMETRIC UTILITIES (src/lib/iron-utils.ts) ---

export function getLiftRank(lift: string, weight: number): string {
  if (!lift || typeof weight !== 'number') return 'Bronze';
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  for (const t of tiers) {
    if (weight >= t.min) rank = t.r;
  }
  return rank;
}

export function getOverallRank(lifts: Record<string, LiftData>): string {
  if (!lifts || typeof lifts !== 'object') return 'Bronze';
  const allRanks = Object.entries(lifts).map(([name, data]) => {
    const weight = typeof data === 'number' ? data : data?.pr || 0;
    return getLiftRank(name, weight);
  });
  const counts: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Elite: 0 };
  allRanks.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  if (counts.Elite >= 4) return 'Elite';
  if (counts.Gold >= 4) return 'Gold';
  if (counts.Silver >= 3) return 'Silver';
  return 'Bronze';
}

export function getCNSFatigue(streak: number, activity: number[]) {
  const safeActivity = Array.isArray(activity) ? activity : [];
  const recentWorkouts = safeActivity.slice(-7).filter(a => a === 2).length;
  let load = (recentWorkouts * 15) + ((streak || 0) * 5);
  return Math.min(load, 100);
}

// --- 4. AI FLOW INTERFACES (Simulated for Bundle) ---

export const AICoachChatInputSchema = z.object({
  query: z.string().catch(''),
  lifts: z.record(z.any()).nullish().default({}),
  overallRank: z.string().optional().default('Bronze'),
  streak: z.number().optional().default(0),
  workoutsCompleted: z.number().optional().default(0),
  bodyweight: z.number().optional().default(180),
  userName: z.string().optional().default('Athlete'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

/**
 * AI INSTRUCTIONS:
 * All flows should use model: 'googleai/gemini-2.5-flash'
 * Persona: "Grit & Iron" - Elite, scientific, concise.
 * Address the user as Athlete or their specific userName.
 */
