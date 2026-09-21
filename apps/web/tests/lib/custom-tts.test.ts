import { CustomTTS, customVoiceId } from '@/lib/custom-tts';
import { cleanLiveTypingSpeechSettings } from '@/lib/live-typing-speech';
const player = CustomTTS.getInstance();
let audio: { play: jest.Mock; pause: jest.Mock; src: string; onended: (() => void) | null; onerror: (() => void) | null };
let callbacks: { onStart: jest.Mock; onEnd: jest.Mock; onError: jest.Mock };
beforeEach(() => {
  player.reset();
  callbacks = { onStart: jest.fn(), onEnd: jest.fn(), onError: jest.fn() }; player.setCallbacks(callbacks);
  audio = { play: jest.fn().mockResolvedValue(undefined), pause: jest.fn(), src: '', onended: null, onerror: null };
  global.Audio = jest.fn(() => audio) as unknown as typeof Audio;
  URL.createObjectURL = jest.fn(() => 'blob:audio'); URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['audio']) });
});
afterEach(() => player.reset());
test('uses selected connection and voice, plays once, and stops playback', async () => {
  await player.speak('Hello', { voiceId: customVoiceId('connection', 'voice') });
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ id: 'connection', voiceId: 'voice', text: 'Hello' });
  expect(audio.play).toHaveBeenCalledTimes(1);
  player.stop(); expect(audio.pause).toHaveBeenCalled(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio');
});
test('blocks double clicks and ignores stopped pending responses', async () => {
  let resolve!: (value: { ok: boolean; blob: () => Promise<Blob> }) => void;
  (fetch as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; }));
  const pending = player.speak('First', { voiceId: customVoiceId('a', 'b') });
  await player.speak('Second', { voiceId: customVoiceId('a', 'b') });
  expect(fetch).toHaveBeenCalledTimes(1);
  const signal = (fetch as jest.Mock).mock.calls[0][1].signal;
  player.stop(); expect(signal.aborted).toBe(true);
  resolve({ ok: true, blob: async () => new Blob(['old']) }); await pending;
  expect(audio.play).not.toHaveBeenCalled();
});
test('keeps blocked audio for explicit Play', async () => {
  audio.play.mockRejectedValueOnce(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
  await player.speak('Hello', { voiceId: customVoiceId('a', 'b') });
  expect(player.getSnapshot().blocked).toBe(true);
  player.retryPlayback(); await Promise.resolve();
  expect(audio.play).toHaveBeenCalledTimes(2); expect(player.getSnapshot().blocked).toBe(false);
});
test('reports errors without substituting voices', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Start your voice first.' }) });
  await player.speak('Keep my text', { voiceId: customVoiceId('a', 'b') });
  expect(player.getSnapshot().error).toBe('Start your voice first.');
  expect(audio.play).not.toHaveBeenCalled(); expect(callbacks.onError).toHaveBeenCalled();
});
test('rejects over-limit messages and missing selection without a request', async () => {
  await player.speak('x'.repeat(501), { voiceId: customVoiceId('a', 'b') });
  expect(player.getSnapshot().error).toContain('500');
  await player.speak('Hello'); expect(fetch).not.toHaveBeenCalled();
});
test('shared viewers receive browser speech without connection or voice identifiers', () => {
  const settings = { provider: 'custom' as const, voiceId: customVoiceId('private', 'voice'), rate: 1, pitch: 1, volume: 1, stability: 0.5, similarityBoost: 0.5, modelId: 'private' };
  const shared = cleanLiveTypingSpeechSettings(settings);
  expect(shared.provider).toBe('browser'); expect(shared).not.toHaveProperty('voiceId'); expect(shared).not.toHaveProperty('modelId');
});
