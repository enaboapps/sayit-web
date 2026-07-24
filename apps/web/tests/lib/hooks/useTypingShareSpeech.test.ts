import { act, renderHook, waitFor } from '@testing-library/react';
import { useTypingShareSpeech } from '@/lib/hooks/useTypingShareSpeech';
import type { LiveTypingSpeechCommand } from '@/lib/live-typing-speech';

const mockTTSProvider = {
  addCallbacks: jest.fn(() => () => {}),
  setProvider: jest.fn(),
  refreshVoices: jest.fn(),
  loadElevenLabsVoices: jest.fn(async () => {}),
  loadAzureVoices: jest.fn(async () => {}),
  loadGeminiVoices: jest.fn(async () => {}),
  speak: jest.fn(),
  stop: jest.fn(),
};

function getCallbacks() {
  return mockTTSProvider.addCallbacks.mock.calls.at(-1)?.[0];
}

jest.mock('@/lib/tts-provider', () => ({
  TTSProvider: {
    getInstance: jest.fn(() => mockTTSProvider),
  },
}));

function speakCommand(id: string, text = 'Hello'): LiveTypingSpeechCommand {
  return {
    id,
    action: 'speak',
    text,
    createdAt: Date.now(),
    settings: {
      provider: 'browser',
      voiceId: 'missing-browser-voice',
      rate: 1.2,
      pitch: 0.8,
      volume: 0.7,
      stability: 0.4,
      similarityBoost: 0.6,
      modelId: 'eleven_flash_v2_5',
    },
  };
}

describe('useTypingShareSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not play the existing command when audio is first enabled', () => {
    const { result } = renderHook(() => useTypingShareSpeech({
      speechCommand: speakCommand('old-command'),
    }));

    act(() => {
      result.current.enableAudio();
    });

    expect(result.current.audioEnabled).toBe(true);
    expect(mockTTSProvider.speak).not.toHaveBeenCalled();
  });

  it('plays each new command once after audio is enabled', async () => {
    const first = speakCommand('old-command');
    const next = speakCommand('new-command', 'New message');
    const { result, rerender } = renderHook(
      ({ command }: { command?: LiveTypingSpeechCommand }) => useTypingShareSpeech({ speechCommand: command }),
      { initialProps: { command: first } }
    );

    act(() => {
      result.current.enableAudio();
    });

    rerender({ command: next });

    await waitFor(() => {
      expect(mockTTSProvider.speak).toHaveBeenCalledTimes(1);
    });

    rerender({ command: next });

    expect(mockTTSProvider.speak).toHaveBeenCalledTimes(1);
    expect(mockTTSProvider.speak).toHaveBeenCalledWith('New message', expect.objectContaining({
      voiceId: 'missing-browser-voice',
      rate: 1.2,
      pitch: 0.8,
      volume: 0.7,
    }));
  });

  it('stops speech when a stop command arrives after audio is enabled', async () => {
    const { result, rerender } = renderHook(
      ({ command }: { command?: LiveTypingSpeechCommand }) => useTypingShareSpeech({ speechCommand: command }),
      { initialProps: { command: undefined } }
    );

    act(() => {
      result.current.enableAudio();
    });

    rerender({
      command: {
        id: 'stop-command',
        action: 'stop',
        createdAt: Date.now(),
      },
    });

    await waitFor(() => {
      expect(mockTTSProvider.stop).toHaveBeenCalledTimes(1);
    });
  });

  it('stops current speech and ignores commands while sharing is paused', async () => {
    const command = speakCommand('private-command', 'Private message');
    const { result, rerender } = renderHook(
      ({ isPaused, speechCommand }: { isPaused: boolean; speechCommand?: LiveTypingSpeechCommand }) =>
        useTypingShareSpeech({ isPaused, speechCommand }),
      { initialProps: { isPaused: false, speechCommand: undefined as LiveTypingSpeechCommand | undefined } }
    );

    act(() => {
      result.current.enableAudio();
    });

    rerender({ isPaused: true, speechCommand: command });

    await waitFor(() => {
      expect(mockTTSProvider.stop).toHaveBeenCalledTimes(1);
    });
    expect(mockTTSProvider.speak).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('ignores expected browser interruption errors', () => {
    const { result } = renderHook(() => useTypingShareSpeech({}));

    act(() => {
      getCallbacks()?.onStart();
    });

    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      getCallbacks()?.onError(new Error('Speech synthesis error: interrupted'));
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
