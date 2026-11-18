import { ProxiedCloudTTS } from './proxied-cloud-tts';
import type { CloudVoice } from './tts-types';

export type GeminiVoice = CloudVoice;

// Gemini voices, through /api/gemini/*.
export class GeminiTTS extends ProxiedCloudTTS {
  private static instance: GeminiTTS;

  private constructor() {
    super({ name: 'Gemini', voicesPath: '/api/gemini/voices', ttsPath: '/api/gemini/tts' });
  }

  public static getInstance(): GeminiTTS {
    if (!GeminiTTS.instance) {
      GeminiTTS.instance = new GeminiTTS();
    }
    return GeminiTTS.instance;
  }
}
