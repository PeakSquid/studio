
'use server';
/**
 * @fileOverview A flow that generates a daily tactical strength tip.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TacticalTipOutputSchema = z.object({
  title: z.string().describe('Short, punchy title for the tip.'),
  content: z.string().describe('Concise, tactical advice (1-2 sentences).'),
  category: z.enum(['Recovery', 'Mechanics', 'Nutrition', 'Mindset']).describe('The category of the tip.'),
});

export async function getDailyTacticalTip(): Promise<z.infer<typeof TacticalTipOutputSchema>> {
  return tacticalTipFlow();
}

const tacticalTipFlow = ai.defineFlow(
  {
    name: 'tacticalTipFlow',
    inputSchema: z.void(),
    outputSchema: TacticalTipOutputSchema,
  },
  async () => {
    const { output } = await ai.generate({
      prompt: "Generate a daily tactical tip for an elite weightlifter. Focus on biomechanics, nervous system recovery, or high-performance nutrition. Persona: 'Grit & Iron'. Use short, punchy sentences.",
      output: { schema: TacticalTipOutputSchema },
    });

    if (!output) throw new Error('Tactical downlink failure.');
    return output;
  }
);
