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
  private fallbackTTS: WebSpeechTTS;
  private abortController: AbortController | null = null;
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
      if (this.voices.length > 0) {
        voiceId = this.voices[0].voice_id;
        console.log(`Using first available voice: ${voiceId} (${this.voices[0].name})`);
      } else {
        voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default voice - Rachel
        console.log(`Using default Rachel voice: ${voiceId}`);
      }
    } else {
      console.log(`Using selected voice: ${voiceId}`);
    }

    const stability = options?.stability ?? 0.5;
    const similarityBoost = options?.similarityBoost ?? 0.5;
    // Enable streaming by default
    const useStreaming = options?.streaming ?? true;

    console.log(`ElevenLabs TTS settings - Stability: ${stability}, Similarity Boost: ${similarityBoost}, Streaming: ${useStreaming}`);

    try {
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      console.log('ElevenLabs speaking with voice ID:', voiceId);

      // Check if request was aborted before making API call
      if (this.abortController?.signal.aborted) {
        console.log('Speech request was aborted before API call');
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

      // Check if request was aborted after API call
      if (this.abortController?.signal.aborted) {
        console.log('Speech request was aborted after API call');
        return;
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      if (useStreaming && response.body) {
        // Streaming playback using MediaSource API
        await this.playStreamingAudio(response.body);
      } else {
        // Non-streaming fallback
        await this.playBufferedAudio(response);
      }
    } catch (error) {
      this.isSpeaking = false;

      // Don't log or fallback if the request was intentionally aborted
      const err = error as Error & { name?: string };
      if (err?.name === 'AbortError' || this.abortController?.signal.aborted) {
        console.log('Speech request was cancelled');
        return;
      }

      // Check if this is a rapid request (within 2 seconds of last request)
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const isRapidRequest = timeSinceLastRequest < 2000;

      console.error('ElevenLabs TTS error:', error);

      // Only show error and fallback if this isn't a rapid request
      if (!isRapidRequest) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        // Fall back to browser TTS on error
        this.fallbackTTS.speak(text);
      } else {
        console.log('Skipping fallback due to rapid request');
      }
    }
  }

  private async playStreamingAudio(body: ReadableStream<Uint8Array>) {
    // Check if MediaSource is supported
    if (!('MediaSource' in window) || !MediaSource.isTypeSupported('audio/mpeg')) {
      console.log('MediaSource not supported, falling back to buffered playback');
      // Collect all chunks and play as blob
      const reader = body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      this.audio.onended = () => {
        this.isSpeaking = false;
        this.callbacks.onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };

      this.audio.onerror = (event) => {
        this.isSpeaking = false;
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
    let sourceBuffer: SourceBuffer | null = null;
    const pendingChunks: Uint8Array[] = [];
    let isAppending = false;

    const appendNextChunk = () => {
      if (!sourceBuffer || isAppending || pendingChunks.length === 0) return;
      if (sourceBuffer.updating) return;

      isAppending = true;
      const chunk = pendingChunks.shift()!;
      try {
        // Create a new ArrayBuffer from the Uint8Array to satisfy TypeScript
        const buffer = new ArrayBuffer(chunk.length);
        new Uint8Array(buffer).set(chunk);
        sourceBuffer.appendBuffer(buffer);
      } catch (e) {
        console.error('Error appending buffer:', e);
        isAppending = false;
      }
    };

    mediaSource.addEventListener('sourceopen', async () => {
      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

        sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          appendNextChunk();
        });

        // Start reading the stream
        let streamEnded = false;

        const readStream = async () => {
          while (true) {
            if (this.abortController?.signal.aborted) {
              break;
            }

            const { done, value } = await reader.read();

            if (done) {
              streamEnded = true;
              // Wait for all pending chunks to be appended
              const waitForBuffers = () => {
                if (pendingChunks.length === 0 && !isAppending && sourceBuffer && !sourceBuffer.updating) {
                  if (mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                  }
                } else {
                  setTimeout(waitForBuffers, 50);
                }
              };
              waitForBuffers();
              break;
            }

            if (value) {
              pendingChunks.push(value);
              appendNextChunk();
            }
          }
        };

        readStream();

        // Start playback as soon as we have some data
        this.audio!.play().catch(e => {
          console.error('Error starting playback:', e);
        });

      } catch (e) {
        console.error('Error setting up MediaSource:', e);
        this.callbacks.onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    });

    this.audio.onended = () => {
      this.isSpeaking = false;
      this.callbacks.onEnd?.();
      URL.revokeObjectURL(audioUrl);
    };

    this.audio.onerror = (event) => {
      this.isSpeaking = false;
      this.callbacks.onError?.(new Error(`Audio playback error: ${event}`));
      URL.revokeObjectURL(audioUrl);
    };
  }

  private async playBufferedAudio(response: Response) {
    // Get the audio data as a blob
    const audioBlob = await response.blob();

    // Final check before playing
    if (this.abortController?.signal.aborted) {
      console.log('Speech request was aborted before playback');
      return;
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
  }

  public stop() {
    // Abort any ongoing API requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.audio) {
      // Remove event listeners to prevent callbacks after stopping
      this.audio.onended = null;
      this.audio.onerror = null;

      this.audio.pause();
      this.audio.currentTime = 0;

      // Ensure the audio source is properly cleaned up
      const audioSrc = this.audio.src;
      this.audio.src = '';

      // Clean up the blob URL
      if (audioSrc && audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }

      this.audio = null;
    }

    this.isSpeaking = false;
    // Don't call onEnd callback here as this is a manual stop
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
