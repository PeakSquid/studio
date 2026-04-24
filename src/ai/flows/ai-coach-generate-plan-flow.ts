'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a personalized 12-week training plan.
 *
 * - aiCoachGeneratePlan - A function that generates an AI-powered 12-week training plan.
 * - AICoachGeneratePlanInput - The input type for the aiCoachGeneratePlan function.
 * - AICoachGeneratePlanOutput - The return type for the aiCoachGeneratePlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Helper functions and constants (replicated from client for self-contained logic) ---
const THRESHOLDS = {
  'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
  'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
  'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
  'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
  'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
  'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
};

function getRank(lift: string, pr: number): string {
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  for (const t of tiers) { if (pr >= t.min) rank = t.r; }
  return rank;
}

function overallRank(lifts: Record<string, { pr: number; reps: number }>): string {
  const all = Object.entries(lifts).map(([l,d]) => getRank(l,d.pr));
  const c = {Bronze:0,Silver:0,Gold:0,Elite:0};
  all.forEach(r => (c as any)[r]++); // Type assertion as c.Bronze etc. are numbers
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}
// --- End Helper functions ---

// Input Schema for the flow
const AICoachGeneratePlanInputSchema = z.object({
  userName: z.string().describe('The name of the user, for personalization.'),
  lifts: z.record(z.string(), z.object({
    pr: z.number().describe('Personal record weight for the lift in lbs.'),
    reps: z.number().describe('Reps achieved at the personal record weight.'),
  })).describe('An object containing current personal records for various lifts.'),
  streak: z.number().describe('Current workout streak in days.'),
  workoutsCompleted: z.number().describe('Total number of workouts completed.'),
  bodyweight: z.number().describe('User\u0027s bodyweight in lbs.'),
});
export type AICoachGeneratePlanInput = z.infer<typeof AICoachGeneratePlanInputSchema>;

// Output Schemas to match the expected JSON structure
const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.number().describe('Number of sets.'),
  reps: z.string().describe('Number of reps, can be a range or single number.'),
  weight: z.number().optional().describe('Suggested weight for the exercise in lbs.'),
});

const WorkoutSchema = z.object({
  name: z.string().describe('Name of the workout (e.g., Push Power).'),
  type: z.string().describe('Type of workout (e.g., push, pull, legs).'),
  focus: z.string().describe('Muscles or areas the workout focuses on.'),
  duration: z.number().describe('Estimated duration of the workout in minutes.'),
  xp: z.number().describe('Experience points awarded for completing the workout.'),
  exercises: z.array(ExerciseSchema).describe('List of exercises in the workout.'),
});

const GoalSchema = z.object({
  lift: z.string().describe('Name of the lift for the goal.'),
  start: z.number().describe('Starting PR for this lift.'),
  target: z.number().describe('Target PR for this lift at the end of the plan.'),
});

const PlanSchema = z.object({
  totalWeeks: z.number().describe('Total number of weeks in the training plan.'),
  blocks: z.array(z.object({
    name: z.string().describe('Name of the training block (e.g., Block 1 — Strength Foundation).'),
    desc: z.string().describe('Description of the training block including weeks and focus.'),
  })).describe('Array of training blocks.'),
  schedule: z.record(z.string(), z.string()).describe('Weekly workout schedule mapping day of week (0-6, Sunday-Saturday) to workout type (e.g., rest, push, pull, legs).'),
  workouts: z.array(WorkoutSchema).describe('Detailed definitions of each workout type.'),
  goals: z.array(GoalSchema).describe('Specific lift goals with starting and target PRs.'),
});

const AICoachGeneratePlanOutputSchema = z.object({
  plan: PlanSchema.describe('The generated 12-week training plan.'),
});
export type AICoachGeneratePlanOutput = z.infer<typeof AICoachGeneratePlanOutputSchema>;

// The prompt definition, which includes the fixed JSON structure for the plan
const generatePlanPrompt = ai.definePrompt({
  name: 'generatePlanPrompt',
  input: { schema: AICoachGeneratePlanInputSchema }, // Input data to populate the system and prompt templates
  output: { schema: AICoachGeneratePlanOutputSchema }, // Expected output format
  // The system prompt sets the persona and provides user context.
  system: `You are an expert AI weightlifting coach inside the IronRank app. You are motivating, knowledgeable, and concise.\nUser stats — Lifts & ranks: {{{liftsSummary}}} | Overall rank: {{{overallRankValue}}} | Streak: {{{streak}}} days | Workouts done: {{{workoutsCompleted}}}`,
  // The main prompt instructs the model to generate JSON and provides the exact structure to fill.
  // All dynamic values (like PRs) are directly injected via Handlebars from the input.
  prompt: `PLAN GENERATION: Generate a personalized 12-week training plan based on the user\u0027s stats provided in the system prompt. Respond ONLY with raw JSON (no markdown, no backticks, no explanation). Use exactly this structure, filling in appropriate weights based on user\u0027s PRs:\n{\n  "plan": {\n    "totalWeeks": 12,\n    "blocks": [\n      {"name": "Block 1 — Strength Foundation", "desc": "Weeks 1-4 · 5x5 compounds, linear progression"},\n      {"name": "Block 2 — Hypertrophy", "desc": "Weeks 5-8 · 4x8-12, volume increase"},\n      {"name": "Block 3 — Peaking", "desc": "Weeks 9-12 · Heavy singles, PR attempts"}\n    ],\n    "schedule": {\n      "0": "rest",\n      "1": "push",\n      "2": "pull",\n      "3": "legs",\n      "4": "rest",\n      "5": "push",\n      "6": "legs"\n    },\n    "workouts": [\n      {\n        "name": "Push Power",\n        "type": "push",\n        "focus": "Chest · Shoulders · Triceps",\n        "duration": 52,\n        "xp": 3,\n        "exercises": [\n          {"name": "Bench Press", "sets": 4, "reps": "5", "weight": {{{benchPressPR85}}} },\n          {"name": "Overhead Press", "sets": 3, "reps": "8", "weight": {{{overheadPressPR80}}} },\n          {"name": "Incline DB Press", "sets": 3, "reps": "10", "weight": 65},\n          {"name": "Lateral Raises", "sets": 3, "reps": "15", "weight": 20},\n          {"name": "Tricep Pushdown", "sets": 3, "reps": "12", "weight": 50}\n        ]\n      },\n      {\n        "name": "Pull Strength",\n        "type": "pull",\n        "focus": "Back · Biceps",\n        "duration": 48,\n        "xp": 3,\n        "exercises": [\n          {"name": "Barbell Row", "sets": 4, "reps": "5", "weight": {{{barbellRowPR85}}} },\n          {"name": "Pull-Up", "sets": 3, "reps": "6", "weight": 0},\n          {"name": "Cable Row", "sets": 3, "reps": "10", "weight": 120},\n          {"name": "Face Pulls", "sets": 3, "reps": "15", "weight": 40},\n          {"name": "Barbell Curl", "sets": 3, "reps": "10", "weight": 65}\n        ]\n      },\n      {\n        "name": "Leg Day",\n        "type": "legs",\n        "focus": "Quads · Hamstrings · Glutes",\n        "duration": 55,\n        "xp": 4,\n        "exercises": [\n          {"name": "Squat", "sets": 4, "reps": "5", "weight": {{{squatPR85}}} },\n          {"name": "Romanian Deadlift", "sets": 3, "reps": "8", "weight": {{{deadliftPR70}}} },\n          {"name": "Leg Press", "sets": 3, "reps": "12", "weight": 360},\n          {"name": "Leg Curl", "sets": 3, "reps": "12", "weight": 80},\n          {"name": "Calf Raise", "sets": 4, "reps": "15", "weight": 135}\n        ]\n      }\n    ],\n    "goals": [\n      {"lift": "Bench Press", "start": {{{benchPressPR}}}, "target": {{{benchPressPR50}}} },\n      {"lift": "Squat", "start": {{{squatPR}}}, "target": {{{squatPR60}}} },\n      {"lift": "Deadlift", "start": {{{deadliftPR}}}, "target": {{{deadliftPR90}}} }\n    ]\n  }\n}`
});

// The flow definition
const aiCoachGeneratePlanFlow = ai.defineFlow(
  {
    name: 'aiCoachGeneratePlanFlow',
    inputSchema: AICoachGeneratePlanInputSchema,
    outputSchema: AICoachGeneratePlanOutputSchema,
  },
  async (input) => {
    // Dynamically calculate values needed for the prompt templates
    const liftsSummary = Object.entries(input.lifts)
      .map(([l, d]) => `${l}: ${d.pr} lb (${getRank(l, d.pr)})`)
      .join(', ');
    const overallRankValue = overallRank(input.lifts);

    // Default PRs if not available, as seen in client code's buildSystemPrompt
    const benchPressPR = input.lifts['Bench Press']?.pr || 135;
    const squatPR = input.lifts['Squat']?.pr || 185;
    const deadliftPR = input.lifts['Deadlift']?.pr || 225;
    const overheadPressPR = input.lifts['Overhead Press']?.pr || 75;
    const barbellRowPR = input.lifts['Barbell Row']?.pr || 115;

    // Prepare data object to pass to the prompt, matching Handlebars variables
    const promptData = {
      ...input, // Includes userName, streak, workoutsCompleted, bodyweight
      liftsSummary,
      overallRankValue,
      benchPressPR,
      squatPR,
      deadliftPR,
      overheadPressPR,
      barbellRowPR,
      // Calculated weights for exercises
      benchPressPR85: Math.round(benchPressPR * 0.85),
      overheadPressPR80: Math.round(overheadPressPR * 0.8),
      barbellRowPR85: Math.round(barbellRowPR * 0.85),
      squatPR85: Math.round(squatPR * 0.85),
      deadliftPR70: Math.round(deadliftPR * 0.7),
      // Calculated target goals
      benchPressPR50: benchPressPR + 50,
      squatPR60: squatPR + 60,
      deadliftPR90: deadliftPR + 90,
    };

    const {output} = await generatePlanPrompt(promptData);
    return output!;
  }
);

// Exported wrapper function
export async function aiCoachGeneratePlan(input: AICoachGeneratePlanInput): Promise<AICoachGeneratePlanOutput> {
  return aiCoachGeneratePlanFlow(input);
}
