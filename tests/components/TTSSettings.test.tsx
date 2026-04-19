import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TTSSettings from '@/app/components/TTSSettings';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useTTS } from '@/lib/hooks/useTTS';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { TTSProviderType, TTSVoice } from '@/lib/tts-provider';

jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

jest.mock('@/lib/hooks/useTTS', () => ({
  useTTS: jest.fn(),
}));

jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: jest.fn(),
}));

const mockUseSettings = jest.mocked(useSettings);
const mockUseTTS = jest.mocked(useTTS);
const mockUseOnlineStatus = jest.mocked(useOnlineStatus);

const mockUpdateSetting = jest.fn();

const voices: TTSVoice[] = [
  { id: 'browser-voice-1', name: 'Browser Voice', provider: 'browser' },
  { id: 'eleven-voice-1', name: 'Eleven Voice', provider: 'elevenlabs' },
  { id: 'azure-voice-1', name: 'Azure Voice', provider: 'azure' },
];

const defaultSettings = {
  ttsProvider: 'browser' as TTSProviderType,
  ttsVoiceId: 'browser-voice-1',
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
  ttsModelPreference: 'fast' as const,
};

const defaultStatus = {
  isSpeaking: false,
  activeProvider: 'browser' as TTSProviderType,
  elevenLabsAvailable: true,
  azureAvailable: true,
  browserTTSAvailable: true,
};

function renderTTSSettings({
  settings = {},
  status = {},
  isOnline = true,
  hasSubscription = true,
}: {
  settings?: Partial<typeof defaultSettings>;
  status?: Partial<typeof defaultStatus>;
  isOnline?: boolean;
  hasSubscription?: boolean;
} = {}) {
  const mergedSettings = { ...defaultSettings, ...settings };
  const mergedStatus = { ...defaultStatus, ...status };

  mockUseSettings.mockReturnValue({
    settings: mergedSettings,
    updateSetting: mockUpdateSetting,
  } as never);

  mockUseOnlineStatus.mockReturnValue({
    isOnline,
  } as never);

  mockUseTTS.mockReturnValue({
    voices,
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: false,
    status: mergedStatus,
    getVoicesByProvider: jest.fn((provider: TTSProviderType) => voices.filter(voice => voice.provider === provider)),
    refreshVoices: jest.fn(),
    loadElevenLabsVoices: jest.fn(),
    loadAzureVoices: jest.fn(),
    hasSubscription,
  } as never);

  return render(<TTSSettings />);
}

async function openProviderDropdown(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Browser TTS' }));
}

describe('TTSSettings provider dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders provider selection as a dropdown with Browser TTS selected by default', () => {
    renderTTSSettings();

    expect(screen.getByRole('button', { name: 'Browser TTS' })).toBeInTheDocument();
  });

  it('shows all provider options when opened', async () => {
    const user = userEvent.setup();
    renderTTSSettings();

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Browser TTS')).toBeInTheDocument();
    expect(within(dialog).getByText('ElevenLabs')).toBeInTheDocument();
    expect(within(dialog).getByText('Azure')).toBeInTheDocument();
  });

  it('changes provider when an available provider is selected', async () => {
    const user = userEvent.setup();
    renderTTSSettings();

    await openProviderDropdown(user);
    await user.click(screen.getByText('ElevenLabs'));

    expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'elevenlabs');
  });

  it('disables ElevenLabs while offline', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ isOnline: false });

    await openProviderDropdown(user);

    const elevenLabsOption = screen.getByRole('button', { name: /ElevenLabs \(offline\)/i });
    expect(elevenLabsOption).toBeDisabled();

    await user.click(elevenLabsOption);
    expect(mockUpdateSetting).not.toHaveBeenCalledWith('ttsProvider', 'elevenlabs');
  });

  it('disables Azure when unavailable', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ status: { azureAvailable: false } });

    await openProviderDropdown(user);

    const azureOption = screen.getByRole('button', { name: /Azure \(unavailable\)/i });
    expect(azureOption).toBeDisabled();

    await user.click(azureOption);
    expect(mockUpdateSetting).not.toHaveBeenCalledWith('ttsProvider', 'azure');
  });

  it('keeps premium providers selectable for non-subscribers when available', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ hasSubscription: false });

    await openProviderDropdown(user);

    expect(screen.getAllByText('PRO')).toHaveLength(2);

    await user.click(screen.getByText('Azure'));
    expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'azure');
  });

  it('preserves existing subscription, offline, and unavailable provider warning copy', () => {
    const { rerender } = renderTTSSettings({
      settings: { ttsProvider: 'elevenlabs', ttsVoiceId: 'eleven-voice-1' },
      hasSubscription: false,
    });

    expect(screen.getByText(/Pro subscription required for ElevenLabs voices/i)).toBeInTheDocument();

    mockUseOnlineStatus.mockReturnValue({
      isOnline: false,
    } as never);
    mockUseTTS.mockReturnValue({
      voices,
      speak: jest.fn(),
      stop: jest.fn(),
      isSpeaking: false,
      status: defaultStatus,
      getVoicesByProvider: jest.fn((provider: TTSProviderType) => voices.filter(voice => voice.provider === provider)),
      refreshVoices: jest.fn(),
      loadElevenLabsVoices: jest.fn(),
      loadAzureVoices: jest.fn(),
      hasSubscription: true,
    } as never);
    rerender(<TTSSettings />);

    expect(screen.getByText(/Offline\. Browser TTS still works, but ElevenLabs and Azure voices need internet\./i)).toBeInTheDocument();

    mockUseOnlineStatus.mockReturnValue({
      isOnline: true,
    } as never);
    mockUseTTS.mockReturnValue({
      voices,
      speak: jest.fn(),
      stop: jest.fn(),
      isSpeaking: false,
      status: {
        ...defaultStatus,
        elevenLabsAvailable: false,
        azureAvailable: false,
      },
      getVoicesByProvider: jest.fn((provider: TTSProviderType) => voices.filter(voice => voice.provider === provider)),
      refreshVoices: jest.fn(),
      loadElevenLabsVoices: jest.fn(),
      loadAzureVoices: jest.fn(),
      hasSubscription: true,
    } as never);
    rerender(<TTSSettings />);

    expect(screen.getByText(/ElevenLabs unavailable\. API key not configured\./i)).toBeInTheDocument();
    expect(screen.getByText(/Azure unavailable\. Subscription key not configured\./i)).toBeInTheDocument();
  });
});
