import { TextToSpeech as WebSpeechTTS } from './tts';
import { ElevenLabsClient } from 'elevenlabs';
import type { Voice as ElevenLabsVoice } from 'elevenlabs/api';

// Define interfaces for our types
export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  [key: string]: any;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export class ElevenLabsTTS {
  private static instance: ElevenLabsTTS;
  private apiKey: string;
  private voices: Voice[] = [];
  private audio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private fallbackTTS: WebSpeechTTS;
  private elevenLabsClient: ElevenLabsClient | null = null;
  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: Voice[]) => void;
  } = {};

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.fallbackTTS = WebSpeechTTS.getInstance();
    this.apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
    
    if (this.apiKey) {
      this.elevenLabsClient = new ElevenLabsClient({ 
        apiKey: this.apiKey 
      });
      
      if (typeof window !== 'undefined') {
        this.loadVoices();
      }
    }
  }

  public static getInstance(): ElevenLabsTTS {
    if (!ElevenLabsTTS.instance) {
      ElevenLabsTTS.instance = new ElevenLabsTTS();
    }
    return ElevenLabsTTS.instance;
  }

  private async loadVoices() {
    if (!this.elevenLabsClient) return;

    try {
      const response = await this.elevenLabsClient.voices.getAll();
      
      // Map voices to our format
      this.voices = response.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name || 'Unnamed Voice', // Ensure name is never undefined
        preview_url: voice.preview_url,
        description: voice.description || ''
      }));
      
      this.callbacks.onVoicesChanged?.(this.voices);
    } catch (error) {
      console.error('Error loading ElevenLabs voices:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: Voice[]) => void;
  }) {
    this.callbacks = callbacks;
    
    // Also set callbacks for fallback TTS
    this.fallbackTTS.setCallbacks({
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError
    });
  }

  public getVoices(): Voice[] {
    return this.voices;
  }

  public getVoiceById(voiceId: string): Voice | undefined {
    return this.voices.find(voice => voice.voice_id === voiceId);
  }

  public async speak(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
  }) {
    if (!this.apiKey || !this.elevenLabsClient) {
      console.warn('ElevenLabs API key not found, falling back to browser TTS');
      this.fallbackTTS.speak(text);
      return;
    }

    // Stop any ongoing speech
    this.stop();

    // Voice ID handling
    let voiceId = options?.voiceId;
    
    // Check if the voice ID exists in available voices
    const voiceExists = voiceId && this.voices.some(v => v.voice_id === voiceId);
    
    // If no valid voice ID, use the first available voice or default to Rachel
    if (!voiceExists) {
      if (this.voices.length > 0) {
        voiceId = this.voices[0].voice_id;
        console.log(`Using first available voice: ${voiceId} (${this.voices[0].name})`);
      } else {
        voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
        console.log(`Using default Rachel voice: ${voiceId}`);
      }
    } else {
      console.log(`Using selected voice: ${voiceId}`);
    }
    
    const stability = options?.stability ?? 0.5;
    const similarityBoost = options?.similarityBoost ?? 0.5;

    try {
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      console.log('ElevenLabs speaking with voice ID:', voiceId);
      
      // Generate audio with ElevenLabs SDK
      const audioData = await this.elevenLabsClient.generate({
        voice: voiceId,
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      });

      // Create blob from the audio data (handle different return types)
      let audioBlob: Blob;
      if (audioData instanceof Blob) {
        audioBlob = audioData;
      } else if (audioData instanceof ArrayBuffer) {
        audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      } else {
        // If it's a readable stream or other format, convert to Buffer then Blob
        const chunks: Uint8Array[] = [];
        for await (const chunk of audioData) {
          chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audio = new Audio(audioUrl);
      
      this.audio.onended = () => {
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
        if (this.audio) {
          URL.revokeObjectURL(this.audio.src);
        }
      };

      this.audio.onerror = (event) => {
        this.isSpeaking = false;
        this.callbacks.onError?.(new Error(`Audio playback error: ${event}`));
        if (this.audio) {
          URL.revokeObjectURL(this.audio.src);
        }
      };

      await this.audio.play();
    } catch (error) {
      this.isSpeaking = false;
      console.error('ElevenLabs TTS error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Fall back to browser TTS on error
      this.fallbackTTS.speak(text);
    }
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      URL.revokeObjectURL(this.audio.src);
      this.audio = null;
    }
    
    this.isSpeaking = false;
    this.callbacks.onEnd?.();
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public resume() {
    if (this.audio) {
      this.audio.play().catch(error => {
        console.error('Error resuming audio:', error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  public isAvailable(): boolean {
    return !!this.apiKey && !!this.elevenLabsClient;
  }
} 