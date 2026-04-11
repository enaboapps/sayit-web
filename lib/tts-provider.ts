import { ElevenLabsTTS } from './elevenlabs-tts';
import { AzureTTS } from './azure-tts';
import { TextToSpeech as WebSpeechTTS } from './tts';

export type TTSProviderType = 'browser' | 'elevenlabs' | 'azure';

export interface TTSVoice {
  id: string;
  name: string;
  provider: TTSProviderType;
}

// Unified class that can use either provider
export class TTSProvider {
  private static instance: TTSProvider;
  private elevenlabsTTS: ElevenLabsTTS;
  private azureTTS: AzureTTS;
  private webSpeechTTS: WebSpeechTTS;
  private activeProvider: TTSProviderType = 'browser';
  private isSpeaking: boolean = false;
  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: TTSVoice[]) => void;
    onWordBoundary?: (word: string, charIndex: number) => void;
  } = {};

  private constructor() {
    this.webSpeechTTS = WebSpeechTTS.getInstance();
    this.elevenlabsTTS = ElevenLabsTTS.getInstance();
    this.azureTTS = AzureTTS.getInstance();
    this.setupCallbacks();

    // Default to ElevenLabs if available
    if (this.elevenlabsTTS.isAvailable()) {
      this.activeProvider = 'elevenlabs';
    }
  }

  public static getInstance(): TTSProvider {
    if (!TTSProvider.instance) {
      TTSProvider.instance = new TTSProvider();
    }
    return TTSProvider.instance;
  }

  private setupCallbacks() {
    // Setup callbacks for both TTS providers
    this.webSpeechTTS.setCallbacks({
      onStart: () => {
        this.isSpeaking = true;
        this.callbacks.onStart?.();
      },
      onEnd: () => {
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
      },
      onError: (error) => {
        this.isSpeaking = false;
        this.callbacks.onError?.(error);
      },
      onVoicesChanged: () => {
        // Notify that voices have changed
        this.callbacks.onVoicesChanged?.(this.getAllVoices());
      },
      onWordBoundary: (word, charIndex) => {
        this.callbacks.onWordBoundary?.(word, charIndex);
      },
    });

    this.elevenlabsTTS.setCallbacks({
      onStart: () => {
        this.isSpeaking = true;
        this.callbacks.onStart?.();
      },
      onEnd: () => {
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
      },
      onError: (error) => {
        this.isSpeaking = false;
        this.callbacks.onError?.(error);
      },
      onVoicesChanged: () => {
        this.callbacks.onVoicesChanged?.(this.getAllVoices());
      }
    });

    this.azureTTS.setCallbacks({
      onStart: () => {
        this.isSpeaking = true;
        this.callbacks.onStart?.();
      },
      onEnd: () => {
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
      },
      onError: (error) => {
        this.isSpeaking = false;
        this.callbacks.onError?.(error);
      },
      onVoicesChanged: () => {
        this.callbacks.onVoicesChanged?.(this.getAllVoices());
      }
    });
  }

  public setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: TTSVoice[]) => void;
    onWordBoundary?: (word: string, charIndex: number) => void;
  }) {
    this.callbacks = callbacks;
    
    // Immediately notify about available voices
    if (callbacks.onVoicesChanged) {
      callbacks.onVoicesChanged(this.getAllVoices());
    }
  }

  public setProvider(provider: TTSProviderType) {
    // If it's the same provider, do nothing to prevent unnecessary updates
    if (provider === this.activeProvider) {
      return;
    }
    
    if (
      provider === 'elevenlabs'
      && this.elevenlabsTTS.hasLoadedVoices()
      && !this.elevenlabsTTS.isAvailable()
    ) {
      console.warn('ElevenLabs is not available, staying with browser TTS');
      return;
    }

    if (
      provider === 'azure'
      && this.azureTTS.hasLoadedVoices()
      && !this.azureTTS.isAvailable()
    ) {
      console.warn('Azure TTS is not available, staying with browser TTS');
      return;
    }
    
    this.activeProvider = provider;
  }

  public getCurrentProvider(): TTSProviderType {
    return this.activeProvider;
  }

  public getAllVoices(): TTSVoice[] {
    const browserVoices = this.webSpeechTTS.getVoices().map(voice => ({
      id: voice.voiceURI,
      name: `${voice.name} (${voice.lang})`,
      provider: 'browser' as TTSProviderType
    }));

    const elevenLabsVoices = this.elevenlabsTTS.getVoices().map(voice => ({
      id: voice.voice_id,
      name: `${voice.name} (ElevenLabs)`,
      provider: 'elevenlabs' as TTSProviderType,
    }));

    const azureVoices = this.azureTTS.getVoices().map(voice => ({
      id: voice.voice_id,
      name: `${voice.name} (Azure)`,
      provider: 'azure' as TTSProviderType,
    }));

    const allVoices = [...browserVoices, ...elevenLabsVoices, ...azureVoices];
    console.log('All available voices:', allVoices);
    return allVoices;
  }

  public getVoicesByProvider(provider: TTSProviderType): TTSVoice[] {
    return this.getAllVoices().filter(voice => voice.provider === provider);
  }

  public getVoiceById(id: string): TTSVoice | undefined {
    return this.getAllVoices().find(voice => voice.id === id);
  }

  public refreshVoices() {
    this.webSpeechTTS.refreshVoices();
    this.callbacks.onVoicesChanged?.(this.getAllVoices());
  }

  public async loadElevenLabsVoices() {
    await this.elevenlabsTTS.loadVoices();
    this.callbacks.onVoicesChanged?.(this.getAllVoices());
  }

  public async loadAzureVoices() {
    await this.azureTTS.loadVoices();
    this.callbacks.onVoicesChanged?.(this.getAllVoices());
  }

  public speak(text: string, options?: {
    voiceId?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    stability?: number;
    similarityBoost?: number;
    modelId?: string;
  }) {
    // Determine which provider to use based on the selected voice
    let provider = this.activeProvider;

    if (options?.voiceId) {
      const voice = this.getVoiceById(options.voiceId);
      if (voice) {
        provider = voice.provider;
      }
    }

    console.log(`Speaking with provider: ${provider}, requested voiceId: ${options?.voiceId}`);

    if (provider === 'elevenlabs') {
      const allVoices = this.getAllVoices();
      const selectedVoice = allVoices.find(v => v.id === options?.voiceId && v.provider === 'elevenlabs');
      const voiceToUse = selectedVoice?.id || allVoices.find(v => v.provider === 'elevenlabs')?.id;

      console.log('Using ElevenLabs voice ID:', voiceToUse);

      this.elevenlabsTTS.speak(text, {
        voiceId: voiceToUse,
        stability: options?.stability,
        similarityBoost: options?.similarityBoost,
        modelId: options?.modelId,
      });
    } else if (provider === 'azure') {
      const allVoices = this.getAllVoices();
      const selectedVoice = allVoices.find(v => v.id === options?.voiceId && v.provider === 'azure');
      const voiceToUse = selectedVoice?.id || allVoices.find(v => v.provider === 'azure')?.id;

      console.log('Using Azure voice ID:', voiceToUse);

      this.azureTTS.speak(text, { voiceId: voiceToUse });
    } else {
      this.webSpeechTTS.speak(text, {
        voiceURI: options?.voiceId,
        rate: options?.rate,
        pitch: options?.pitch,
        volume: options?.volume,
      });
    }
  }

  public stop() {
    this.webSpeechTTS.stop();
    this.elevenlabsTTS.stop();
    this.azureTTS.stop();
  }

  public pause() {
    if (this.activeProvider === 'elevenlabs') {
      this.elevenlabsTTS.pause();
    } else if (this.activeProvider === 'azure') {
      this.azureTTS.pause();
    } else {
      this.webSpeechTTS.pause();
    }
  }

  public resume() {
    if (this.activeProvider === 'elevenlabs') {
      this.elevenlabsTTS.resume();
    } else if (this.activeProvider === 'azure') {
      this.azureTTS.resume();
    } else {
      this.webSpeechTTS.resume();
    }
  }

  public isAvailable(): boolean {
    return this.webSpeechTTS.isAvailable() || this.elevenlabsTTS.isAvailable() || this.azureTTS.isAvailable();
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      activeProvider: this.activeProvider,
      elevenLabsAvailable: this.elevenlabsTTS.isAvailable(),
      azureAvailable: this.azureTTS.isAvailable(),
      browserTTSAvailable: this.webSpeechTTS.isAvailable()
    };
  }
} 
