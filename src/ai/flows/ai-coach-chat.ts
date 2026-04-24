'use server';
/**
 * @fileOverview An AI coach agent that provides personalized advice and workout plans.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiftDataSchema = z.object({
  pr: z.number().default(0).describe('Personal record for the lift in pounds.'),
  reps: z.number().default(0).describe('Reps achieved at the personal record weight.'),
}).passthrough();

const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.number().describe('Number of sets for the exercise.'),
  reps: z.string().describe('Number of reps for the exercise, can be a range like "8-12".'),
  weight: z.number().describe('Suggested weight for the exercise in pounds.'),
});

const WorkoutSchema = z.object({
  name: z.string().describe('Name of the workout.'),
  type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest']).describe('Type of workout.'),
  focus: z.string().describe('Muscle groups or training focus.'),
  duration: z.number().describe('Estimated duration in minutes.'),
  xp: z.number().describe('Experience points earned.'),
  exercises: z.array(ExerciseSchema).describe('List of exercises.'),
});

const PlanBlockSchema = z.object({
  name: z.string().describe('Name of the training block.'),
  desc: z.string().describe('Description of the training block.'),
});

const PlanGoalSchema = z.object({
  lift: z.string().describe('Name of the lift.'),
  start: z.number().describe('Starting PR.'),
  target: z.number().describe('Target PR.'),
});

const WorkoutPlanSchema = z.object({
  totalWeeks: z.number().describe('Total number of weeks for the plan.'),
  blocks: z.array(PlanBlockSchema).describe('Breakdown of training blocks.'),
  schedule: z.record(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest'])).describe('Weekly schedule (0-6).'),
  workouts: z.array(WorkoutSchema).describe('Detailed definitions.'),
  goals: z.array(PlanGoalSchema).describe('Target records.'),
});

const AICoachChatInputSchema = z.object({
  query: z.string().describe('The user\'s message.'),
  lifts: z.record(z.string(), LiftDataSchema).default({}).describe('Current records.'),
  overallRank: z.string().describe('The user\'s rank.'),
  streak: z.number().describe('User\'s streak.'),
  workoutsCompleted: z.number().describe('Total workouts.'),
  bodyweight: z.number().describe('User bodyweight.'),
  userName: z.string().describe('User name.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
});
export type AICoachChatInput = z.infer<typeof AICoachChatInputSchema>;

const InternalAICoachPromptSchema = AICoachChatInputSchema.extend({
  liftsSummary: z.string(),
});

const AICoachChatOutputSchema = z.object({
  reply: z.string().describe('The coach reply.'),
  plan: WorkoutPlanSchema.optional().describe('Personalized plan if requested.'),
});
export type AICoachChatOutput = z.infer<typeof AICoachChatOutputSchema>;

const generateWorkoutPlanTool = ai.defineTool(
  {
    name: 'generateWorkoutPlan',
    description: 'Generates a 12-week plan. Call when user asks for a plan, program, or schedule.',
    inputSchema: z.object({
      lifts: z.record(z.string(), z.number()).optional().default({}),
    }),
    outputSchema: WorkoutPlanSchema,
  },
  async (input) => {
    const lifts = input.lifts || {};
    const bp = lifts['Bench Press'] || 135;
    const sq = lifts['Squat'] || 185;
    const dl = lifts['Deadlift'] || 225;
    
    return {
      totalWeeks: 12,
      blocks: [
        {name: "Phase 1 — Hypertrophic Base", desc: "Weeks 1-4 · Focus on volume (8-12 reps)."},
        {name: "Phase 2 — Strength Foundation", desc: "Weeks 5-8 · Focus on 3-5 rep strength."},
        {name: "Phase 3 — Peak Output", desc: "Weeks 9-12 · Intensification and PR testing."}
      ],
      schedule: { "0": "rest", "1": "push", "2": "pull", "3": "legs", "4": "rest", "5": "full", "6": "rest" },
      workouts: [
        {
          name: "Push Protocol", type: "push", focus: "Chest/Shoulders", duration: 50, xp: 3,
          exercises: [{name: "Bench Press", sets: 4, reps: "5", weight: Math.round(bp * 0.85)}]
        },
        {
          name: "Pull Protocol", type: "pull", focus: "Back/Biceps", duration: 45, xp: 3,
          exercises: [{name: "Barbell Row", sets: 4, reps: "5", weight: 135}]
        },
        {
          name: "Leg Protocol", type: "legs", focus: "Quads/Hams", duration: 55, xp: 4,
          exercises: [{name: "Squat", sets: 4, reps: "5", weight: Math.round(sq * 0.85)}]
        },
        {
          name: "Full Body Tactical", type: "full", focus: "Total Body", duration: 60, xp: 5,
          exercises: [{name: "Deadlift", sets: 3, reps: "3", weight: Math.round(dl * 0.9)}]
        }
      ],
      goals: [
        {lift: "Bench Press", start: bp, target: Math.round(bp * 1.1)},
        {lift: "Squat", start: sq, target: Math.round(sq * 1.15)},
        {lift: "Deadlift", start: dl, target: Math.round(dl * 1.2)}
      ]
    };
  }
);

const aiCoachPrompt = ai.definePrompt({
  name: 'aiCoachPrompt',
  input: {schema: InternalAICoachPromptSchema},
  output: {schema: AICoachChatOutputSchema},
  tools: [generateWorkoutPlanTool],
  prompt: `You are an elite AI weightlifting coach. Persona: "Grit & Iron". Authoritative, scientific, concise. Address the user as {{{userName}}}.

Athlete Data:
- Current Rank: {{{overallRank}}}
- Stats: {{{liftsSummary}}}
- History: {{{streak}}} day streak, {{{workoutsCompleted}}} total logs.
- Bodyweight: {{{bodyweight}}} lb.

Guidelines:
1. If a plan is requested, use generateWorkoutPlan tool.
2. If discussing rank, explain thresholds.
3. Be tactical—no fluff. Use terminology (PR, CNS, Hypertrophy, Volume).
4. Addressing weak points: Identify the lift with the lowest rank and suggest focus.
5. ALWAYS return your response in the requested JSON format containing 'reply' and optionally 'plan'.

User Message: {{{query}}}`,
});

const aiCoachChatFlow = ai.defineFlow(
  {
    name: 'aiCoachChatFlow',
    inputSchema: AICoachChatInputSchema,
    outputSchema: AICoachChatOutputSchema,
  },
  async (input) => {
    try {
      const lifts = input.lifts || {};
      const liftsSummary = Object.entries(lifts)
        .map(([l, d]) => `${l}: ${d?.pr || 0}lb`)
        .join(', ') || 'No data recorded.';

      const { output } = await aiCoachPrompt({
        ...input,
        lifts,
        liftsSummary,
      });

      if (!output) {
        return { reply: "Command logic error: Model failed to produce structured intelligence. Please re-state query." };
      }

      return output;
    } catch (error: any) {
      console.error('AI Coach Chat Error:', error);
      return { 
        reply: `Tactical downlink failure: ${error.message || 'Unknown CNS disruption'}. Check signal and retry.` 
      };
    }
  }
);

export async function aiCoachChat(input: AICoachChatInput): Promise<AICoachChatOutput> {
  return aiCoachChatFlow(input);
}
