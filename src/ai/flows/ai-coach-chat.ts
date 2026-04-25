'use server';
/**
 * @fileOverview An AI coach agent that provides personalized advice and workout plans.
 * Hardened with resilient model references and defensive telemetry handling.
 */

import {ai, googleAIPlugin} from '@/ai/genkit';
import {z} from 'genkit';

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

const PlanBlockSchema = z.object({
  name: z.string(),
  desc: z.string(),
});

const PlanGoalSchema = z.object({
  lift: z.string(),
  start: z.number(),
  target: z.number(),
});

const WorkoutPlanSchema = z.object({
  totalWeeks: z.number(),
  blocks: z.array(PlanBlockSchema),
  schedule: z.record(z.string()),
  workouts: z.array(WorkoutSchema),
  goals: z.array(PlanGoalSchema),
});

const AICoachChatInputSchema = z.object({
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
export type AICoachChatInput = z.infer<typeof AICoachChatInputSchema>;

const InternalAICoachPromptSchema = AICoachChatInputSchema.extend({
  liftsSummary: z.string().default('No data recorded.'),
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
      lifts: z.record(z.any()).nullish().default({}),
    }),
    outputSchema: WorkoutPlanSchema,
  },
  async (input) => {
    const lifts = input.lifts || {};
    const getPr = (name: string, fallback: number) => {
      const data = lifts[name];
      if (typeof data === 'number') return data;
      if (data && typeof data === 'object') return (data as any).pr || fallback;
      return fallback;
    };

    const bp = getPr('Bench Press', 135);
    const sq = getPr('Squat', 185);
    const dl = getPr('Deadlift', 225);
    
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
  model: googleAIPlugin.model('gemini-1.5-flash'),
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

export async function aiCoachChat(input: AICoachChatInput): Promise<AICoachChatOutput> {
  try {
    const safeLifts = input.lifts || {};
    const liftsSummary = Object.entries(safeLifts)
      .map(([l, d]: [string, any]) => {
        const pr = typeof d === 'number' ? d : d?.pr || 0;
        return `${l}: ${pr}lb`;
      })
      .join(', ') || 'No data recorded.';

    const { output } = await aiCoachPrompt({
      ...input,
      lifts: safeLifts,
      liftsSummary,
    });

    if (!output) {
      return { reply: "Command logic error: Model failed to produce structured intelligence." };
    }

    return output;
  } catch (error: any) {
    console.error('AI Coach Chat Error:', error);
    return { 
      reply: `Tactical downlink failure: ${error.message || 'Signal disruption'}. Verify baseline and retry.` 
    };
  }
}
