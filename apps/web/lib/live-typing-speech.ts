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
