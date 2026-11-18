import { act, renderHook, waitFor } from '@testing-library/react';
import { useTTS } from '@/lib/hooks/useTTS';

type MockProvider = 'browser' | 'elevenlabs' | 'azure' | 'gemini';

let mockSettings = {
  ttsProvider: 'elevenlabs',
  ttsVoiceId: 'voice-1',
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
};

let mockCurrentProvider: MockProvider = 'browser';

const mockTTSProvider = {
  isAvailable: jest.fn(() => true),
  getCurrentProvider: jest.fn(() => mockCurrentProvider),
  getStatus: jest.fn(() => ({
    isSpeaking: false,
    activeProvider: mockCurrentProvider,
    browserTTSAvailable: true,
    cloud: {
      elevenlabs: { available: mockCurrentProvider === 'elevenlabs', voicesLoaded: true },
      azure: { available: mockCurrentProvider === 'azure', voicesLoaded: true },
      gemini: { available: mockCurrentProvider === 'gemini', voicesLoaded: true },
    },
  })),
  getAllVoices: jest.fn(() => []),
  addCallbacks: jest.fn(() => () => {}),
  setProvider: jest.fn((provider: MockProvider) => {
    mockCurrentProvider = provider;
  }),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoicesByProvider: jest.fn(() => []),
  refreshVoices: jest.fn(),
  loadCloudVoices: jest.fn(),
};

jest.mock('@/app/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    isActive: true,
  })),
}));

jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: mockSettings,
  })),
}));

jest.mock('@/lib/tts-provider', () => ({
  TTSProvider: {
    getInstance: jest.fn(() => mockTTSProvider),
  },
  emptyCloudTTSStatus: () => ({
    elevenlabs: { available: false, voicesLoaded: false },
    azure: { available: false, voicesLoaded: false },
    gemini: { available: false, voicesLoaded: false },
  }),
}));

describe('useTTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentProvider = 'browser';
    mockSettings = {
      ttsProvider: 'elevenlabs',
      ttsVoiceId: 'voice-1',
      speechRate: 1,
      speechPitch: 1,
      speechVolume: 1,
      ttsStability: 0.5,
      ttsSimilarityBoost: 0.5,
    };
  });

  it('applies the saved provider during initialization', async () => {
    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(mockTTSProvider.setProvider).toHaveBeenCalledWith('elevenlabs');
      expect(result.current.provider).toBe('elevenlabs');
      expect(result.current.status.activeProvider).toBe('elevenlabs');
    });
  });

  it('applies Gemini as saved provider during initialization', async () => {
    mockSettings = {
      ...mockSettings,
      ttsProvider: 'gemini',
    };

    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(mockTTSProvider.setProvider).toHaveBeenCalledWith('gemini');
      expect(result.current.provider).toBe('gemini');
      expect(result.current.status.activeProvider).toBe('gemini');
    });
  });

  it('loads cloud voices through the shared method', async () => {
    const { result } = renderHook(() => useTTS());

    await result.current.loadCloudVoices('azure');

    expect(mockTTSProvider.loadCloudVoices).toHaveBeenCalledWith('azure');
  });

  it('keeps the same status object when nothing changed', async () => {
    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.status.activeProvider).toBe('elevenlabs'));
    const before = result.current.status;

    act(() => {
      result.current.refreshVoices();
    });

    expect(result.current.status).toBe(before);
  });

  it('reports a cloud provider as available only with a subscription and voices', async () => {
    mockSettings = { ...mockSettings, ttsProvider: 'azure' };
    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(result.current.isProviderAvailable('azure')).toBe(true);
    });
    expect(result.current.isProviderAvailable('gemini')).toBe(false);
    expect(result.current.isProviderAvailable('browser')).toBe(true);
  });
});

