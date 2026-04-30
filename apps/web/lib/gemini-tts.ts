import { TextToSpeech as WebSpeechTTS } from './tts';
import { BaseTTSCallbacks } from './tts-types';

export interface GeminiVoice {
  voice_id: string;
  name: string;
  style: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}

/**
 * Gemini TTS provider.
 *
 * Audio is fetched through the /api/gemini/tts server-side proxy so GEMINI_API_KEY
 * is never exposed to the browser.
 */
export class GeminiTTS {
  private static instance: GeminiTTS;
  private voices: GeminiVoice[] = [];
  private audio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private isAvailableFlag: boolean = false;
  private voicesLoaded: boolean = false;
  private loadingVoices: Promise<void> | null = null;
  private currentSessionId: number = 0;
  private abortController: AbortController | null = null;
  private fallbackTTS: WebSpeechTTS;

  private callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: GeminiVoice[]) => void } = {};

  private constructor() {
    this.fallbackTTS = WebSpeechTTS.getInstance();
  }

  public static getInstance(): GeminiTTS {
    if (!GeminiTTS.instance) {
      GeminiTTS.instance = new GeminiTTS();
    }
    return GeminiTTS.instance;
  }

  public async loadVoices() {
    if (typeof window === 'undefined') return;

    if (this.loadingVoices) {
      return this.loadingVoices;
    }

    this.loadingVoices = (async () => {
      try {
        const response = await fetch('/api/gemini/voices');
        const data = await response.json();

        this.voices = (data?.voices ?? []).map((v: GeminiVoice) => ({
          voice_id: v.voice_id,
          name: v.name || 'Unnamed Voice',
          style: v.style,
          gender: v.gender,
          languageCodes: v.languageCodes,
        }));

        this.isAvailableFlag = data?.available ?? this.voices.length > 0;
        this.callbacks.onVoicesChanged?.(this.voices);
      } catch (error) {
        this.isAvailableFlag = false;
        this.voices = [];
        this.callbacks.onVoicesChanged?.(this.voices);
        console.error('Error loading Gemini voices:', error);
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

  public setCallbacks(callbacks: BaseTTSCallbacks & { onVoicesChanged?: (voices: GeminiVoice[]) => void }) {
    this.callbacks = callbacks;

    this.fallbackTTS.setCallbacks({
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError,
    });
  }

  public getVoices(): GeminiVoice[] {
    return this.voices;
  }

  public async speak(text: string, options?: {
    voiceId?: string;
  }) {
    this.stop();

    this.currentSessionId++;
    const sessionId = this.currentSessionId;
    const isSessionActive = () => sessionId === this.currentSessionId;

    this.abortController = new AbortController();

    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }

      if (!isSessionActive()) return;

      if (!this.isAvailableFlag) {
        console.warn('Gemini TTS is not available, falling back to browser TTS');
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
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
        signal: this.abortController.signal,
      });

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      if (!response.ok) {
        throw new Error(`Gemini TTS API request failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      const playPromise = this.audio.play();

      this.audio.onended = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };

      this.audio.onerror = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        const mediaError = this.audio?.error;
        const message = mediaError
          ? `Audio playback error (code ${mediaError.code}): ${mediaError.message}`
          : 'Audio playback error';
        this.callbacks.onError?.(new Error(message));
        URL.revokeObjectURL(audioUrl);
      };

      await playPromise;
    } catch (error) {
      this.isSpeaking = false;

      if (!isSessionActive()) return;

      const err = error as Error & { name?: string };
      if (err?.name === 'AbortError') return;

      console.error('Gemini TTS error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.fallbackTTS.speak(text);
    }
  }

  public stop() {
    this.currentSessionId++;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();

      const audioToClean = this.audio;
      setTimeout(() => {
        const audioSrc = audioToClean.src;
        audioToClean.src = '';
        if (audioSrc && audioSrc.startsWith('blob:')) {
          URL.revokeObjectURL(audioSrc);
        }
      }, 100);

      this.audio = null;
    }

    const wasSpeaking = this.isSpeaking;
    this.isSpeaking = false;

    if (wasSpeaking) {
      this.callbacks.onEnd?.();
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public resume() {
    if (this.audio) {
      this.audio.play().catch(error => {
        console.error('Error resuming Gemini audio:', error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
