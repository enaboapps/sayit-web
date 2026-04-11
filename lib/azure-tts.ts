import { TextToSpeech as WebSpeechTTS } from './tts';

export interface AzureVoice {
  voice_id: string;
  name: string;
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
  private audio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private isAvailableFlag: boolean = false;
  private voicesLoaded: boolean = false;
  private loadingVoices: Promise<void> | null = null;
  private currentSessionId: number = 0;
  private abortController: AbortController | null = null;
  private lastRequestTime: number = 0;
  private fallbackTTS: WebSpeechTTS;

  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: AzureVoice[]) => void;
  } = {};

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

  public setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onVoicesChanged?: (voices: AzureVoice[]) => void;
  }) {
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
    rate?: number;
    pitch?: number;
    volume?: number;
  }) {
    this.stop();

    this.currentSessionId++;
    const sessionId = this.currentSessionId;
    const isSessionActive = () => sessionId === this.currentSessionId;

    const currentTime = Date.now();
    this.lastRequestTime = currentTime;

    this.abortController = new AbortController();

    // Load voices if needed
    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }

      if (!isSessionActive()) return;

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
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      const response = await fetch('/api/azure/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId,
          rate: options?.rate,
          pitch: options?.pitch,
          volume: options?.volume,
        }),
        signal: this.abortController.signal,
      });

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      if (!response.ok) {
        throw new Error(`Azure TTS API request failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      // Call play() immediately (before any await) to stay within the user gesture window
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

      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const isRapidRequest = timeSinceLastRequest < 2000;

      console.error('Azure TTS error:', error);

      if (!isRapidRequest) {
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
        console.error('Error resuming Azure audio:', error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  public isAvailable(): boolean {
    return this.isAvailableFlag;
  }
}
