import { GeminiTTS } from '@/lib/gemini-tts';

describe('GeminiTTS', () => {
  const originalFetch = global.fetch;
  const originalAudio = global.Audio;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    global.fetch = jest.fn();
    (GeminiTTS as unknown as { instance?: GeminiTTS }).instance = undefined;
    URL.createObjectURL = jest.fn(() => 'blob:gemini-audio');
    URL.revokeObjectURL = jest.fn();
    global.Audio = jest.fn().mockImplementation((src: string) => ({
      src,
      pause: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
      onended: null,
      onerror: null,
      error: null,
    })) as unknown as typeof Audio;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.Audio = originalAudio;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('does not fetch voices during initialization', () => {
    GeminiTTS.getInstance();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads voices only when requested', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        available: true,
        voices: [
          {
            voice_id: 'Puck',
            name: 'Puck (Upbeat)',
            style: 'Upbeat',
            gender: 'Unknown',
            languageCodes: [],
          },
        ],
      }),
    });

    const tts = GeminiTTS.getInstance();
    await tts.loadVoices();

    expect(global.fetch).toHaveBeenCalledWith('/api/gemini/voices');
    expect(tts.isAvailable()).toBe(true);
    expect(tts.getVoices()).toHaveLength(1);
  });

  it('marks provider unavailable when voices response is unavailable', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        available: false,
        voices: [],
      }),
    });

    const tts = GeminiTTS.getInstance();
    await tts.loadVoices();

    expect(tts.isAvailable()).toBe(false);
    expect(tts.getVoices()).toHaveLength(0);
  });

  it('posts synthesis requests to the Gemini TTS API route', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          available: true,
          voices: [
            {
              voice_id: 'Puck',
              name: 'Puck (Upbeat)',
              style: 'Upbeat',
              gender: 'Unknown',
              languageCodes: [],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio'], { type: 'audio/wav' }),
      });

    const tts = GeminiTTS.getInstance();
    await tts.speak('Hello', { voiceId: 'Puck' });

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/gemini/tts', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', voiceId: 'Puck' }),
      signal: expect.any(AbortSignal),
    }));
  });
});
