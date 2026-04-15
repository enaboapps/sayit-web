import { BaseTTSCallbacks } from './tts-types';

interface WebSpeechCallbacks extends BaseTTSCallbacks {
  onVoicesChanged?: (voices: SpeechSynthesisVoice[]) => void;
  onWordBoundary?: (word: string, charIndex: number) => void;
}

export class TextToSpeech {
  private static instance: TextToSpeech;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private callbacks: WebSpeechCallbacks = {};

  private constructor() {
    // Private constructor to enforce singleton pattern
    if (typeof window !== 'undefined') {
      this.loadVoices();
    }
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    // Try to load voices immediately
    this.updateVoices();

    // Set up event listener for when voices are loaded
    window.speechSynthesis.onvoiceschanged = () => this.updateVoices();
  }

  private updateVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      this.voices = availableVoices;
      this.callbacks.onVoicesChanged?.(this.voices);
    }
  }

  public setCallbacks(callbacks: WebSpeechCallbacks) {
    this.callbacks = callbacks;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getVoiceByURI(voiceURI: string): SpeechSynthesisVoice | undefined {
    return this.voices.find(voice => voice.voiceURI === voiceURI);
  }

  public refreshVoices() {
    this.updateVoices();
  }

  public speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceURI?: string;
  }) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    this.refreshVoices();

    // Stop any ongoing speech
    this.stop();

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);

    // Apply options if provided
    if (options) {
      if (options.rate) this.utterance.rate = options.rate;
      if (options.pitch) this.utterance.pitch = options.pitch;
      if (options.volume) this.utterance.volume = options.volume;
      if (options.voiceURI) {
        const voice = this.getVoiceByURI(options.voiceURI);
        if (voice) {
          this.utterance.voice = voice;
        }
      }
    }

    // Set up event listeners
    this.utterance.onstart = () => {
      this.isSpeaking = true;
      this.callbacks.onStart?.();
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      this.callbacks.onEnd?.();
    };

    this.utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.callbacks.onError?.(new Error(`Speech synthesis error: ${event.error}`));
    };

    this.utterance.onboundary = (event) => {
      if (event.name === 'word' && this.callbacks.onWordBoundary) {
        const word = text.substring(event.charIndex, event.charIndex + event.charLength);
        this.callbacks.onWordBoundary(word, event.charIndex);
      }
    };

    // Speak
    window.speechSynthesis.speak(this.utterance);
  }

  public stop() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.callbacks.onEnd?.();
    }
  }

  public pause() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}
