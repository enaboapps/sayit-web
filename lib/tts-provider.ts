import { ElevenLabsTTS } from './elevenlabs-tts';
import { TextToSpeech as WebSpeechTTS } from './tts';

export type TTSProviderType = 'browser' | 'elevenlabs';

export interface TTSVoice {
  id: string;
  name: string;
  provider: TTSProviderType;
}

// Unified class that can use either provider
export class TTSProvider {
  private static instance: TTSProvider;
  private elevenlabsTTS: ElevenLabsTTS;
  private webSpeechTTS: WebSpeechTTS;
  private activeProvider: TTSProviderType = 'browser';
  private isSpeaking: boolean = false;
  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: TTSVoice[]) => void;
  } = {};

  private constructor() {
    this.webSpeechTTS = WebSpeechTTS.getInstance();
    this.elevenlabsTTS = ElevenLabsTTS.getInstance();
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
      }
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
        // Notify that voices have changed
        this.callbacks.onVoicesChanged?.(this.getAllVoices());
      }
    });
  }

  public setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: TTSVoice[]) => void;
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
    
    if (provider === 'elevenlabs' && !this.elevenlabsTTS.isAvailable()) {
      console.warn('ElevenLabs is not available, staying with browser TTS');
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
      metadata: {
        preview_url: voice.preview_url,
        description: voice.description || 'ElevenLabs voice'
      }
    }));

    const allVoices = [...browserVoices, ...elevenLabsVoices];
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

  public speak(text: string, options?: {
    voiceId?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    stability?: number;
    similarityBoost?: number;
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
    
    if (provider === 'elevenlabs' && this.elevenlabsTTS.isAvailable()) {
      // Get all available voices
      const allVoices = this.getAllVoices();
      
      // Find the selected ElevenLabs voice
      const selectedElevenLabsVoice = allVoices.find(v => 
        v.id === options?.voiceId && v.provider === 'elevenlabs'
      );
      
      // Log for debugging
      console.log('Selected ElevenLabs voice:', selectedElevenLabsVoice);
      console.log('Voice settings - stability:', options?.stability, 'similarityBoost:', options?.similarityBoost);
      
      // If no voice was found, get the first available ElevenLabs voice
      const voiceToUse = selectedElevenLabsVoice?.id || 
        allVoices.find(v => v.provider === 'elevenlabs')?.id;
      
      console.log('Using ElevenLabs voice ID:', voiceToUse);

      this.elevenlabsTTS.speak(text, {
        voiceId: voiceToUse,
        stability: options?.stability,
        similarityBoost: options?.similarityBoost
      });
    } else {
      this.webSpeechTTS.speak(text, {
        voiceURI: options?.voiceId,
        rate: options?.rate,
        pitch: options?.pitch,
        volume: options?.volume
      });
    }
  }

  public stop() {
    this.webSpeechTTS.stop();
    this.elevenlabsTTS.stop();
  }

  public pause() {
    if (this.activeProvider === 'elevenlabs') {
      this.elevenlabsTTS.pause();
    } else {
      this.webSpeechTTS.pause();
    }
  }

  public resume() {
    if (this.activeProvider === 'elevenlabs') {
      this.elevenlabsTTS.resume();
    } else {
      this.webSpeechTTS.resume();
    }
  }

  public isAvailable(): boolean {
    return this.webSpeechTTS.isAvailable() || this.elevenlabsTTS.isAvailable();
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      activeProvider: this.activeProvider,
      elevenLabsAvailable: this.elevenlabsTTS.isAvailable(),
      browserTTSAvailable: this.webSpeechTTS.isAvailable()
    };
  }
} 
