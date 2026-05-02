import type { BaseTTSCallbacks } from './tts-types';

type ActiveSession = {
  signal: AbortSignal;
  isActive: () => boolean;
};

export class CloudTTSLifecycle {
  private audio: HTMLAudioElement | null = null;
  private abortController: AbortController | null = null;
  private currentSessionId = 0;
  private isSpeaking = false;

  public beginSession(callbacks: BaseTTSCallbacks): ActiveSession {
    this.stop(callbacks);

    const sessionId = ++this.currentSessionId;
    this.abortController = new AbortController();

    return {
      signal: this.abortController.signal,
      isActive: () => sessionId === this.currentSessionId,
    };
  }

  public markStarted(callbacks: BaseTTSCallbacks) {
    callbacks.onStart?.();
    this.isSpeaking = true;
  }

  public markInactive() {
    this.isSpeaking = false;
  }

  public async playBlob(
    blob: Blob,
    callbacks: BaseTTSCallbacks,
    isSessionActive: () => boolean
  ) {
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
      URL.revokeObjectURL(audioUrl);
      callbacks.onEnd?.();
    };

    this.audio.onerror = () => {
      if (!isSessionActive()) return;
      this.isSpeaking = false;
      const mediaError = this.audio?.error;
      URL.revokeObjectURL(audioUrl);
      const message = mediaError
        ? `Audio playback error (code ${mediaError.code}): ${mediaError.message}`
        : 'Audio playback error';

      callbacks.onError?.(
        new Error(message)
      );
    };

    await playPromise;
  }

  public stop(callbacks: BaseTTSCallbacks) {
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
      const audioSrc = audioToClean.src;
      setTimeout(() => {
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
      callbacks.onEnd?.();
    }
  }

  public pause() {
    this.audio?.pause();
  }

  public resume(callbacks: BaseTTSCallbacks, message: string) {
    this.audio?.play().catch(error => {
      console.error(message, error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    });
  }
}
