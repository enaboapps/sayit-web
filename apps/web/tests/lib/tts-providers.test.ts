import { CLOUD_TTS_PROVIDERS, isCloudProvider } from '@/lib/tts-types';
import { CLOUD_TTS_PROVIDER_INFO, getTTSProviderInfo } from '@/lib/tts-providers';
import { AzureTTS } from '@/lib/azure-tts';

describe('cloud provider list', () => {
  test('isCloudProvider matches the list and nothing else', () => {
    for (const provider of CLOUD_TTS_PROVIDERS) {
      expect(isCloudProvider(provider)).toBe(true);
    }
    expect(isCloudProvider('browser')).toBe(false);
    expect(isCloudProvider('custom')).toBe(false);
    expect(isCloudProvider(undefined)).toBe(false);
  });

  test('every cloud provider has an entry with a client', () => {
    expect(Object.keys(CLOUD_TTS_PROVIDER_INFO).sort()).toEqual([...CLOUD_TTS_PROVIDERS].sort());
    for (const provider of CLOUD_TTS_PROVIDERS) {
      const client = CLOUD_TTS_PROVIDER_INFO[provider].client();
      expect(typeof client.speak).toBe('function');
      expect(typeof client.loadVoices).toBe('function');
    }
  });

  test('getTTSProviderInfo names browser speech and cloud providers', () => {
    expect(getTTSProviderInfo('browser').name).toBe('Browser TTS');
    expect(getTTSProviderInfo('azure').name).toBe('Azure');
  });
});

describe('AzureTTS', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  test('uses the Azure routes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ available: true, voices: [{ voice_id: 'jenny', name: 'Jenny' }] }),
    }) as unknown as typeof fetch;
    (AzureTTS as unknown as { instance?: AzureTTS }).instance = undefined;

    const tts = AzureTTS.getInstance();
    await tts.loadVoices();

    expect(global.fetch).toHaveBeenCalledWith('/api/azure/voices');
    expect(tts.getVoices()).toEqual([expect.objectContaining({ voice_id: 'jenny', name: 'Jenny' })]);
  });
});
