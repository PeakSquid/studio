'use server';
/**
 * @fileOverview A flow that analyzes gym equipment or lifting form from a photo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IronVisionInputSchema = z.object({
  photoDataUri: z.string().describe('A photo of gym equipment or an athlete lifting as a data URI.'),
  mode: z.enum(['equipment', 'form']).describe('Whether to identify equipment or analyze lifting form.'),
});

const EquipmentOutputSchema = z.object({
  equipmentName: z.string().describe('The name of the identified equipment.'),
  tacticalAdvice: z.string().describe('Tactical usage advice for the equipment.'),
  targetMuscles: z.array(z.string()).describe('List of primary muscle groups targeted.'),
});

const FormCheckOutputSchema = z.object({
  score: z.number().describe('Form score from 0-100.'),
  feedback: z.string().describe('Tactical biomechanical feedback.'),
  safetyWarnings: z.array(z.string()).describe('Critical safety alerts if any.'),
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
