'use server';
/**
 * @fileOverview A flow that analyzes gym equipment from a photo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IronVisionInputSchema = z.object({
  photoDataUri: z.string().describe('A photo of gym equipment as a data URI.'),
});

const IronVisionOutputSchema = z.object({
  equipmentName: z.string().describe('The name of the identified equipment.'),
  tacticalAdvice: z.string().describe('Tactical usage advice for the equipment.'),
  targetMuscles: z.array(z.string()).describe('List of primary muscle groups targeted.'),
});

export async function analyzeEquipment(input: z.infer<typeof IronVisionInputSchema>): Promise<z.infer<typeof IronVisionOutputSchema>> {
  return ironVisionFlow(input);
}

const ironVisionFlow = ai.defineFlow(
  {
    name: 'ironVisionFlow',
    inputSchema: IronVisionInputSchema,
    outputSchema: IronVisionOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: [
        { text: 'You are an elite strength coach. Identify this gym equipment and provide tactical advice on how to use it for maximum force production and safety. List primary muscles targeted.' },
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } },
      ],
      output: { schema: IronVisionOutputSchema },
    });

    if (!output) throw new Error('Analysis failed.');
    return output;
  }
);
