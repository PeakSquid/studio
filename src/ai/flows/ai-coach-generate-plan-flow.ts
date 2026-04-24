'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a personalized 12-week training plan.
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
  all.forEach(r => (c as any)[r]++);
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}

// Input Schema for the flow
const AICoachGeneratePlanInputSchema = z.object({
  userName: z.string().describe('The name of the user, for personalization.'),
  lifts: z.record(z.string(), z.object({
    pr: z.number().describe('Personal record weight for the lift in lbs.'),
    reps: z.number().describe('Reps achieved at the personal record weight.'),
  })).describe('An object containing current personal records for various lifts.'),
  streak: z.number().describe('Current workout streak in days.'),
  workoutsCompleted: z.number().describe('Total number of workouts completed.'),
  bodyweight: z.number().describe('User\'s bodyweight in lbs.'),
});
export type AICoachGeneratePlanInput = z.infer<typeof AICoachGeneratePlanInputSchema>;

// Internal schema including the derived fields for the prompt
const InternalGeneratePlanPromptSchema = AICoachGeneratePlanInputSchema.extend({
  liftsSummary: z.string(),
  overallRankValue: z.string(),
});

// Output Schemas to match the expected JSON structure
const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.number().describe('Number of sets.'),
  reps: z.string().describe('Number of reps, can be a range or single number.'),
  weight: z.number().describe('Suggested weight for the exercise in lbs.'),
});

const WorkoutSchema = z.object({
  name: z.string().describe('Name of the workout (e.g., Push Power).'),
  type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest']).describe('Type of workout.'),
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
  schedule: z.record(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest'])).describe('Weekly workout schedule mapping day of week (0-6) to workout type.'),
  workouts: z.array(WorkoutSchema).describe('Detailed definitions of each workout type.'),
  goals: z.array(GoalSchema).describe('Specific lift goals with starting and target PRs.'),
});

const AICoachGeneratePlanOutputSchema = z.object({
  plan: PlanSchema.describe('The generated 12-week training plan.'),
});
export type AICoachGeneratePlanOutput = z.infer<typeof AICoachGeneratePlanOutputSchema>;

const generatePlanPrompt = ai.definePrompt({
  name: 'generatePlanPrompt',
  input: { schema: InternalGeneratePlanPromptSchema },
  output: { schema: AICoachGeneratePlanOutputSchema },
  prompt: `You are an expert AI weightlifting coach. Generate a personalized 12-week training plan for {{{userName}}} based on their current stats.

Lifts: {{{liftsSummary}}}
Overall Rank: {{{overallRankValue}}}
Streak: {{{streak}}} days
Workouts Done: {{{workoutsCompleted}}}
Bodyweight: {{{bodyweight}}} lbs

The plan should consist of logical training blocks (e.g., Foundation, Hypertrophy, Peaking) and appropriate exercise weights (usually 70-85% of PR for heavy compounds).
The weekly schedule should balance push, pull, legs, and rest days appropriately.`,
});

const aiCoachGeneratePlanFlow = ai.defineFlow(
  {
    name: 'aiCoachGeneratePlanFlow',
    inputSchema: AICoachGeneratePlanInputSchema,
    outputSchema: AICoachGeneratePlanOutputSchema,
  },
  async (input) => {
    const liftsSummary = Object.entries(input.lifts)
      .map(([l, d]) => `${l}: ${d.pr} lb (${getRank(l, d.pr)})`)
      .join(', ');
    const overallRankValue = overallRank(input.lifts);

    const { output } = await generatePlanPrompt({
      ...input,
      liftsSummary,
      overallRankValue,
    });

    if (!output) {
      throw new Error('Failed to generate training plan.');
    }

    return output;
  }
);

export async function aiCoachGeneratePlan(input: AICoachGeneratePlanInput): Promise<AICoachGeneratePlanOutput> {
  return aiCoachGeneratePlanFlow(input);
}
