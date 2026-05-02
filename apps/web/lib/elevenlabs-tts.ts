import { CloudTTSLifecycle } from './cloud-tts-lifecycle';
import { TextToSpeech as WebSpeechTTS } from './tts';
import { BaseTTSCallbacks } from './tts-types';

export interface Voice {
  voice_id: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}

/**
 * ElevenLabs Text-to-Speech Provider.
 *
 * Fetches audio from the server-side proxy route (/api/text-to-speech) and
 * delegates browser audio/session handling to CloudTTSLifecycle.
 */
export class ElevenLabsTTS {
  private static instance: ElevenLabsTTS;
  private voices: Voice[] = [];
  private isAvailableFlag = false;
  private voicesLoaded = false;
  private loadingVoices: Promise<void> | null = null;
  private fallbackTTS: WebSpeechTTS;
  private lifecycle = new CloudTTSLifecycle();
  private lastRequestTime = 0;

  private callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: Voice[]) => void } = {};

  private constructor() {
    this.fallbackTTS = WebSpeechTTS.getInstance();
  }

  public static getInstance(): ElevenLabsTTS {
    if (!ElevenLabsTTS.instance) {
      ElevenLabsTTS.instance = new ElevenLabsTTS();
    }
    return ElevenLabsTTS.instance;
  }

  public async loadVoices() {
    if (typeof window === 'undefined') return;
    if (this.loadingVoices) return this.loadingVoices;

    this.loadingVoices = (async () => {
      try {
        const response = await fetch('/api/elevenlabs/voices');
        const data = await response.json();
        this.voices = (data?.voices ?? []).map((v: Voice) => ({
          voice_id: v.voice_id,
          name: v.name || 'Unnamed Voice',
          gender: v.gender,
          languageCodes: v.languageCodes,
        }));
        this.isAvailableFlag = data?.available ?? this.voices.length > 0;
        this.callbacks.onVoicesChanged?.(this.voices);
      } catch (error) {
        this.isAvailableFlag = false;
        this.voices = [];
        this.callbacks.onVoicesChanged?.(this.voices);
        console.error('Error loading ElevenLabs voices:', error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        this.voicesLoaded = true;
        this.loadingVoices = null;
      }
    })();

    return this.loadingVoices;
  }

  public hasLoadedVoices(): boolean {
    return this.voicesLoaded;
  }

  public setCallbacks(callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: Voice[]) => void }) {
    this.callbacks = callbacks;
    this.fallbackTTS.setCallbacks({
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError,
    });
  }

  public getVoices(): Voice[] {
    return this.voices;
  }

  public getVoiceById(voiceId: string): Voice | undefined {
    return this.voices.find(v => v.voice_id === voiceId);
  }

  public async speak(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    streaming?: boolean;
    modelId?: string;
  }) {
    const session = this.lifecycle.beginSession(this.callbacks);
    this.lastRequestTime = Date.now();

    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }
      if (!session.isActive()) return;
      if (!this.isAvailableFlag) {
        console.warn('ElevenLabs not available, falling back to browser TTS');
        this.fallbackTTS.speak(text);
        return;
      }
    }

    let voiceId = options?.voiceId;
    const voiceExists = voiceId && this.voices.some(v => v.voice_id === voiceId);
    if (!voiceExists) {
      voiceId = this.voices[0]?.voice_id ?? '21m00Tcm4TlvDq8ikWAM';
    }

    try {
      this.lifecycle.markStarted(this.callbacks);
      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId,
          stability: options?.stability ?? 0.5,
          similarityBoost: options?.similarityBoost ?? 0.5,
          streaming: true,
          modelId: options?.modelId,
        }),
        signal: session.signal,
      });

      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }
      if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

      const blob = await response.blob();
      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }

      await this.lifecycle.playBlob(blob, this.callbacks, session.isActive);
    } catch (error) {
      this.lifecycle.markInactive();
      if (!session.isActive()) return;

      const err = error as Error & { name?: string };
      if (err?.name === 'AbortError') return;

      const isRapid = Date.now() - this.lastRequestTime < 2000;
      console.error('ElevenLabs TTS error:', error);
      if (!isRapid) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        this.fallbackTTS.speak(text);
      }
    }
  }

  public stop() {
    this.lifecycle.stop(this.callbacks);
  }

  public pause() {
    this.lifecycle.pause();
  }

  public resume() {
    this.lifecycle.resume(this.callbacks, 'Error resuming audio:');
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
