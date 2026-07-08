import type { TTSProviderType } from './tts-provider';

export type LiveTypingSpeechAction = 'speak' | 'stop';

export interface LiveTypingSpeechSettings {
  provider: TTSProviderType;
  voiceId?: string;
  rate: number;
  pitch: number;
  volume: number;
  stability: number;
  similarityBoost: number;
  modelId?: string;
}

export interface LiveTypingSpeechCommand {
  id: string;
  action: LiveTypingSpeechAction;
  text?: string;
  createdAt: number;
  settings?: LiveTypingSpeechSettings;
}

export function cleanLiveTypingSpeechSettings(settings: LiveTypingSpeechSettings): LiveTypingSpeechSettings {
  return {
    provider: settings.provider,
    ...(settings.voiceId ? { voiceId: settings.voiceId } : {}),
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
    stability: settings.stability,
    similarityBoost: settings.similarityBoost,
    ...(settings.modelId ? { modelId: settings.modelId } : {}),
  };
}
