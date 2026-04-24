
'use server';
/**
 * @fileOverview A flow that converts tactical coaching text into audio.
 * Includes dynamic handling for wav module interop.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Custom utility to handle PCM to WAV conversion with robust module loading
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Dynamic import to handle Turbopack module resolution quirks
      const wav = await import('wav');
      
      // Determine the correct constructor based on environment interop
      // @ts-ignore
      const WriterClass = (wav.default && wav.default.Writer) ? wav.default.Writer : (wav.Writer || wav.default);
      
      if (!WriterClass) {
        throw new Error('Tactical Audio Failure: wav.Writer constructor not found.');
      }

      const writer = new WriterClass({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      let bufs = [] as any[];
      writer.on('error', (err: any) => reject(new Error(`WAV Serialization Failed: ${err.message}`)));
      writer.on('data', function (d: any) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });

      writer.write(pcmData);
      writer.end();
    } catch (err: any) {
      reject(new Error(`Tactical Audio Initialization Failed: ${err.message}`));
    }
  });
}

const AudioBriefingInputSchema = z.object({
  text: z.string().describe('The tactical briefing text to convert to audio.'),
});

const AudioBriefingOutputSchema = z.object({
  media: z.string().describe('Data URI of the generated WAV audio.'),
});

export async function getTacticalVoice(input: z.infer<typeof AudioBriefingInputSchema>) {
  return tacticalVoiceFlow(input);
}

const tacticalVoiceFlow = ai.defineFlow(
  {
    name: 'tacticalVoiceFlow',
    inputSchema: AudioBriefingInputSchema,
    outputSchema: AudioBriefingOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: `Instruction: Speak this tactical briefing with an authoritative, deep, elite military coach voice. Focus on the data. Text: ${input.text}`,
    });

    if (!media || !media.url) {
      throw new Error('Communication downlink failure: No audio returned from command.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const base64Wav = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + base64Wav,
    };
  }
);
