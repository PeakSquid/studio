'use server';
/**
 * @fileOverview A flow that generates a "Spirit Totem" image based on the user's rank.
 * Includes fallback logic for environments where AI image generation might be restricted.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TotemInputSchema = z.object({
  rank: z.string().describe('The current overall rank of the athlete (Bronze, Silver, Gold, Elite).'),
  style: z.string().optional().describe('Optional style override.'),
});

const TotemOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI or URL of the generated totem image.'),
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
    const descriptions: Record<string, string> = {
      'Bronze': 'The Iron Boar: Relentless, stubborn, building the foundation of strength.',
      'Silver': 'The Silver Stag: Graceful power, consistent growth, and evolving neurological efficiency.',
      'Gold': 'The Golden Lion: Dominant force production, advanced mechanics, and supreme confidence.',
      'Elite': 'The Cybernetic Phoenix: Peak human output, transcending standard biology through sheer iron will.'
    };

    const fallbacks: Record<string, string> = {
      'Bronze': 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=800',
      'Silver': 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&q=80&w=800',
      'Gold': 'https://images.unsplash.com/photo-1614027126211-975187263dcc?auto=format&fit=crop&q=80&w=800',
      'Elite': 'https://images.unsplash.com/photo-1544322409-f64883497741?auto=format&fit=crop&q=80&w=800'
    };

    try {
      const prompt = `Generate a tactical, high-contrast, minimalist emblem of a spirit animal representing an athlete with ${input.rank} rank. 
      Style: Brutalist, metallic textures, dark background, glowing accents matching the rank color (${input.rank === 'Bronze' ? 'Bronze/Brown' : input.rank === 'Silver' ? 'Silver/White' : input.rank === 'Gold' ? 'Gold/Yellow' : 'Purple/Electric Blue'}). 
      The animal should look powerful and focused. No text. 4k resolution aesthetic.`;

      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt,
      });

      if (media && media.url) {
        return {
          imageUrl: media.url,
          description: descriptions[input.rank] || 'The Unknown Beast: A strength profile yet to be categorized.'
        };
      }
    } catch (e) {
      // Gracefully handle quota or plan errors by providing a rank-appropriate fallback
      console.warn('AI Totem generation failed (likely plan restriction). Using tactical fallback.', e);
    }

    // Fallback logic
    return {
      imageUrl: fallbacks[input.rank] || fallbacks['Bronze'],
      description: `[TACTICAL FALLBACK] ${descriptions[input.rank] || 'The Unknown Beast'}`
    };
  }
);
