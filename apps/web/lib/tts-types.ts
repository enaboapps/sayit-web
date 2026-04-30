/**
 * Base callback interface shared by all TTS providers.
 * Provider-specific callbacks (e.g. onVoicesChanged with typed voices) extend this.
 */
export interface BaseTTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}
