import type { BaseTTSCallbacks } from './tts-types';

export type CustomConnection = { id: string; name: string; baseUrl: string; hasKey: boolean };
export type CustomVoice = { id: string; name: string; provider: 'custom' };
export function customVoiceId(connection: string, voice: string) { return 'custom:' + encodeURIComponent(JSON.stringify([connection, voice])); }
export function parseCustomVoice(id?: string): [string, string] {
  try {
    if (!id?.startsWith('custom:')) throw new Error();
    const value = JSON.parse(decodeURIComponent(id.slice(7)));
    if (!Array.isArray(value) || value.length !== 2 || value.some(v => typeof v !== 'string' || !v)) throw new Error();
    return value as [string, string];
  } catch { throw new Error('Select a custom voice in voice settings first.'); }
}
export async function customApi(action: string, body?: object, signal?: AbortSignal) {
  const response = await fetch('/api/custom-providers/' + action, {
    method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined, signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Custom voice request failed. Try again.');
  }
  return response;
}

// One owner-side player shared by all Speak/Stop controls. No browser-voice fallback.
export class CustomTTS {
  private static instance: CustomTTS;
  static getInstance() { return this.instance ??= new CustomTTS(); }
  private callbacks: BaseTTSCallbacks & { onVoicesChanged?: () => void } = {};
  private voices: CustomVoice[] = [];
  private controller?: AbortController;
  private audio?: HTMLAudioElement;
  private url?: string;
  private sequence = 0;
  private context = '';
  private lastDraftKey?: string;
  private stoppedDraftKey?: string;
  private timer?: ReturnType<typeof setTimeout>;
  private connectionRevision = 0;
  private revision = 0;
  private nextDraft?: { text: string; voiceId: string };
  private prepared?: { key: string; blob: Blob };
  private flight?: { key: string; result: Promise<Blob> };
  setPreparationContext(context: string) {
    if (context === this.context) return;
    this.stop();
    this.context = context;
    this.lastDraftKey = undefined;
    this.stoppedDraftKey = undefined;
  }
  private clearPreparation() {
    this.revision++;
    clearTimeout(this.timer);
    this.prepared = undefined;
    this.nextDraft = undefined;
  }
  prepareDraft(text: string, voiceId: string, allowed: boolean) {
    this.clearPreparation();
    const key = JSON.stringify([this.context, this.connectionRevision, voiceId, text]);
    this.lastDraftKey = key;
    if (this.stoppedDraftKey === key) return;
    this.stoppedDraftKey = undefined;
    if (!allowed || !this.context || !text.trim() || text.length > 500) return;
    this.nextDraft = { text, voiceId };
    const revision = this.revision;
    this.timer = setTimeout(() => { void this.prepare(key, text, voiceId, revision); }, 2000);
  }
  private async prepare(key: string, text: string, voiceId: string, revision: number) {
    // A superseded request drains before the newest draft can start. Never queue every edit.
    let blob: Blob | undefined;
    while (this.flight) {
      const flight = this.flight;
      try { const result = await flight.result; if (flight.key === key) blob = result; }
      catch { /* quiet background failure */ }
      if (this.revision !== revision || this.state.busy) return;
    }
    if (this.revision !== revision || this.state.busy) return;
    try {
      blob ??= await this.generate(key, text, voiceId);
      if (this.revision === revision && !this.state.busy) this.prepared = { key, blob };
    } catch { /* Explicit Speak retries; background failures never loop. */ }
  }
  private generate(key: string, text: string, selected?: string): Promise<Blob> {
    if (this.flight?.key === key) return this.flight.result;
    const [id, voiceId] = parseCustomVoice(selected);
    this.controller = new AbortController();
    const result = customApi('speech', { id, voiceId, text }, this.controller.signal).then(r => r.blob());
    const flight = { key, result };
    this.flight = flight;
    void result.finally(() => { if (this.flight === flight) this.flight = undefined; }).catch(() => {});
    return result;
  }
  private listeners = new Set<() => void>();
  private state = { busy: false, blocked: false, error: '' };
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private update(value: Partial<typeof this.state>) { this.state = { ...this.state, ...value }; this.listeners.forEach(fn => fn()); }
  setCallbacks(callbacks: typeof this.callbacks) { this.callbacks = callbacks; }
  getVoices() { return this.voices; }
  setVoices(connection: CustomConnection, voices: { voice_id: string; name: string }[]) {
    this.removeVoices(connection.id);
    this.voices.push(...voices.map(v => ({ id: customVoiceId(connection.id, v.voice_id), name: `${v.name} (${connection.name})`, provider: 'custom' as const })));
    this.callbacks.onVoicesChanged?.();
  }
  invalidatePreparation() { this.connectionRevision++; this.clearPreparation(); }
  removeVoices(id: string) {
    this.invalidatePreparation();
    this.voices = this.voices.filter(v => parseCustomVoice(v.id)[0] !== id);
    this.callbacks.onVoicesChanged?.();
  }
  reset() { this.stop(); this.update({ error: '' }); this.voices = []; this.callbacks.onVoicesChanged?.(); }
  async speak(text: string, options?: { voiceId?: string }) {
    if (this.state.busy) return;
    const sequence = ++this.sequence;
    const key = JSON.stringify([this.context, this.connectionRevision, options?.voiceId, text]);
    const cached = this.prepared?.key === key ? this.prepared.blob : undefined;
    this.clearPreparation();
    this.update({ busy: true, error: '', blocked: false });
    this.callbacks.onStart?.();
    try {
      if (!text.trim() || text.length > 500) throw new Error('Custom voices accept between 1 and 500 characters. Your message has been kept.');
      let blob = cached;
      if (!blob) {
        const flight = this.flight;
        if (flight) {
          try { const result = await flight.result; if (flight.key === key) blob = result; }
          catch (error) { if (flight.key === key) throw error; }
        }
        if (sequence !== this.sequence) return;
        blob ??= await this.generate(key, text, options?.voiceId);
      }
      if (sequence !== this.sequence) return;
      this.url = URL.createObjectURL(blob);
      this.audio = new Audio(this.url);
      this.audio.onended = () => {
        const next = this.nextDraft;
        this.stop();
        this.stoppedDraftKey = undefined;
        if (next) this.prepareDraft(next.text, next.voiceId, true);
      };
      this.audio.onerror = () => this.fail('Audio could not play. Check your device and try again.');
      await this.play(sequence);
    } catch (error) {
      if (sequence !== this.sequence) return;
      this.fail(error instanceof Error ? error.message : 'Custom voice request failed.');
    }
  }
  private fail(message: string) { this.stop(); this.update({ error: message }); this.callbacks.onError?.(new Error(message)); }
  private async play(sequence: number) {
    try { await this.audio?.play(); if (sequence === this.sequence) this.update({ blocked: false }); }
    catch (error) {
      if (sequence !== this.sequence) return;
      if ((error as Error).name === 'NotAllowedError') this.update({ blocked: true });
      else this.fail('Audio could not play. Try again.');
    }
  }
  retryPlayback = () => { void this.play(this.sequence); };
  dismiss = () => this.update({ error: '' });
  stop() {
    this.stoppedDraftKey = this.lastDraftKey;
    this.sequence++;
    this.clearPreparation();
    // Keep the network request draining: aborting it cannot cancel remote generation.
    this.controller = undefined;
    if (this.audio) { this.audio.onended = null; this.audio.onerror = null; this.audio.pause(); this.audio.src = ''; this.audio = undefined; }
    if (this.url) URL.revokeObjectURL(this.url); this.url = undefined;
    const busy = this.state.busy;
    this.update({ busy: false, blocked: false });
    if (busy) this.callbacks.onEnd?.();
  }
  pause() { this.audio?.pause(); }
  resume() { this.retryPlayback(); }
}
