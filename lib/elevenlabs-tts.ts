import { TextToSpeech as WebSpeechTTS } from './tts';

/**
 * ElevenLabs Text-to-Speech Provider
 *
 * This module provides streaming audio playback using the ElevenLabs API with
 * session-based cancellation to handle race conditions from rapid speak/stop calls.
 *
 * ## Architecture Overview
 *
 * ### Session-Based Cancellation
 * Each call to speak() or stop() increments a session ID. All async operations
 * (streaming, buffering, playback) check this ID via isSessionActive() before
 * proceeding. This prevents race conditions when:
 * - User rapidly clicks speak/stop
 * - A new speak() is called before the previous one finishes
 * - stop() is called mid-stream
 *
 * ### Streaming Modes
 * 1. **MediaSource API (preferred)**: Real-time streaming playback for browsers
 *    that support it. Audio chunks are appended to a SourceBuffer as they arrive,
 *    allowing playback to start before the full response is received.
 *
 * 2. **Blob Fallback**: For browsers without MediaSource support. Collects all
 *    chunks into a Blob before playing. Higher latency but better compatibility.
 *
 * ### Cleanup Responsibilities
 * - stop() handles all cleanup: cancels reader, aborts fetch, revokes blob URLs
 * - Event listeners are removed before audio element cleanup
 * - Blob URLs are revoked in onended/onerror handlers or delayed cleanup
 *
 * ### Error Handling
 * - Rapid requests (<2s apart) suppress error callbacks to avoid noise
 * - AbortError from fetch cancellation is silently ignored
 * - Session cancellation causes graceful early returns (no errors)
 * - Falls back to WebSpeech TTS on ElevenLabs failures
 */

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

/**
 * Singleton TTS provider using ElevenLabs API with streaming support.
 * Falls back to browser's WebSpeech API when ElevenLabs is unavailable.
 */
export class ElevenLabsTTS {
  private static instance: ElevenLabsTTS;
  private voices: Voice[] = [];
  private audio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private isAvailableFlag: boolean = false;
  private voicesLoaded: boolean = false;
  private loadingVoices: Promise<void> | null = null;

  /**
   * Session ID for cancellation tracking.
   * Incremented on each speak() or stop() call. Async operations compare their
   * captured session ID against this to determine if they should continue.
   */
  private currentSessionId: number = 0;

  private fallbackTTS: WebSpeechTTS;
  private abortController: AbortController | null = null;

  /** Active stream reader, stored for cleanup on stop() */
  private activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  /** Timestamp of last request, used for rapid-request detection */
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
  }

  public static getInstance(): ElevenLabsTTS {
    if (!ElevenLabsTTS.instance) {
      ElevenLabsTTS.instance = new ElevenLabsTTS();
    }
    return ElevenLabsTTS.instance;
  }

  public async loadVoices() {
    if (typeof window === 'undefined') return;

    if (this.loadingVoices) {
      return this.loadingVoices;
    }

    this.loadingVoices = (async () => {
      try {
        const response = await fetch('/api/elevenlabs/voices');

        const data = await response.json();

        this.voices = (data?.voices ?? []).map((voice: Voice) => ({
          voice_id: voice.voice_id,
          name: voice.name || 'Unnamed Voice',
          preview_url: voice.preview_url,
          description: voice.description || ''
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

  /**
   * Speaks the given text using ElevenLabs TTS.
   *
   * This method:
   * 1. Stops any ongoing speech (cancels previous session)
   * 2. Creates a new session ID for cancellation tracking
   * 3. Makes API request with abort controller
   * 4. Plays audio via streaming (MediaSource) or buffered mode
   *
   * @param text - The text to speak
   * @param options.voiceId - ElevenLabs voice ID (defaults to first available or Rachel)
   * @param options.stability - Voice stability 0-1 (default 0.5)
   * @param options.similarityBoost - Similarity boost 0-1 (default 0.5)
   * @param options.streaming - Use streaming playback (default true)
   */
  public async speak(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    streaming?: boolean;
    modelId?: string;
  }) {
    // Stop any ongoing speech and API requests first
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

    const useStreaming = options?.streaming ?? true;
    const canStream = typeof window !== 'undefined' &&
      'MediaSource' in window &&
      MediaSource.isTypeSupported('audio/mpeg');

    // Create audio infrastructure synchronously BEFORE any await, while the
    // user gesture is still active. Chrome's autoplay policy expires the
    // transient activation after ~1s. By calling play() here (before any fetch
    // or voice-loading await), we register audio activation even if voices
    // haven't been loaded yet on the first call.
    let pendingMediaSource: MediaSource | null = null;
    let pendingUrl: string | null = null;
    if (useStreaming && canStream) {
      pendingMediaSource = new MediaSource();
      pendingUrl = URL.createObjectURL(pendingMediaSource);
      this.audio = new Audio(pendingUrl);
      this.audio.play().catch(() => {
        // Expected — no source buffer yet. The important thing is play() was
        // called in gesture context to register audio activation.
      });
    }

    const discardPendingAudio = () => {
      if (this.audio && pendingMediaSource) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }
      if (pendingUrl) {
        URL.revokeObjectURL(pendingUrl);
        pendingUrl = null;
      }
    };

    // Load voices if needed — safe to await here because play() was already called
    if (!this.isAvailableFlag) {
      if (!this.voicesLoaded) {
        await this.loadVoices();
      }

      // Session may have been cancelled while loading voices
      if (!isSessionActive()) {
        discardPendingAudio();
        this.isSpeaking = false;
        return;
      }

      if (!this.isAvailableFlag) {
        discardPendingAudio();
        console.warn('ElevenLabs is not available, falling back to browser TTS');
        this.fallbackTTS.speak(text);
        return;
      }
    }

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

    try {
      this.callbacks.onStart?.();
      this.isSpeaking = true;

      // Check if session was cancelled before making API call
      if (!isSessionActive()) {
        this.isSpeaking = false;
        return;
      }

      // Call our Next.js API route
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
          modelId: options?.modelId,
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

      if (useStreaming && response.body && pendingMediaSource) {
        // Streaming playback — pass the pre-created MediaSource (audio element
        // and play() were already set up synchronously above)
        await this.playStreamingAudio(response.body, isSessionActive, pendingMediaSource);
      } else {
        // Non-streaming fallback — discard the pre-created audio if any
        discardPendingAudio();
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

  /**
   * Plays audio from a streaming response body.
   *
   * Uses MediaSource API for real-time streaming when supported. Falls back to
   * collecting all chunks into a Blob for browsers without MediaSource support.
   *
   * The isSessionActive callback is checked frequently to enable graceful
   * cancellation when stop() is called or a new speak() starts.
   *
   * @param body - ReadableStream from fetch response
   * @param isSessionActive - Callback that returns false if session was cancelled
   */
  private async playStreamingAudio(body: ReadableStream<Uint8Array>, isSessionActive: () => boolean, preCreatedMediaSource?: MediaSource) {
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

      this.audio.onerror = () => {
        if (!isSessionActive()) return;
        this.isSpeaking = false;
        this.activeReader = null;
        const mediaError = this.audio?.error;
        const message = mediaError
          ? `Audio playback error (code ${mediaError.code}): ${mediaError.message}`
          : 'Audio playback error';
        this.callbacks.onError?.(new Error(message));
        URL.revokeObjectURL(audioUrl);
      };

      await this.audio.play();
      return;
    }

    // Use pre-created MediaSource (play() already called in speak() under user gesture),
    // or create a new one if none was provided.
    const mediaSource = preCreatedMediaSource ?? new MediaSource();
    if (!preCreatedMediaSource) {
      const audioUrl = URL.createObjectURL(mediaSource);
      this.audio = new Audio(audioUrl);
    }
    const audio = this.audio!;
    const audioUrl = audio.src;

    const reader = body.getReader();
    this.activeReader = reader;
    let sourceBuffer: SourceBuffer | null = null;
    const pendingChunks: Uint8Array[] = [];
    let isAppending = false;
    let totalBytesAppended = 0;

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
        totalBytesAppended += chunk.byteLength;
      } catch {
        // Silently ignore errors - expected when session ends
        isAppending = false;
      }
    };

    const onSourceOpen = async () => {
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
                // Wait for all pending chunks to be appended, then signal end
                const waitForBuffers = () => {
                  if (!isSessionActive()) return;
                  if (pendingChunks.length === 0 && !isAppending && sourceBuffer && !sourceBuffer.updating) {
                    if (mediaSource.readyState === 'open' && totalBytesAppended > 0) {
                      // Wait until HAVE_METADATA so endOfStream doesn't cause a demuxer error
                      if (this.audio && this.audio.readyState < 1) {
                        setTimeout(waitForBuffers, 50);
                        return;
                      }
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

      } catch (e) {
        if (!isSessionActive()) return;
        console.error('Error setting up MediaSource:', e);
        this.callbacks.onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    };

    // sourceopen may have already fired if play() was called before this method
    if (mediaSource.readyState === 'open') {
      onSourceOpen();
    } else {
      mediaSource.addEventListener('sourceopen', onSourceOpen, { once: true });
    }

    audio.onended = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      this.activeReader = null;
      this.callbacks.onEnd?.();
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      this.activeReader = null;
      const mediaError = audio.error;
      const message = mediaError
        ? `Audio playback error (code ${mediaError.code}): ${mediaError.message}`
        : 'Audio playback error';
      this.callbacks.onError?.(new Error(message));
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

    this.audio.onerror = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      const mediaError = this.audio?.error;
      const message = mediaError
        ? `Audio playback error (code ${mediaError.code}): ${mediaError.message}`
        : 'Audio playback error';
      this.callbacks.onError?.(new Error(message));
      if (this.audio) {
        URL.revokeObjectURL(this.audio.src);
      }
    };

    await this.audio.play();
  }

  /**
   * Stops any ongoing speech and cleans up resources.
   *
   * This method:
   * 1. Increments session ID (invalidates all running async operations)
   * 2. Cancels active stream reader
   * 3. Aborts pending fetch request
   * 4. Pauses and cleans up audio element
   * 5. Revokes blob URLs to prevent memory leaks
   * 6. Calls onEnd callback if was speaking
   *
   * All async operations check isSessionActive() and will exit gracefully
   * when they detect the session ID has changed.
   */
  public stop() {
    // Increment session ID - this invalidates all running async operations
    // They will check isSessionActive() and exit gracefully
    this.currentSessionId++;

    // Cancel the active reader if it exists to properly clean up the stream
    if (this.activeReader) {
      this.activeReader.cancel().catch(() => {
        // Ignore errors during cancel - stream may already be closed
      });
      this.activeReader = null;
    }

    // Abort any pending fetch request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

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
    return this.isAvailableFlag;
  }
}
