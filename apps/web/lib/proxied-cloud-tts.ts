import { TextToSpeech as WebSpeechTTS } from './tts';
import type { BaseTTSCallbacks, CloudTTSClient, CloudTTSSpeakOptions, CloudVoice } from './tts-types';
import { CloudTTSLifecycle } from './cloud-tts-lifecycle';

export interface ProxiedCloudTTSConfig {
  // Used in log messages, such as "Azure".
  name: string;
  // Server routes that return { voices, available } and the audio for { text, voiceId }.
  voicesPath: string;
  ttsPath: string;
}

/**
 * A cloud voice provider whose server routes only need text and a voice
 * (Azure, Gemini). Audio comes from the provider's server-side proxy route,
 * so keys never reach the browser, and plays through CloudTTSLifecycle.
 *
 * Providers with their own options (ElevenLabs) have their own class with
 * the same public methods.
 */
export class ProxiedCloudTTS implements CloudTTSClient {
  private voices: CloudVoice[] = [];
  private isAvailableFlag = false;
  private voicesLoaded = false;
  private loadingVoices: Promise<void> | null = null;
  private fallbackTTS: WebSpeechTTS;
  private lifecycle = new CloudTTSLifecycle();

  private callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: CloudVoice[]) => void } = {};

  protected constructor(private readonly config: ProxiedCloudTTSConfig) {
    this.fallbackTTS = WebSpeechTTS.getInstance();
  }

  public async loadVoices() {
    if (typeof window === 'undefined') return;

    if (this.loadingVoices) {
      return this.loadingVoices;
    }

    this.loadingVoices = (async () => {
      try {
        const response = await fetch(this.config.voicesPath);
        const data = await response.json();

        this.voices = (data?.voices ?? []).map((v: CloudVoice) => ({
          voice_id: v.voice_id,
          name: v.name || 'Unnamed Voice',
          ...(v.style !== undefined ? { style: v.style } : {}),
          gender: v.gender,
          languageCodes: v.languageCodes,
        }));

        this.isAvailableFlag = data?.available ?? this.voices.length > 0;
        this.callbacks.onVoicesChanged?.(this.voices);
      } catch (error) {
        this.isAvailableFlag = false;
        this.voices = [];
        this.callbacks.onVoicesChanged?.(this.voices);
        console.error(`Error loading ${this.config.name} voices:`, error);
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

  public setCallbacks(callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: CloudVoice[]) => void }) {
    this.callbacks = callbacks;

    this.fallbackTTS.setCallbacks({
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError,
    });
  }

  public getVoices(): CloudVoice[] {
    return this.voices;
  }

  public async speak(text: string, options?: CloudTTSSpeakOptions) {
    const session = this.lifecycle.beginSession(this.callbacks);

    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }

      if (!session.isActive()) return;

      if (!this.isAvailableFlag) {
        console.warn(`${this.config.name} TTS is not available, falling back to browser TTS`);
        this.fallbackTTS.speak(text);
        return;
      }
    }

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

      const response = await fetch(this.config.ttsPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, ...(options?.liveTyping ? { liveTyping: options.liveTyping } : {}) }),
        signal: session.signal,
      });

      if (!session.isActive()) {
        this.lifecycle.markInactive();
        return;
      }

      if (!response.ok) {
        throw new Error(`${this.config.name} TTS API request failed: ${response.statusText}`);
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

      console.error(`${this.config.name} TTS error:`, error);
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
    this.lifecycle.resume(this.callbacks, `Error resuming ${this.config.name} audio:`);
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
