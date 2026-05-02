import { TextToSpeech as WebSpeechTTS } from './tts';
import { BaseTTSCallbacks } from './tts-types';
import { CloudTTSLifecycle } from './cloud-tts-lifecycle';

export interface AzureVoice {
  voice_id: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}

/**
 * Azure Cognitive Services TTS provider.
 *
 * Follows the same singleton + session-cancellation pattern as ElevenLabsTTS.
 * Audio is fetched via the /api/azure/tts server-side proxy (keeps credentials
 * server-side) and played back via a Blob URL.
 */
export class AzureTTS {
  private static instance: AzureTTS;
  private voices: AzureVoice[] = [];
  private isAvailableFlag: boolean = false;
  private voicesLoaded: boolean = false;
  private loadingVoices: Promise<void> | null = null;
  private fallbackTTS: WebSpeechTTS;
  private lifecycle = new CloudTTSLifecycle();

  private callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: AzureVoice[]) => void } = {};

  private constructor() {
    this.fallbackTTS = WebSpeechTTS.getInstance();
  }

  public static getInstance(): AzureTTS {
    if (!AzureTTS.instance) {
      AzureTTS.instance = new AzureTTS();
    }
    return AzureTTS.instance;
  }

  public async loadVoices() {
    if (typeof window === 'undefined') return;

    if (this.loadingVoices) {
      return this.loadingVoices;
    }

    this.loadingVoices = (async () => {
      try {
        const response = await fetch('/api/azure/voices');
        const data = await response.json();

        this.voices = (data?.voices ?? []).map((v: AzureVoice) => ({
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
        console.error('Error loading Azure voices:', error);
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

  public setCallbacks(callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: AzureVoice[]) => void }) {
    this.callbacks = callbacks;

    this.fallbackTTS.setCallbacks({
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError,
    });
  }

  public getVoices(): AzureVoice[] {
    return this.voices;
  }

  public async speak(text: string, options?: {
    voiceId?: string;
  }) {
    const session = this.lifecycle.beginSession(this.callbacks);

    // Load voices if needed
    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }

      if (!session.isActive()) return;

      if (!this.isAvailableFlag) {
        console.warn('Azure TTS is not available, falling back to browser TTS');
        this.fallbackTTS.speak(text);
        return;
      }
    }

    // Resolve voice ID
    let voiceId = options?.voiceId;
    const voiceExists = voiceId && this.voices.some(v => v.voice_id === voiceId);
    if (!voiceExists) {
      voiceId = this.voices.length > 0 ? this.voices[0].voice_id : undefined;
    }

    try {
      this.lifecycle.markStarted(this.callbacks);

      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }

      const response = await fetch('/api/azure/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
        signal: session.signal,
      });

      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }

      if (!response.ok) {
        throw new Error(`Azure TTS API request failed: ${response.statusText}`);
      }

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

      console.error('Azure TTS error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.fallbackTTS.speak(text);
    }
  }

  public stop() {
    this.lifecycle.stop(this.callbacks);
  }

  public pause() {
    this.lifecycle.pause();
  }

  public resume() {
    this.lifecycle.resume(this.callbacks, 'Error resuming Azure audio:');
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
