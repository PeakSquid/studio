
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a personalized 12-week training plan.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// --- Helper functions and constants ---
const THRESHOLDS = {
  'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
  'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
  'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
  'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
  'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
  'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
};

function getRank(lift: string, pr: number): string {
  const tiers = (THRESHOLDS as any)[lift] || [];
  let rank = 'Bronze';
  for (const t of tiers) { if (pr >= t.min) rank = t.r; }
  return rank;
}

function overallRank(lifts: Record<string, any>): string {
  if (!lifts || typeof lifts !== 'object') return 'Bronze';
  const all = Object.entries(lifts).map(([l,d]) => getRank(l, d?.pr || 0));
  const c = {Bronze:0,Silver:0,Gold:0,Elite:0};
  all.forEach(r => (c as any)[r]++);
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}

const AICoachGeneratePlanInputSchema = z.object({
  userName: z.string().default('Athlete'),
  lifts: z.record(z.any()).optional().default({}),
  streak: z.number().default(0),
  workoutsCompleted: z.number().default(0),
  bodyweight: z.number().default(180),
});
export type AICoachGeneratePlanInput = z.infer<typeof AICoachGeneratePlanInputSchema>;

const InternalGeneratePlanPromptSchema = AICoachGeneratePlanInputSchema.extend({
  liftsSummary: z.string().default('No data recorded.'),
  overallRankValue: z.string().default('Bronze'),
});

const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  weight: z.number(),
});

const WorkoutSchema = z.object({
  name: z.string(),
  type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest']),
  focus: z.string(),
  duration: z.number(),
  xp: z.number(),
  exercises: z.array(ExerciseSchema),
});

const GoalSchema = z.object({
  lift: z.string(),
  start: z.number(),
  target: z.number(),
});

const PlanSchema = z.object({
  totalWeeks: z.number(),
  blocks: z.array(z.object({
    name: z.string(),
    desc: z.string(),
  })),
  schedule: z.record(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest'])),
  workouts: z.array(WorkoutSchema),
  goals: z.array(GoalSchema),
});

const AICoachGeneratePlanOutputSchema = z.object({
  plan: PlanSchema,
});
export type AICoachGeneratePlanOutput = z.infer<typeof AICoachGeneratePlanOutputSchema>;

const generatePlanPrompt = ai.definePrompt({
  name: 'generatePlanPrompt',
  model: googleAI.model('gemini-1.5-flash'),
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
    try {
      const safeLifts = input.lifts || {};
      const liftsSummary = Object.entries(safeLifts)
        .map(([l, d]: [string, any]) => `${l}: ${d?.pr || 0} lb (${getRank(l, d?.pr || 0)})`)
        .join(', ') || 'No data recorded.';
      const overallRankValue = overallRank(safeLifts);

      const { output } = await generatePlanPrompt({
        ...input,
        lifts: safeLifts,
        liftsSummary,
        overallRankValue,
      });

      if (!output) {
        throw new Error('Intelligence extraction failure: Model output invalid.');
      }

      return output;
    } catch (error: any) {
      console.error('AI Generate Plan Error:', error);
      throw new Error(`Plan generation uplink failure: ${error.message}`);
    }
  }
);

export async function aiCoachGeneratePlan(input: AICoachGeneratePlanInput): Promise<AICoachGeneratePlanOutput> {
  return aiCoachGeneratePlanFlow(input);
}
