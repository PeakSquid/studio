'use server';
/**
 * @fileOverview A flow that generates a "Spirit Totem" image based on the user's rank.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TotemInputSchema = z.object({
  rank: z.string().describe('The current overall rank of the athlete (Bronze, Silver, Gold, Elite).'),
  style: z.string().optional().describe('Optional style override.'),
});

const TotemOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated totem image.'),
  description: z.string().describe('A brief, badass description of the totem.'),
});

export async function generateSpiritTotem(input: z.infer<typeof TotemInputSchema>): Promise<z.infer<typeof TotemOutputSchema>> {
  return generateSpiritTotemFlow(input);
}

const generateSpiritTotemFlow = ai.defineFlow(
  {
    name: 'generateSpiritTotemFlow',
    inputSchema: TotemInputSchema,
    outputSchema: TotemOutputSchema,
  },
  async (input) => {
    const prompt = `Generate a tactical, high-contrast, minimalist emblem of a spirit animal representing an athlete with ${input.rank} rank. 
    Style: Brutalist, metallic textures, dark background, glowing accents matching the rank color (${input.rank === 'Bronze' ? 'Bronze/Brown' : input.rank === 'Silver' ? 'Silver/White' : input.rank === 'Gold' ? 'Gold/Yellow' : 'Purple/Electric Blue'}). 
    The animal should look powerful and focused. No text. 4k resolution aesthetic.`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt,
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate totem image.');
    }

    const descriptions: Record<string, string> = {
      'Bronze': 'The Iron Boar: Relentless, stubborn, building the foundation of strength.',
      'Silver': 'The Silver Stag: Graceful power, consistent growth, and evolving neurological efficiency.',
      'Gold': 'The Golden Lion: Dominant force production, advanced mechanics, and supreme confidence.',
      'Elite': 'The Cybernetic Phoenix: Peak human output, transcending standard biology through sheer iron will.'
    };

    return {
      imageUrl: media.url,
      description: descriptions[input.rank] || 'The Unknown Beast: A strength profile yet to be categorized.'
    };
  }
);
