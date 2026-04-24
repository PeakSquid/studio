'use server';
/**
 * @fileOverview A flow that generates a 5-second tactical hype video using Veo 3.0.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const HypeVideoInputSchema = z.object({
  rank: z.string().describe('The current overall rank of the athlete.'),
  totemDescription: z.string().describe('The description of the athlete spirit totem.'),
});

const HypeVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI or URL of the generated video.'),
});

export async function generateHypeVideo(input: z.infer<typeof HypeVideoInputSchema>): Promise<z.infer<typeof HypeVideoOutputSchema>> {
  return generateHypeVideoFlow(input);
}

const generateHypeVideoFlow = ai.defineFlow(
  {
    name: 'generateHypeVideoFlow',
    inputSchema: HypeVideoInputSchema,
    outputSchema: HypeVideoOutputSchema,
  },
  async (input) => {
    const prompt = `A cinematic, high-energy tactical hype video for an elite athlete. 
    Subject: A powerful manifestation of ${input.totemDescription}. 
    Style: Metallic textures, glowing ${input.rank === 'Elite' ? 'purple' : 'cyan'} accents, dark brutalist gym environment, fast camera movements, cinematic lighting. 
    The video should feel like a high-end sports commercial for a futuristic strength program. No text.`;

    try {
      let { operation } = await ai.generate({
        model: 'googleai/veo-3.0-generate-preview',
        prompt,
      });

      if (!operation) {
        throw new Error('Video generation downlink failure: Operation not returned.');
      }

      // Poll for completion
      while (!operation.done) {
        operation = await ai.checkOperation(operation);
        if (!operation.done) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (operation.error) {
        throw new Error('Video generation failed: ' + operation.error.message);
      }

      const video = operation.output?.message?.content.find((p) => !!p.media);
      if (!video || !video.media) {
        throw new Error('Failed to find the generated video in telemetry.');
      }

      // Fetch and convert to base64
      const fetch = (await import('node-fetch')).default;
      const videoDownloadResponse = await fetch(
        `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
      );
      
      if (!videoDownloadResponse.ok) {
        throw new Error('Failed to download video from storage.');
      }

      const buffer = await videoDownloadResponse.buffer();
      const base64Video = buffer.toString('base64');

      return {
        videoUrl: `data:video/mp4;base64,${base64Video}`,
      };
    } catch (e: any) {
      console.error('Hype Video Generation Error:', e);
      // Return a fallback or throw
      throw new Error(`Cinematic downlink failure: ${e.message}`);
    }
  }
);
