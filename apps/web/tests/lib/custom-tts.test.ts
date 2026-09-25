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
  player.stop(); expect(signal.aborted).toBe(false);
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

const voice = customVoiceId('connection', 'voice');
async function drain() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
test('prepares after two seconds without speaking and reuses exact audio on Speak', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  player.prepareDraft('Hello', voice, true);
  jest.advanceTimersByTime(1999); expect(fetch).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1); await drain();
  expect(fetch).toHaveBeenCalledTimes(1); expect(audio.play).not.toHaveBeenCalled();
  expect(callbacks.onStart).not.toHaveBeenCalled(); expect(player.getSnapshot().busy).toBe(false);
  await player.speak('Hello', { voiceId: voice });
  expect(fetch).toHaveBeenCalledTimes(1); expect(audio.play).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
test('coalesces edits and never plays stale preparation', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  let resolve!: (value: unknown) => void;
  (fetch as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  player.prepareDraft('First', voice, true); jest.advanceTimersByTime(2000);
  player.prepareDraft('Second', voice, true); jest.advanceTimersByTime(2000);
  player.prepareDraft('Third', voice, true); jest.advanceTimersByTime(2000);
  expect(fetch).toHaveBeenCalledTimes(1);
  resolve({ ok: true, blob: async () => new Blob(['first']) }); await drain();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).text).toBe('Third');
  expect(audio.play).not.toHaveBeenCalled();
  await player.speak('Third', { voiceId: voice }); expect(fetch).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});
test('Speak attaches to preparation and editing does not alter the captured message', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  let resolve!: (value: unknown) => void;
  (fetch as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  player.prepareDraft('Captured', voice, true); jest.advanceTimersByTime(2000);
  const speaking = player.speak('Captured', { voiceId: voice });
  player.prepareDraft('Next', voice, true); jest.advanceTimersByTime(2000);
  resolve({ ok: true, blob: async () => new Blob(['captured']) }); await speaking; await drain();
  expect(fetch).toHaveBeenCalledTimes(1); expect(audio.play).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
test('Stop suppresses queued preparation until another edit', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  player.prepareDraft('Hello', voice, true); player.stop();
  jest.advanceTimersByTime(10000); expect(fetch).not.toHaveBeenCalled();
  player.prepareDraft('Edited', voice, true); jest.advanceTimersByTime(2000); await drain();
  expect(fetch).toHaveBeenCalledTimes(1); jest.useRealTimers();
});
test('context changes discard cached audio and disallowed drafts never prepare', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  player.prepareDraft('Hello', voice, true); jest.advanceTimersByTime(2000); await drain();
  player.setPreparationContext('other/tab');
  await player.speak('Hello', { voiceId: voice }); expect(fetch).toHaveBeenCalledTimes(2);
  player.stop(); (fetch as jest.Mock).mockClear();
  player.prepareDraft('Hidden or composing', voice, false); jest.advanceTimersByTime(2000);
  expect(fetch).not.toHaveBeenCalled(); jest.useRealTimers();
});
test('background errors stay quiet and explicit Speak retries', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  (fetch as jest.Mock).mockRejectedValueOnce(new Error('Offline'));
  player.prepareDraft('Hello', voice, true); jest.advanceTimersByTime(2000); await drain();
  expect(player.getSnapshot().error).toBe(''); expect(callbacks.onError).not.toHaveBeenCalled();
  jest.advanceTimersByTime(10000); expect(fetch).toHaveBeenCalledTimes(1);
  await player.speak('Hello', { voiceId: voice }); expect(fetch).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});

test('explicit Speak takes priority over an obsolete draft and newest pending preparation', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  let resolve!: (value: unknown) => void;
  (fetch as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  player.prepareDraft('Old', voice, true); jest.advanceTimersByTime(2000);
  player.prepareDraft('Queued', voice, true); jest.advanceTimersByTime(2000);
  const speaking = player.speak('Explicit', { voiceId: voice });
  resolve({ ok: true, blob: async () => new Blob(['old']) }); await speaking; await drain();
  expect((fetch as jest.Mock).mock.calls.map(c => JSON.parse(c[1].body).text)).toEqual(['Old', 'Explicit']);
  expect(audio.play).toHaveBeenCalledTimes(1); jest.useRealTimers();
});
test('sign-out during preparation discards the response and never starts queued work', async () => {
  jest.useFakeTimers(); player.setPreparationContext('owner/tab');
  let resolve!: (value: unknown) => void;
  (fetch as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  player.prepareDraft('Private', voice, true); jest.advanceTimersByTime(2000);
  player.prepareDraft('Pending', voice, true); jest.advanceTimersByTime(2000);
  player.reset(); player.setPreparationContext('');
  resolve({ ok: true, blob: async () => new Blob(['private']) }); await drain();
  expect(fetch).toHaveBeenCalledTimes(1); expect(audio.play).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled(); jest.useRealTimers();
});
