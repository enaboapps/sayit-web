import { TTSProvider } from '@/lib/tts-provider';

let mockElevenLabsAvailable = false;
let mockAzureAvailable = false;
let mockGeminiAvailable = false;
let mockElevenLabsLoaded = false;
let mockAzureLoaded = false;
let mockGeminiLoaded = false;

const mockBrowserTTS = {
  setCallbacks: jest.fn(),
  getVoices: jest.fn(() => []),
  refreshVoices: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isAvailable: jest.fn(() => true),
};

const mockElevenLabsTTS = {
  setCallbacks: jest.fn(),
  getVoices: jest.fn(() => []),
  loadVoices: jest.fn(async () => {
    mockElevenLabsLoaded = true;
    mockElevenLabsAvailable = true;
  }),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isAvailable: jest.fn(() => mockElevenLabsAvailable),
  hasLoadedVoices: jest.fn(() => mockElevenLabsLoaded),
};

const mockAzureTTS = {
  setCallbacks: jest.fn(),
  getVoices: jest.fn(() => []),
  loadVoices: jest.fn(async () => {
    mockAzureLoaded = true;
    mockAzureAvailable = true;
  }),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isAvailable: jest.fn(() => mockAzureAvailable),
  hasLoadedVoices: jest.fn(() => mockAzureLoaded),
};

const mockGeminiTTS = {
  setCallbacks: jest.fn(),
  getVoices: jest.fn(() => []),
  loadVoices: jest.fn(async () => {
    mockGeminiLoaded = true;
    mockGeminiAvailable = true;
  }),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isAvailable: jest.fn(() => mockGeminiAvailable),
  hasLoadedVoices: jest.fn(() => mockGeminiLoaded),
};

jest.mock('@/lib/tts', () => ({
  TextToSpeech: {
    getInstance: jest.fn(() => mockBrowserTTS),
  },
}));

jest.mock('@/lib/elevenlabs-tts', () => ({
  ElevenLabsTTS: {
    getInstance: jest.fn(() => mockElevenLabsTTS),
  },
}));

jest.mock('@/lib/azure-tts', () => ({
  AzureTTS: {
    getInstance: jest.fn(() => mockAzureTTS),
  },
}));

jest.mock('@/lib/gemini-tts', () => ({
  GeminiTTS: {
    getInstance: jest.fn(() => mockGeminiTTS),
  },
}));

describe('TTSProvider status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TTSProvider as unknown as { instance?: TTSProvider }).instance = undefined;
    mockElevenLabsAvailable = false;
    mockAzureAvailable = false;
    mockGeminiAvailable = false;
    mockElevenLabsLoaded = false;
    mockAzureLoaded = false;
    mockGeminiLoaded = false;
  });

  it('reports provider voice loading state in status', async () => {
    const provider = TTSProvider.getInstance();

    expect(provider.getStatus().cloud).toEqual({
      elevenlabs: { available: false, voicesLoaded: false },
      azure: { available: false, voicesLoaded: false },
      gemini: { available: false, voicesLoaded: false },
    });

    await provider.loadCloudVoices('elevenlabs');
    await provider.loadCloudVoices('azure');
    await provider.loadCloudVoices('gemini');

    expect(provider.getStatus().cloud).toEqual({
      elevenlabs: { available: true, voicesLoaded: true },
      azure: { available: true, voicesLoaded: true },
      gemini: { available: true, voicesLoaded: true },
    });
  });

  it('loads only the requested provider', async () => {
    const provider = TTSProvider.getInstance();

    await provider.loadCloudVoices('azure');

    expect(mockAzureTTS.loadVoices).toHaveBeenCalledTimes(1);
    expect(mockElevenLabsTTS.loadVoices).not.toHaveBeenCalled();
    expect(mockGeminiTTS.loadVoices).not.toHaveBeenCalled();
  });
});

describe('TTSProvider routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TTSProvider as unknown as { instance?: TTSProvider }).instance = undefined;
    mockElevenLabsAvailable = false;
    mockAzureAvailable = false;
    mockGeminiAvailable = false;
    mockElevenLabsLoaded = false;
    mockAzureLoaded = false;
    mockGeminiLoaded = false;
  });

  it('labels cloud voices from the provider list', () => {
    mockElevenLabsTTS.getVoices.mockReturnValueOnce([{ voice_id: 'e1', name: 'Rachel' }] as never);
    mockAzureTTS.getVoices.mockReturnValueOnce([{ voice_id: 'a1', name: 'Jenny' }] as never);
    mockGeminiTTS.getVoices.mockReturnValueOnce([{ voice_id: 'g1', name: 'Puck' }] as never);

    const voices = TTSProvider.getInstance().getAllVoices();

    expect(voices).toEqual([
      expect.objectContaining({ id: 'e1', name: 'Rachel (ElevenLabs)', provider: 'elevenlabs' }),
      expect.objectContaining({ id: 'a1', name: 'Jenny', provider: 'azure' }),
      expect.objectContaining({ id: 'g1', name: 'Puck (Gemini)', provider: 'gemini' }),
    ]);
  });

  it('speaks through the active cloud provider with its options', () => {
    const provider = TTSProvider.getInstance();
    provider.setProvider('gemini');

    provider.speak('Hello', { liveTyping: { sessionKey: 'k', commandId: 'c' } });

    expect(mockGeminiTTS.speak).toHaveBeenCalledWith('Hello', {
      voiceId: undefined,
      stability: undefined,
      similarityBoost: undefined,
      modelId: undefined,
      liveTyping: { sessionKey: 'k', commandId: 'c' },
    });
    expect(mockBrowserTTS.speak).not.toHaveBeenCalled();
  });

  it('stays on browser speech when a loaded cloud provider is unavailable', () => {
    mockAzureLoaded = true;
    const provider = TTSProvider.getInstance();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    provider.setProvider('azure');

    expect(provider.getCurrentProvider()).toBe('browser');
  });

  it('pauses and resumes only the active provider', () => {
    const provider = TTSProvider.getInstance();
    provider.setProvider('azure');

    provider.pause();
    provider.resume();

    expect(mockAzureTTS.pause).toHaveBeenCalledTimes(1);
    expect(mockAzureTTS.resume).toHaveBeenCalledTimes(1);
    expect(mockBrowserTTS.pause).not.toHaveBeenCalled();
    expect(mockGeminiTTS.pause).not.toHaveBeenCalled();
  });
});

describe('TTSProvider subscribers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TTSProvider as unknown as { instance?: TTSProvider }).instance = undefined;
    mockElevenLabsAvailable = false;
    mockAzureAvailable = false;
    mockGeminiAvailable = false;
    mockElevenLabsLoaded = false;
    mockAzureLoaded = false;
    mockGeminiLoaded = false;
  });

  it('fans onStart/onEnd out to every subscriber', () => {
    const provider = TTSProvider.getInstance();
    const onStartA = jest.fn();
    const onEndA = jest.fn();
    const onStartB = jest.fn();
    const onEndB = jest.fn();

    provider.addCallbacks({ onStart: onStartA, onEnd: onEndA });
    provider.addCallbacks({ onStart: onStartB, onEnd: onEndB });

    // TTSProvider's constructor wires browserTTS.setCallbacks during setupCallbacks.
    // Grab the wrapped onStart/onEnd it registered and invoke them as the browser
    // TTS would when a real utterance fires.
    const wrapped = mockBrowserTTS.setCallbacks.mock.calls[0][0];
    wrapped.onStart();
    wrapped.onEnd();

    expect(onStartA).toHaveBeenCalledTimes(1);
    expect(onStartB).toHaveBeenCalledTimes(1);
    expect(onEndA).toHaveBeenCalledTimes(1);
    expect(onEndB).toHaveBeenCalledTimes(1);
  });

  it('addCallbacks returns an unsubscribe that detaches that subscriber only', () => {
    const provider = TTSProvider.getInstance();
    const onStartA = jest.fn();
    const onStartB = jest.fn();

    const unsubscribeA = provider.addCallbacks({ onStart: onStartA });
    provider.addCallbacks({ onStart: onStartB });

    unsubscribeA();

    const wrapped = mockBrowserTTS.setCallbacks.mock.calls[0][0];
    wrapped.onStart();

    expect(onStartA).not.toHaveBeenCalled();
    expect(onStartB).toHaveBeenCalledTimes(1);
  });
});
