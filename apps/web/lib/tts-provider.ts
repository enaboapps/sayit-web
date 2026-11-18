import { CLOUD_TTS_PROVIDER_INFO } from './tts-providers';
import { TextToSpeech as WebSpeechTTS } from './tts';

import { CLOUD_TTS_PROVIDERS, isCloudProvider } from './tts-types';
import type { CloudTTSClient, CloudTTSProviderType, CloudTTSSpeakOptions, TTSProviderType } from './tts-types';
export type { CloudTTSProviderType, TTSProviderType } from './tts-types';

export interface TTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onVoicesChanged?: (voices: TTSVoice[]) => void;
  onWordBoundary?: (word: string, charIndex: number) => void;
}

export interface TTSVoice {
  id: string;
  name: string;
  provider: TTSProviderType;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}

export interface CloudTTSStatus {
  // The server has a key for it and returned voices.
  available: boolean;
  // The voice list has been fetched at least once (available or not).
  voicesLoaded: boolean;
}

export interface TTSStatus {
  isSpeaking: boolean;
  activeProvider: TTSProviderType;
  browserTTSAvailable: boolean;
  cloud: Record<CloudTTSProviderType, CloudTTSStatus>;
}

export function emptyCloudTTSStatus(): Record<CloudTTSProviderType, CloudTTSStatus> {
  return Object.fromEntries(
    CLOUD_TTS_PROVIDERS.map((provider) => [provider, { available: false, voicesLoaded: false }]),
  ) as Record<CloudTTSProviderType, CloudTTSStatus>;
}

export type TTSSpeakOptions = CloudTTSSpeakOptions & {
  // Browser voices only.
  rate?: number;
  pitch?: number;
  volume?: number;
};

// Unified class that can use either provider
export class TTSProvider {
  private static instance: TTSProvider;
  private cloudClients: Record<CloudTTSProviderType, CloudTTSClient>;
  private webSpeechTTS: WebSpeechTTS;
  private activeProvider: TTSProviderType = 'browser';
  private isSpeaking: boolean = false;
  // Fan-out set so multiple `useTTS()` callers can each receive the same
  // start/end events. A single-slot callbacks object would let whichever
  // hook subscribed last silently shadow the others.
  private callbackSubscribers = new Set<TTSCallbacks>();

  private constructor() {
    this.webSpeechTTS = WebSpeechTTS.getInstance();
    this.cloudClients = Object.fromEntries(
      CLOUD_TTS_PROVIDERS.map((provider) => [provider, CLOUD_TTS_PROVIDER_INFO[provider].client()]),
    ) as Record<CloudTTSProviderType, CloudTTSClient>;
    this.setupCallbacks();

    // Default to ElevenLabs if available
    if (this.cloudClients.elevenlabs.isAvailable()) {
      this.activeProvider = 'elevenlabs';
    }
  }

  public static getInstance(): TTSProvider {
    if (!TTSProvider.instance) {
      TTSProvider.instance = new TTSProvider();
    }
    return TTSProvider.instance;
  }

  private emit<K extends keyof TTSCallbacks>(
    event: K,
    ...args: Parameters<NonNullable<TTSCallbacks[K]>>
  ) {
    this.callbackSubscribers.forEach((subscriber) => {
      const handler = subscriber[event] as ((...a: typeof args) => void) | undefined;
      handler?.(...args);
    });
  }

  private makeProviderCallbacks(onVoicesChanged?: () => void) {
    return {
      onStart: () => { this.isSpeaking = true; this.emit('onStart'); },
      onEnd: () => { this.isSpeaking = false; this.emit('onEnd'); },
      onError: (error: Error) => { this.isSpeaking = false; this.emit('onError', error); },
      ...(onVoicesChanged ? { onVoicesChanged } : {}),
    };
  }

  private setupCallbacks() {
    const onVoicesChanged = () => this.emit('onVoicesChanged', this.getAllVoices());

    this.webSpeechTTS.setCallbacks({
      ...this.makeProviderCallbacks(onVoicesChanged),
      onWordBoundary: (word, charIndex) => this.emit('onWordBoundary', word, charIndex),
    });
    for (const client of Object.values(this.cloudClients)) {
      client.setCallbacks(this.makeProviderCallbacks(onVoicesChanged));
    }
  }

  public addCallbacks(callbacks: TTSCallbacks): () => void {
    this.callbackSubscribers.add(callbacks);

    // Match the old setCallbacks behavior of immediately notifying new
    // subscribers about the current voice list so React state can hydrate
    // without waiting for a real provider voiceschanged event.
    if (callbacks.onVoicesChanged) {
      callbacks.onVoicesChanged(this.getAllVoices());
    }

    return () => {
      this.callbackSubscribers.delete(callbacks);
    };
  }

  public setProvider(provider: TTSProviderType) {
    // If it's the same provider, do nothing to prevent unnecessary updates
    if (provider === this.activeProvider) {
      return;
    }

    if (isCloudProvider(provider)) {
      const client = this.cloudClients[provider];
      if (client.hasLoadedVoices() && !client.isAvailable()) {
        console.warn(`${CLOUD_TTS_PROVIDER_INFO[provider].name} is not available, staying with browser TTS`);
        return;
      }
    }

    this.activeProvider = provider;
  }

  public getCurrentProvider(): TTSProviderType {
    return this.activeProvider;
  }

  public getAllVoices(): TTSVoice[] {
    const browserVoices: TTSVoice[] = this.webSpeechTTS.getVoices().map(voice => ({
      id: voice.voiceURI,
      name: `${voice.name} (${voice.lang})`,
      provider: 'browser',
    }));

    const cloudVoices = CLOUD_TTS_PROVIDERS.flatMap((provider): TTSVoice[] => (
      this.cloudClients[provider].getVoices().map(voice => ({
        id: voice.voice_id,
        name: `${voice.name}${CLOUD_TTS_PROVIDER_INFO[provider].voiceNameSuffix}`,
        provider,
        gender: voice.gender,
        languageCodes: voice.languageCodes,
      }))
    ));

    return [...browserVoices, ...cloudVoices];
  }

  public getVoicesByProvider(provider: TTSProviderType): TTSVoice[] {
    return this.getAllVoices().filter(voice => voice.provider === provider);
  }

  public getVoiceById(id: string): TTSVoice | undefined {
    return this.getAllVoices().find(voice => voice.id === id);
  }

  public refreshVoices() {
    this.webSpeechTTS.refreshVoices();
    this.emit('onVoicesChanged', this.getAllVoices());
  }

  // Fetches a cloud provider's voice list (once; later calls reuse it).
  public async loadCloudVoices(provider: CloudTTSProviderType) {
    await this.cloudClients[provider].loadVoices();
    this.emit('onVoicesChanged', this.getAllVoices());
  }

  public speak(text: string, options?: TTSSpeakOptions) {
    // Determine which provider to use based on the selected voice
    let provider = this.activeProvider;

    if (options?.voiceId) {
      const voice = this.getVoiceById(options.voiceId);
      if (voice) {
        provider = voice.provider;
      }
    }

    if (isCloudProvider(provider)) {
      void this.cloudClients[provider].speak(text, {
        voiceId: options?.voiceId,
        stability: options?.stability,
        similarityBoost: options?.similarityBoost,
        modelId: options?.modelId,
        liveTyping: options?.liveTyping,
      });
      return;
    }

    this.webSpeechTTS.speak(text, {
      voiceURI: options?.voiceId,
      rate: options?.rate,
      pitch: options?.pitch,
      volume: options?.volume,
    });
  }

  public stop() {
    this.webSpeechTTS.stop();
    for (const client of Object.values(this.cloudClients)) {
      client.stop();
    }
  }

  public pause() {
    if (isCloudProvider(this.activeProvider)) {
      this.cloudClients[this.activeProvider].pause();
    } else {
      this.webSpeechTTS.pause();
    }
  }

  public resume() {
    if (isCloudProvider(this.activeProvider)) {
      this.cloudClients[this.activeProvider].resume();
    } else {
      this.webSpeechTTS.resume();
    }
  }

  public isAvailable(): boolean {
    return this.webSpeechTTS.isAvailable()
      || Object.values(this.cloudClients).some(client => client.isAvailable());
  }

  public getStatus(): TTSStatus {
    const cloud = emptyCloudTTSStatus();
    for (const provider of CLOUD_TTS_PROVIDERS) {
      cloud[provider] = {
        available: this.cloudClients[provider].isAvailable(),
        voicesLoaded: this.cloudClients[provider].hasLoadedVoices(),
      };
    }

    return {
      isSpeaking: this.isSpeaking,
      activeProvider: this.activeProvider,
      browserTTSAvailable: this.webSpeechTTS.isAvailable(),
      cloud,
    };
  }
}
