/**
 * Base callback interface shared by all TTS providers.
 * Provider-specific callbacks (e.g. onVoicesChanged with typed voices) extend this.
 */
export interface BaseTTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Shared with Convex: keep this module free of browser implementation imports.
// To add a cloud provider, add its ID here, then its entry in lib/tts-providers.ts,
// its server routes, and its literal in the Convex userSettings validators.
export const CLOUD_TTS_PROVIDERS = ['elevenlabs', 'azure', 'gemini'] as const;
export type CloudTTSProviderType = typeof CLOUD_TTS_PROVIDERS[number];
export type TTSProviderType = 'browser' | CloudTTSProviderType;

// Cloud providers need SayIt Pro and a connection.
export function isCloudProvider(provider: unknown): provider is CloudTTSProviderType {
  return (CLOUD_TTS_PROVIDERS as readonly unknown[]).includes(provider);
}

export interface CloudVoice {
  voice_id: string;
  name: string;
  style?: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}

export interface CloudTTSSpeakOptions {
  voiceId?: string;
  // ElevenLabs only; other providers ignore them.
  stability?: number;
  similarityBoost?: number;
  modelId?: string;
  // Lets a signed-out Live Typing viewer play the sharer's voice.
  liveTyping?: { sessionKey: string; commandId: string };
}

// What TTSProvider needs from each cloud provider's browser client.
export interface CloudTTSClient {
  loadVoices(): Promise<void>;
  hasLoadedVoices(): boolean;
  isAvailable(): boolean;
  getVoices(): CloudVoice[];
  setCallbacks(callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: CloudVoice[]) => void }): void;
  speak(text: string, options?: CloudTTSSpeakOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
}

// Custom voice providers were removed in v5.4.0. Settings saved on a device, or
// sent by a client cached before then, may still hold 'custom' with a 'custom:'
// voice ID; treat those as browser speech with the default voice.
export const REMOVED_CUSTOM_TTS_PROVIDER = 'custom';

export function withoutRemovedTTSProvider<T extends { ttsProvider?: unknown; ttsVoiceId?: unknown }>(
  settings: T,
): T {
  if (settings.ttsProvider !== REMOVED_CUSTOM_TTS_PROVIDER) return settings;
  return { ...settings, ttsProvider: 'browser', ttsVoiceId: '' };
}
