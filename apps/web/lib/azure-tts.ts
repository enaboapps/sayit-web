import { ProxiedCloudTTS } from './proxied-cloud-tts';
import type { CloudVoice } from './tts-types';

export type AzureVoice = CloudVoice;

// Azure Cognitive Services voices, through /api/azure/*.
export class AzureTTS extends ProxiedCloudTTS {
  private static instance: AzureTTS;

  private constructor() {
    super({ name: 'Azure', voicesPath: '/api/azure/voices', ttsPath: '/api/azure/tts' });
  }

  public static getInstance(): AzureTTS {
    if (!AzureTTS.instance) {
      AzureTTS.instance = new AzureTTS();
    }
    return AzureTTS.instance;
  }
}
