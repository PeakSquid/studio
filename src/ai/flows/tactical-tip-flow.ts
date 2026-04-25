'use server';
/**
 * @fileOverview A flow that generates a daily tactical strength tip.
 */

import { ai, googleAIPlugin } from '@/ai/genkit';
import { z } from 'genkit';

const TacticalTipOutputSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.enum(['Recovery', 'Mechanics', 'Nutrition', 'Mindset']),
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
      model: googleAIPlugin.model('gemini-2.5-flash'),
      prompt: "Generate a daily tactical tip for an elite weightlifter. Persona: 'Grit & Iron'.",
      output: { schema: TacticalTipOutputSchema },
    });

    if (!output) throw new Error('Tactical downlink failure.');
    return output;
  }
);