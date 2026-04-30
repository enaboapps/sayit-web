import { ElevenLabsTTS } from '@/lib/elevenlabs-tts';

describe('ElevenLabsTTS', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    (ElevenLabsTTS as unknown as { instance?: ElevenLabsTTS }).instance = undefined;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch voices during initialization', () => {
    ElevenLabsTTS.getInstance();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads voices only when requested', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        available: true,
        voices: [
          {
            voice_id: 'voice-1',
            name: 'Test Voice',
            preview_url: 'https://example.com/voice.mp3',
            description: 'Preview voice',
          },
        ],
      }),
    });

    const tts = ElevenLabsTTS.getInstance();
    await tts.loadVoices();

    expect(global.fetch).toHaveBeenCalledWith('/api/elevenlabs/voices');
    expect(tts.isAvailable()).toBe(true);
    expect(tts.getVoices()).toHaveLength(1);
  });
});
