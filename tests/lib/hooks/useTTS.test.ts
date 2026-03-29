import { renderHook, waitFor } from '@testing-library/react';
import { useTTS } from '@/lib/hooks/useTTS';

const mockSettings = {
  ttsProvider: 'elevenlabs',
  ttsVoiceId: 'voice-1',
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
};

let mockCurrentProvider: 'browser' | 'elevenlabs' = 'browser';

const mockTTSProvider = {
  isAvailable: jest.fn(() => true),
  getCurrentProvider: jest.fn(() => mockCurrentProvider),
  getStatus: jest.fn(() => ({
    isSpeaking: false,
    activeProvider: mockCurrentProvider,
    elevenLabsAvailable: mockCurrentProvider === 'elevenlabs',
    browserTTSAvailable: true,
  })),
  getAllVoices: jest.fn(() => []),
  setCallbacks: jest.fn(),
  setProvider: jest.fn((provider: 'browser' | 'elevenlabs') => {
    mockCurrentProvider = provider;
  }),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoicesByProvider: jest.fn(() => []),
  refreshVoices: jest.fn(),
  loadElevenLabsVoices: jest.fn(),
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
}));

describe('useTTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentProvider = 'browser';
  });

  it('applies the saved provider during initialization', async () => {
    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(mockTTSProvider.setProvider).toHaveBeenCalledWith('elevenlabs');
      expect(result.current.provider).toBe('elevenlabs');
      expect(result.current.status.activeProvider).toBe('elevenlabs');
    });
  });
});
