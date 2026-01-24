import { TextToSpeech as WebSpeechTTS } from './tts';

// Define interfaces for our types
export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  private currentSessionId: number = 0;  // Incremented each speak()/stop(), async ops check this
  private fallbackTTS: WebSpeechTTS;
  private abortController: AbortController | null = null;
  private activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private lastRequestTime: number = 0;
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

    if (this.apiKey && typeof window !== 'undefined') {
      this.loadVoices();
    }
  }

  public static getInstance(): ElevenLabsTTS {
    if (!ElevenLabsTTS.instance) {
      ElevenLabsTTS.instance = new ElevenLabsTTS();
    }
    return ElevenLabsTTS.instance;
  }

  private async loadVoices() {
    if (!this.apiKey) return;

    try {
      // Call ElevenLabs API directly to get voices
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.statusText}`);
      }

      const data = await response.json();

      // Map voices to our format
      this.voices = data.voices.map((voice: Voice) => ({
        voice_id: voice.voice_id,
        name: voice.name || 'Unnamed Voice',
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
    streaming?: boolean;
  }) {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found, falling back to browser TTS');
      this.fallbackTTS.speak(text);
      return;
    }

    // Stop any ongoing speech and API requests
    this.stop();

    // Increment session ID - all async operations will check against this
    this.currentSessionId++;
    const sessionId = this.currentSessionId;

    // Helper to check if this session is still active
    const isSessionActive = () => sessionId === this.currentSessionId;

    // Track request timing
    const currentTime = Date.now();
    this.lastRequestTime = currentTime;

    // Create a new abort controller for this request
    this.abortController = new AbortController();

    // Voice ID handling
    let voiceId = options?.voiceId;

    // Check if the voice ID exists in available voices
    const voiceExists = voiceId && this.voices.some(v => v.voice_id === voiceId);

    // If no valid voice ID, use the first available voice or default to Rachel
    if (!voiceExists) {
      voiceId = this.voices.length > 0
        ? this.voices[0].voice_id
        : '21m00Tcm4TlvDq8ikWAM'; // Default voice - Rachel
    }

    const stability = options?.stability ?? 0.5;
    const similarityBoost = options?.similarityBoost ?? 0.5;
    const useStreaming = options?.streaming ?? true;

    try {
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      // Check if session was cancelled before making API call
      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      // Call our Next.js API route with Flash v2.5 model
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceId: voiceId,
          stability: stability,
          similarityBoost: similarityBoost,
          streaming: useStreaming,
        }),
        signal: this.abortController.signal,
      });

      // Check if session was cancelled
      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      if (useStreaming && response.body) {
        // Streaming playback using MediaSource API
        await this.playStreamingAudio(response.body, isSessionActive);
      } else {
        // Non-streaming fallback
        await this.playBufferedAudio(response, isSessionActive);
      }
    } catch (error) {
      this.isSpeaking = false;

      // Don't log or fallback if session was cancelled
      if (!isSessionActive()) {
        return;
      }

      // Also check for AbortError
      const err = error as Error & { name?: string };
      if (err?.name === 'AbortError') {
        return;
      }

      // Check if this is a rapid request (within 2 seconds of last request)
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const isRapidRequest = timeSinceLastRequest < 2000;

      console.error('ElevenLabs TTS error:', error);

      // Only show error and fallback if this isn't a rapid request
      if (!isRapidRequest) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        this.fallbackTTS.speak(text);
      }
    }
  }

  private async playStreamingAudio(body: ReadableStream<Uint8Array>, isSessionActive: () => boolean) {
    // Fallback for browsers without MediaSource support
    if (!('MediaSource' in window) || !MediaSource.isTypeSupported('audio/mpeg')) {
      // Collect all chunks and play as blob
      const reader = body.getReader();
      this.activeReader = reader;
      const chunks: Uint8Array[] = [];

      try {
        while (true) {
          if (!isSessionActive()) return;
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } catch (error) {
        if (!isSessionActive()) return;
        throw error;
      }

      if (!isSessionActive()) return;

      const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      this.audio.onended = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        this.activeReader = null;
        this.callbacks.onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };

      this.audio.onerror = (event) => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        this.activeReader = null;
        this.callbacks.onError?.(new Error(`Audio playback error: ${event}`));
        URL.revokeObjectURL(audioUrl);
      };

      await this.audio.play();
      return;
    }

    // Use MediaSource for streaming playback
    const mediaSource = new MediaSource();
    const audioUrl = URL.createObjectURL(mediaSource);
    this.audio = new Audio(audioUrl);

    const reader = body.getReader();
    this.activeReader = reader;
    let sourceBuffer: SourceBuffer | null = null;
    const pendingChunks: Uint8Array[] = [];
    let isAppending = false;

    const appendNextChunk = () => {
      // Don't append if session is no longer active
      if (!isSessionActive()) return;
      if (!sourceBuffer || isAppending || pendingChunks.length === 0) return;
      if (sourceBuffer.updating) return;
      if (mediaSource.readyState !== 'open') return;

      isAppending = true;
      const chunk = pendingChunks.shift()!;

      // Double-check session is still active
      if (!isSessionActive() || mediaSource.readyState !== 'open') {
        isAppending = false;
        return;
      }

      try {
        const buffer = chunk.slice().buffer;
        sourceBuffer.appendBuffer(buffer);
      } catch {
        // Silently ignore errors - expected when session ends
        isAppending = false;
      }
    };

    mediaSource.addEventListener('sourceopen', async () => {
      if (!isSessionActive()) return;

      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

        sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          if (isSessionActive()) {
            appendNextChunk();
          }
        });

        const readStream = async () => {
          try {
            while (true) {
              if (!isSessionActive()) return;

              const { done, value } = await reader.read();

              if (done) {
                // Wait for all pending chunks to be appended
                const waitForBuffers = () => {
                  if (!isSessionActive()) return;
                  if (pendingChunks.length === 0 && !isAppending && sourceBuffer && !sourceBuffer.updating) {
                    if (mediaSource.readyState === 'open') {
                      try {
                        mediaSource.endOfStream();
                      } catch {
                        // Ignore - MediaSource may be closed
                      }
                    }
                  } else {
                    setTimeout(waitForBuffers, 50);
                  }
                };
                waitForBuffers();
                break;
              }

              if (value && isSessionActive()) {
                pendingChunks.push(value);
                appendNextChunk();
              }
            }
          } catch (error) {
            if (!isSessionActive()) return;
            console.error('Error reading stream:', error);
          }
        };

        readStream();

        // Start playback
        if (isSessionActive() && this.audio) {
          this.audio.play().catch(e => {
            if (isSessionActive()) {
              console.error('Error starting playback:', e);
            }
          });
        }

      } catch (e) {
        if (!isSessionActive()) return;
        console.error('Error setting up MediaSource:', e);
        this.callbacks.onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    });

    this.audio.onended = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      this.activeReader = null;
      this.callbacks.onEnd?.();
      URL.revokeObjectURL(audioUrl);
    };

    this.audio.onerror = (event) => {
      this.isSpeaking = false;
      this.activeReader = null;
      this.callbacks.onError?.(new Error(`Audio playback error: ${event}`));
      URL.revokeObjectURL(audioUrl);
    };
  }

  private async playBufferedAudio(response: Response, isSessionActive: () => boolean) {
    // Get the audio data as a blob
    let audioBlob: Blob;
    try {
      audioBlob = await response.blob();
    } catch (error) {
      if (!isSessionActive()) return;
      throw error;
    }

    if (!isSessionActive()) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(audioUrl);

    this.audio.onended = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      this.callbacks.onEnd?.();
      if (this.audio) {
        URL.revokeObjectURL(this.audio.src);
      }
    };

    this.audio.onerror = (event) => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      this.callbacks.onError?.(new Error(`Audio playback error: ${event}`));
      if (this.audio) {
        URL.revokeObjectURL(this.audio.src);
      }
    };

    await this.audio.play();
  }

  public stop() {
    // Increment session ID - this invalidates all running async operations
    // They will check isSessionActive() and exit gracefully
    this.currentSessionId++;

    // Clear references
    this.activeReader = null;
    this.abortController = null;

    if (this.audio) {
      // Remove event listeners to prevent callbacks after stopping
      this.audio.onended = null;
      this.audio.onerror = null;

      // Pause playback
      this.audio.pause();

      // Delay cleanup to let async operations notice the session change
      const audioToClean = this.audio;
      setTimeout(() => {
        if (audioToClean) {
          const audioSrc = audioToClean.src;
          audioToClean.src = '';
          if (audioSrc && audioSrc.startsWith('blob:')) {
            URL.revokeObjectURL(audioSrc);
          }
        }
      }, 100);

      this.audio = null;
    }

    const wasSpeaking = this.isSpeaking;
    this.isSpeaking = false;

    // Call onEnd callback to update UI state
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
        console.error('Error resuming audio:', error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  public isAvailable(): boolean {
    return !!this.apiKey;
  }
}
