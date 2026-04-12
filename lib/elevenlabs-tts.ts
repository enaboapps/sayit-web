import { TextToSpeech as WebSpeechTTS } from './tts';

export interface Voice {
  voice_id: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
}


/**
 * ElevenLabs Text-to-Speech Provider
 *
 * Fetches audio from the server-side proxy route (/api/text-to-speech) and
 * plays it via HTMLAudioElement with Blob URLs. Uses session-based cancellation
 * to safely handle rapid speak/stop sequences.
 */
export class ElevenLabsTTS {
  private static instance: ElevenLabsTTS;
  private voices: Voice[] = [];
  private audio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private isAvailableFlag = false;
  private voicesLoaded = false;
  private loadingVoices: Promise<void> | null = null;

  /**
   * Session ID for cancellation tracking.
   * Incremented on each speak() or stop() call so stale async operations
   * exit gracefully rather than triggering callbacks.
   */
  private currentSessionId = 0;

  private fallbackTTS: WebSpeechTTS;
  private abortController: AbortController | null = null;
  private lastRequestTime = 0;

  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: Voice[]) => void;
  } = {};

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

  public setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: Voice[]) => void;
  }) {
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
    this.stop();

    this.currentSessionId++;
    const sessionId = this.currentSessionId;
    const isSessionActive = () => sessionId === this.currentSessionId;

    this.lastRequestTime = Date.now();
    this.abortController = new AbortController();

    // Load voices if needed
    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }
      if (!isSessionActive()) return;
      if (!this.isAvailableFlag) {
        console.warn('ElevenLabs not available, falling back to browser TTS');
        this.fallbackTTS.speak(text);
        return;
      }
    }

    // Resolve voice ID
    let voiceId = options?.voiceId;
    const voiceExists = voiceId && this.voices.some(v => v.voice_id === voiceId);
    if (!voiceExists) {
      voiceId = this.voices[0]?.voice_id ?? '21m00Tcm4TlvDq8ikWAM'; // Rachel fallback
    }

    try {
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      if (!isSessionActive()) { this.isSpeaking = false; return; }

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
        signal: this.abortController.signal,
      });

      if (!isSessionActive()) { this.isSpeaking = false; return; }
      if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

      // Accumulate streaming response into a blob before playing
      const blob = await response.blob();
      if (!isSessionActive()) { this.isSpeaking = false; return; }

      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      // play() must be called synchronously after Audio() while still in the
      // microtask chain of the user gesture — Chrome's autoplay policy will
      // block it if we set up event handlers first and play() fires too late.
      const playPromise = this.audio.play();

      this.audio.onended = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        this.callbacks.onEnd?.();
      };

      this.audio.onerror = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        const err = this.audio?.error;
        URL.revokeObjectURL(audioUrl);
        this.callbacks.onError?.(
          new Error(err ? `Audio error (${err.code}): ${err.message}` : 'Audio playback error')
        );
      };

      await playPromise;
    } catch (error) {
      this.isSpeaking = false;
      if (!isSessionActive()) return;
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
    this.currentSessionId++;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      const src = this.audio.src;
      const audioEl = this.audio;
      setTimeout(() => {
        audioEl.src = '';
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      }, 100);
      this.audio = null;
    }

    const wasSpeaking = this.isSpeaking;
    this.isSpeaking = false;
    if (wasSpeaking) this.callbacks.onEnd?.();
  }

  public pause() {
    this.audio?.pause();
  }

  public resume() {
    this.audio?.play().catch(err => {
      console.error('Error resuming audio:', err);
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    });
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
