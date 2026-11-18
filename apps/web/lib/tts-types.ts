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
export type TTSProviderType = 'browser' | 'elevenlabs' | 'azure' | 'gemini';

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
