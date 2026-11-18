import { AzureTTS } from './azure-tts';
import { ElevenLabsTTS } from './elevenlabs-tts';
import { GeminiTTS } from './gemini-tts';
import { isCloudProvider } from './tts-types';
import type { CloudTTSClient, CloudTTSProviderType, TTSProviderType } from './tts-types';

export interface TTSProviderInfo {
  name: string;
  description: string;
}

export interface CloudTTSProviderInfo extends TTSProviderInfo {
  // Added to voice names in the combined voice list, such as " (Gemini)".
  voiceNameSuffix: string;
  // Whether the voice picker offers gender and language filters.
  voiceFilters: boolean;
  client: () => CloudTTSClient;
}

export const BROWSER_TTS_INFO: TTSProviderInfo = { name: 'Browser TTS', description: 'System voices' };

// One entry per cloud provider. The Record type makes the compiler ask for an
// entry when an ID is added to CLOUD_TTS_PROVIDERS.
export const CLOUD_TTS_PROVIDER_INFO: Record<CloudTTSProviderType, CloudTTSProviderInfo> = {
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'AI voices',
    voiceNameSuffix: ' (ElevenLabs)',
    voiceFilters: true,
    client: () => ElevenLabsTTS.getInstance(),
  },
  azure: {
    name: 'Azure',
    description: 'Neural voices',
    voiceNameSuffix: '',
    voiceFilters: true,
    client: () => AzureTTS.getInstance(),
  },
  gemini: {
    name: 'Gemini',
    description: 'Expressive AI voices',
    voiceNameSuffix: ' (Gemini)',
    voiceFilters: false,
    client: () => GeminiTTS.getInstance(),
  },
};

// Anything that isn't a known cloud provider (including stale saved values) is browser speech.
export function getTTSProviderInfo(provider: TTSProviderType): TTSProviderInfo {
  return isCloudProvider(provider) ? CLOUD_TTS_PROVIDER_INFO[provider] : BROWSER_TTS_INFO;
}
