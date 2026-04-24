'use server';
/**
 * @fileOverview An AI coach agent that provides personalized advice and workout plans.
 *
 * - aiCoachChat - A function that handles natural language questions and plan generation.
 * - AICoachChatInput - The input type for the aiCoachChat function.
 * - AICoachChatOutput - The return type for the aiCoachChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Helper function from the client-side code to calculate rank.
// In a real app, this would typically be a shared utility or a service.
function getRank(lift: string, pr: number): string {
  const THRESHOLDS: { [key: string]: { r: string; min: number }[] } = {
    'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
    'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
    'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
    'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
    'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
    'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
  };
  const tiers = THRESHOLDS[lift] || [];
  let rank = 'Bronze';
  for (const t of tiers) { if (pr >= t.min) rank = t.r; }
  return rank;
}

// Helper function from the client-side code to calculate overall rank.
function overallRank(lifts: Record<string, { pr: number; reps: number }>): string {
  const all = Object.entries(lifts).map(([l,d]) => getRank(l,d.pr));
  const c: Record<string, number> = {Bronze:0,Silver:0,Gold:0,Elite:0};
  all.forEach(r => c[r]++);
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}


// --- Schemas --- 

const LiftDataSchema = z.object({
  pr: z.number().describe('Personal record for the lift in pounds.'),
  reps: z.number().describe('Reps achieved at the personal record weight.'),
});

const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.number().describe('Number of sets for the exercise.'),
  reps: z.string().describe('Number of reps for the exercise, can be a range like "8-12".'),
  weight: z.number().describe('Suggested weight for the exercise in pounds.'),
});

const WorkoutSchema = z.object({
  name: z.string().describe('Name of the workout, e.g., "Push Power".'),
  type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest']).describe('Type of workout.'),
  focus: z.string().describe('Muscle groups or training focus.'),
  duration: z.number().describe('Estimated duration in minutes.'),
  xp: z.number().describe('Experience points earned from completing the workout.'),
  exercises: z.array(ExerciseSchema).describe('List of exercises in the workout.'),
});

const PlanBlockSchema = z.object({
  name: z.string().describe('Name of the training block, e.g., "Block 1 — Strength Foundation".'),
  desc: z.string().describe('Description of the training block.'),
});

const PlanGoalSchema = z.object({
  lift: z.string().describe('Name of the lift, e.g., "Bench Press".'),
  start: z.number().describe('Starting PR for the lift.'),
  target: z.number().describe('Target PR for the lift at the end of the plan.'),
});

const WorkoutPlanSchema = z.object({
  totalWeeks: z.number().describe('Total number of weeks for the plan.'),
  blocks: z.array(PlanBlockSchema).describe('Breakdown of training blocks.'),
  schedule: z.record(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full', 'rest'])).describe('Weekly schedule mapping day of week (0=Sunday to 6=Saturday) to workout type.'),
  workouts: z.array(WorkoutSchema).describe('Detailed definitions for each workout type.'),
  goals: z.array(PlanGoalSchema).describe('Target personal records for key lifts.'),
});

const AICoachChatInputSchema = z.object({
  query: z.string().describe('The user\'s chat message to the AI coach.'),
  lifts: z.record(z.string(), LiftDataSchema).describe('Current personal records for all tracked lifts.'),
  overallRank: z.string().describe('The user\'s overall rank (e.g., Bronze, Silver, Gold, Elite).'),
  streak: z.number().describe('The user\'s current workout streak in days.'),
  workoutsCompleted: z.number().describe('The total number of workouts completed by the user.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('Role of the message sender. Can be "user" or "assistant".'),
    content: z.string().describe('Content of the chat message.'),
  })).describe('Recent chat history for context.'),
});
export type AICoachChatInput = z.infer<typeof AICoachChatInputSchema>;

const AICoachChatOutputSchema = z.object({
  reply: z.string().optional().describe('The conversational reply from the AI coach.'),
  plan: WorkoutPlanSchema.optional().describe('A personalized workout plan, if generated by the AI coach.'),
});
export type AICoachChatOutput = z.infer<typeof AICoachChatOutputSchema>;


// --- Tools ---

const generateWorkoutPlanTool = ai.defineTool(
  {
    name: 'generateWorkoutPlan',
    description: 'Generates a personalized 12-week workout plan based on the user\'s current lifts and training history. Call this tool when the user explicitly asks for a workout plan or program.',
    inputSchema: z.object({
      benchPressPR: z.number().describe('User\'s current Bench Press PR in lbs.'),
      squatPR: z.number().describe('User\'s current Squat PR in lbs.'),
      deadliftPR: z.number().describe('User\'s current Deadlift PR in lbs.'),
      overheadPressPR: z.number().describe('User\'s current Overhead Press PR in lbs.'),
      barbellRowPR: z.number().describe('User\'s current Barbell Row PR in lbs.'),
      pullUpPR: z.number().describe('User\'s current Pull-Up PR in lbs.'),
      overallRank: z.string().describe('User\'s overall rank (e.g., Bronze, Silver, Gold, Elite).'),
      streak: z.number().describe('User\'s current workout streak in days.'),
      workoutsCompleted: z.number().describe('Total number of workouts completed by the user.'),
    }),
    outputSchema: WorkoutPlanSchema,
  },
  async (input) => {
    // This logic replicates the plan generation structure from the original client-side code.
    // It uses the provided PRs to calculate suggested weights.
    const bp = input.benchPressPR || 135;
    const sq = input.squatPR || 185;
    const dl = input.deadliftPR || 225;
    const ohp = input.overheadPressPR || 75;
    const br = input.barbellRowPR || 115;
    const pu = input.pullUpPR || 0; // Pull-up PR in the client means added weight, 0 for bodyweight only

    const plan = {
      totalWeeks: 12,
      blocks: [
        {name: "Block 1 — Strength Foundation", desc: "Weeks 1-4 · 5x5 compounds, linear progression"},
        {name: "Block 2 — Hypertrophy", desc: "Weeks 5-8 · 4x8-12, volume increase"},
        {name: "Block 3 — Peaking", desc: "Weeks 9-12 · Heavy singles, PR attempts"}
      ],
      schedule: {
        "0": "rest", "1": "push", "2": "pull", "3": "legs", "4": "rest", "5": "push", "6": "legs"
      },
      workouts: [
        {
          name: "Push Power", type: "push", focus: "Chest · Shoulders · Triceps", duration: 52, xp: 3,
          exercises: [
            {name: "Bench Press", sets: 4, reps: "5", weight: Math.round(bp * 0.85)},
            {name: "Overhead Press", sets: 3, reps: "8", weight: Math.round(ohp * 0.8)},
            {name: "Incline DB Press", sets: 3, reps: "10", weight: 65},
            {name: "Lateral Raises", sets: 3, reps: "15", weight: 20},
            {name: "Tricep Pushdown", sets: 3, reps: "12", weight: 50}
          ]
        },
        {
          name: "Pull Strength", type: "pull", focus: "Back · Biceps", duration: 48, xp: 3,
          exercises: [
            {name: "Barbell Row", sets: 4, reps: "5", weight: Math.round(br * 0.85)},
            {name: "Pull-Up", sets: 3, reps: "6", weight: pu},
            {name: "Cable Row", sets: 3, reps: "10", weight: 120},
            {name: "Face Pulls", sets: 3, reps: "15", weight: 40},
            {name: "Barbell Curl", sets: 3, reps: "10", weight: 65}
          ]
        },
        {
          name: "Leg Day", type: "legs", focus: "Quads · Hamstrings · Glutes", duration: 55, xp: 4,
          exercises: [
            {name: "Squat", sets: 4, reps: "5", weight: Math.round(sq * 0.85)},
            {name: "Romanian Deadlift", sets: 3, reps: "8", weight: Math.round(dl * 0.7)},
            {name: "Leg Press", sets: 3, reps: "12", weight: 360},
            {name: "Leg Curl", sets: 3, reps: "12", weight: 80},
            {name: "Calf Raise", sets: 4, reps: "15", weight: 135}
          ]
        }
      ],
      goals: [
        {lift: "Bench Press", start: bp, target: bp + 50},
        {lift: "Squat", start: sq, target: sq + 60},
        {lift: "Deadlift", start: dl, target: dl + 90}
      ]
    };
    return plan;
  }
);

// --- Prompt Definition ---

const aiCoachPrompt = ai.definePrompt({
  name: 'aiCoachPrompt',
  input: {schema: AICoachChatInputSchema},
  output: {schema: AICoachChatOutputSchema},
  tools: [generateWorkoutPlanTool],
  prompt: `You are an expert AI weightlifting coach inside the IronRank app. You are motivating, knowledgeable, and concise.

User stats:
Lifts & ranks: {{{userStats.liftsStr}}}
Overall rank: {{{userStats.overallRank}}}
Streak: {{{userStats.streak}}} days
Workouts done: {{{userStats.workoutsCompleted}}}

Current chat history for context (previous messages are assistant/user pairs):
{{{chatHistory}}}

Based on the current user query and their stats, either:
1. If the user explicitly asks for a workout plan or program (e.g., "generate my 12-week plan", "create a new program for me"), call the 'generateWorkoutPlan' tool to create a comprehensive 12-week plan. Pass relevant PRs from the 'lifts' data as parameters to the tool.
2. For all other messages, respond conversationally in 2-4 sentences. Be direct, specific, and reference their actual numbers when providing advice or analysis. Do not make up information that is not available in the user stats. Do not explicitly mention that you are using a tool.

User query: {{{query}}}`,
});

// --- Flow Implementation ---

const aiCoachChatFlow = ai.defineFlow(
  {
    name: 'aiCoachChatFlow',
    inputSchema: AICoachChatInputSchema,
    outputSchema: AICoachChatOutputSchema,
  },
  async (input) => {
    // Prepare user stats string for the prompt
    const liftsStr = Object.entries(input.lifts)
      .map(([l, d]) => `${l}: ${d.pr} lb (${getRank(l, d.pr)})`)
      .join(', ');

    const userStats = {
      liftsStr,
      overallRank: input.overallRank,
      streak: input.streak,
      workoutsCompleted: input.workoutsCompleted,
    };

    // Prepare chat history for the prompt to allow the LLM to maintain context
    const chatHistory = input.chatHistory.map(
      (message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`
    ).join('\n');

    const modelResponse = await ai.generate({
      prompt: aiCoachPrompt,
      input: {
        query: input.query,
        userStats: userStats,
        chatHistory: chatHistory,
      },
      // Ensure the model is capable of tool calling
      model: 'googleai/gemini-2.5-flash',
    });

    if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
      const toolCall = modelResponse.toolCalls[0]; // Assuming only one tool call for simplicity

      if (toolCall.name === generateWorkoutPlanTool.name) {
        // Execute the generateWorkoutPlan tool
        const toolOutput = await generateWorkoutPlanTool.run({
          benchPressPR: input.lifts['Bench Press']?.pr || 0,
          squatPR: input.lifts['Squat']?.pr || 0,
          deadliftPR: input.lifts['Deadlift']?.pr || 0,
          overheadPressPR: input.lifts['Overhead Press']?.pr || 0,
          barbellRowPR: input.lifts['Barbell Row']?.pr || 0,
          pullUpPR: input.lifts['Pull-Up']?.pr || 0,
          overallRank: input.overallRank,
          streak: input.streak,
          workoutsCompleted: input.workoutsCompleted,
        });
        return { plan: toolOutput, reply: 'Your 12-week plan has been generated and saved! Head to the Plan tab to see the full program breakdown.' };
      }
    }

    // If no tool call, or if it's a conversational response
    return { reply: modelResponse.text };
  }
);

export async function aiCoachChat(input: AICoachChatInput): Promise<AICoachChatOutput> {
  return aiCoachChatFlow(input);
}
