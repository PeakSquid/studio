'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a personalized 12-week training plan.
 * Upgraded to gemini-2.5-flash for maximum Neural Protocol stability.
 */

import {ai, googleAIPlugin} from '@/ai/genkit';
import {z} from 'genkit';

const AICoachGeneratePlanInputSchema = z.object({
  userName: z.string().default('Athlete'),
  lifts: z.record(z.any()).nullish().default({}),
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
  model: 'googleai/gemini-2.5-flash',
  input: { schema: InternalGeneratePlanPromptSchema },
  output: { schema: AICoachGeneratePlanOutputSchema },
  prompt: `You are an expert AI weightlifting coach. Generate a personalized 12-week training plan for {{{userName}}} based on their current stats.

Lifts: {{{liftsSummary}}}
Overall Rank: {{{overallRankValue}}}
Streak: {{{streak}}} days
Workouts Done: {{{workoutsCompleted}}}
Bodyweight: {{{bodyweight}}} lbs

The plan should consist of logical training blocks (e.g., Foundation, Hypertrophy, Peaking). 
Return the plan in the structured format requested. Persona: Grit & Iron.`,
});

const aiCoachGeneratePlanFlow = ai.defineFlow(
  {
    name: 'aiCoachGeneratePlanFlow',
    inputSchema: AICoachGeneratePlanInputSchema,
    outputSchema: AICoachGeneratePlanOutputSchema,
  },
  async (input) => {
    try {
      const { getOverallRank } = await import('@/lib/iron-utils');
      const safeLifts = input.lifts || {};
      const liftsSummary = Object.entries(safeLifts)
        .map(([l, d]: [string, any]) => {
          const pr = typeof d === 'number' ? d : d?.pr || 0;
          return `${l}: ${pr} lb`;
        })
        .join(', ') || 'No data recorded.';
      
      const overallRankValue = getOverallRank(safeLifts as any);

      const { output } = await generatePlanPrompt({
        ...input,
        lifts: safeLifts,
        liftsSummary,
        overallRankValue,
      });

      if (!output) {
        throw new Error('Neural Protocol failure: No output generated.');
      }

      return output;
    } catch (error: any) {
      console.error('AI Generate Plan Error:', error);
      throw new Error(`Strategic Downlink Failure: ${error.message}`);
    }
  }
);

export async function aiCoachGeneratePlan(input: AICoachGeneratePlanInput): Promise<AICoachGeneratePlanOutput> {
  return aiCoachGeneratePlanFlow(input);
}
