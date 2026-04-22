import { render, screen, waitFor, within } from '@testing-library/react';
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
const mockLoadElevenLabsVoices = jest.fn();
const mockLoadAzureVoices = jest.fn();
const mockLoadGeminiVoices = jest.fn();

const voices: TTSVoice[] = [
  { id: 'browser-voice-1', name: 'Browser Voice', provider: 'browser' },
  { id: 'eleven-voice-1', name: 'Eleven Voice', provider: 'elevenlabs' },
  { id: 'azure-voice-1', name: 'Azure Voice', provider: 'azure' },
  { id: 'gemini-voice-1', name: 'Gemini Voice', provider: 'gemini' },
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
  geminiAvailable: true,
  browserTTSAvailable: true,
  elevenLabsVoicesLoaded: true,
  azureVoicesLoaded: true,
  geminiVoicesLoaded: true,
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
    loadElevenLabsVoices: mockLoadElevenLabsVoices,
    loadAzureVoices: mockLoadAzureVoices,
    loadGeminiVoices: mockLoadGeminiVoices,
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

  it('renders provider selection before voice selection', () => {
    renderTTSSettings();

    const providerHeading = screen.getByRole('heading', { name: 'Provider' });
    const voiceHeading = screen.getByRole('heading', { name: 'Voice' });

    expect(
      providerHeading.compareDocumentPosition(voiceHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows all provider options when opened', async () => {
    const user = userEvent.setup();
    renderTTSSettings();

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Browser TTS')).toBeInTheDocument();
    expect(within(dialog).getByText('ElevenLabs')).toBeInTheDocument();
    expect(within(dialog).getByText('Azure')).toBeInTheDocument();
    expect(within(dialog).getByText('Gemini')).toBeInTheDocument();
  });

  it('changes provider when an available provider is selected', async () => {
    const user = userEvent.setup();
    renderTTSSettings();

    await openProviderDropdown(user);
    await user.click(screen.getByText('ElevenLabs'));

    expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'elevenlabs');
  });

  it('selects available Gemini', async () => {
    const user = userEvent.setup();
    renderTTSSettings();

    await openProviderDropdown(user);
    await user.click(screen.getByText('Gemini'));

    expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'gemini');
  });

  it('hides cloud providers while offline', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ isOnline: false });

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Browser TTS')).toBeInTheDocument();
    expect(within(dialog).queryByText('ElevenLabs')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Azure')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Gemini')).not.toBeInTheDocument();
  });

  it('hides Azure when unavailable', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ status: { azureAvailable: false } });

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('Azure')).not.toBeInTheDocument();
  });

  it('hides Gemini while offline', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ isOnline: false });

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('Gemini')).not.toBeInTheDocument();
  });

  it('hides Gemini when unavailable', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ status: { geminiAvailable: false } });

    await openProviderDropdown(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('Gemini')).not.toBeInTheDocument();
  });

  it('keeps premium providers selectable for non-subscribers when available', async () => {
    const user = userEvent.setup();
    renderTTSSettings({ hasSubscription: false });

    await openProviderDropdown(user);

    expect(screen.getAllByText('PRO')).toHaveLength(3);

    await user.click(screen.getByText('Azure'));
    expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'azure');
  });

  it('loads Gemini voices while online', () => {
    renderTTSSettings();

    expect(mockLoadGeminiVoices).toHaveBeenCalled();
  });

  it('renders Gemini voice settings copy', () => {
    renderTTSSettings({
      settings: { ttsProvider: 'gemini', ttsVoiceId: 'gemini-voice-1' },
    });

    expect(screen.getByText(/Gemini 3\.1 Flash uses the selected voice and style instructions in your text\./i)).toBeInTheDocument();
  });

  it('does not render ElevenLabs Voice Quality for Gemini', () => {
    renderTTSSettings({
      settings: { ttsProvider: 'gemini', ttsVoiceId: 'gemini-voice-1' },
    });

    expect(screen.queryByText('Voice Quality')).not.toBeInTheDocument();
  });

  it('still shows subscription copy for healthy premium providers', () => {
    renderTTSSettings({
      settings: { ttsProvider: 'elevenlabs', ttsVoiceId: 'eleven-voice-1' },
      hasSubscription: false,
    });

    expect(screen.getByText(/Pro subscription required for ElevenLabs voices/i)).toBeInTheDocument();
  });

  it('does not render credential or unavailable provider copy', () => {
    renderTTSSettings({
      status: {
        elevenLabsAvailable: false,
        azureAvailable: false,
        geminiAvailable: false,
      },
    });

    const renderedText = document.body.textContent ?? '';
    expect(renderedText).not.toMatch(/API key/i);
    expect(renderedText).not.toMatch(/Subscription key/i);
    expect(renderedText).not.toMatch(/\(unavailable\)/i);
    expect(renderedText).not.toMatch(/\(offline\)/i);
  });

  it('silently saves Browser TTS when the saved cloud provider is confirmed unavailable online', async () => {
    renderTTSSettings({
      settings: { ttsProvider: 'elevenlabs', ttsVoiceId: 'eleven-voice-1' },
      status: {
        elevenLabsAvailable: false,
        elevenLabsVoicesLoaded: true,
      },
    });

    await waitFor(() => {
      expect(mockUpdateSetting).toHaveBeenCalledWith('ttsProvider', 'browser');
    });
  });

  it('uses Browser TTS display while offline without overwriting a saved cloud provider', () => {
    renderTTSSettings({
      settings: { ttsProvider: 'elevenlabs', ttsVoiceId: 'eleven-voice-1' },
      isOnline: false,
    });

    expect(screen.getByRole('button', { name: 'Browser TTS' })).toBeInTheDocument();
    expect(mockUpdateSetting).not.toHaveBeenCalledWith('ttsProvider', 'browser');
  });
});
