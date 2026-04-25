'use server';
/**
 * @fileOverview A flow that analyzes gym equipment or lifting form from a photo.
 */

import { ai, googleAIPlugin } from '@/ai/genkit';
import { z } from 'genkit';

const IronVisionInputSchema = z.object({
  photoDataUri: z.string().describe('A photo as a data URI.'),
  mode: z.enum(['equipment', 'form']).describe('Mode of analysis.'),
});

const EquipmentOutputSchema = z.object({
  equipmentName: z.string(),
  tacticalAdvice: z.string(),
  targetMuscles: z.array(z.string()),
});

const FormCheckOutputSchema = z.object({
  score: z.number(),
  feedback: z.string(),
  safetyWarnings: z.array(z.string()),
});

const IronVisionOutputSchema = z.object({
  equipment: EquipmentOutputSchema.optional(),
  form: FormCheckOutputSchema.optional(),
});

export async function analyzeIronVision(input: z.infer<typeof IronVisionInputSchema>): Promise<z.infer<typeof IronVisionOutputSchema>> {
  return ironVisionFlow(input);
}

const ironVisionFlow = ai.defineFlow(
  {
    name: 'ironVisionFlow',
    inputSchema: IronVisionInputSchema,
    outputSchema: IronVisionOutputSchema,
  },
  async (input) => {
    const systemPrompt = input.mode === 'equipment' 
      ? 'Identify this gym equipment. Provide name, primary muscle targets, and tactical usage advice.'
      : 'Analyze the lifting form of the athlete in this photo. Provide a score (0-100), tactical biomechanical feedback, and any critical safety warnings.';

    const { output } = await ai.generate({
      model: googleAIPlugin.model('gemini-2.5-flash'),
      prompt: [
        { text: `You are an elite strength coach. ${systemPrompt}` },
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } },
      ],
      output: { schema: IronVisionOutputSchema },
    });

    if (!output) throw new Error('Analysis failed.');
    return output;
  }
);