import { TextToSpeech } from '@/lib/tts';

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  voice?: SpeechSynthesisVoice;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('TextToSpeech', () => {
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalUtterance = global.SpeechSynthesisUtterance;

  beforeEach(() => {
    Object.defineProperty(global, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: jest.fn(() => []),
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        paused: false,
        onvoiceschanged: null,
      },
    });

    (TextToSpeech as unknown as { instance?: TextToSpeech }).instance = undefined;
  });

  afterAll(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: originalSpeechSynthesis,
    });

    Object.defineProperty(global, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: originalUtterance,
    });
  });

  it('does not trigger speech synthesis during initialization', () => {
    const tts = TextToSpeech.getInstance();

    expect(tts.isAvailable()).toBe(true);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('refreshes voices and speaks only when requested by the user', () => {
    const getVoices = jest.fn(() => [
      {
        name: 'Test Voice',
        lang: 'en-US',
        voiceURI: 'voice:test',
      } as SpeechSynthesisVoice,
    ]);

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices,
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        paused: false,
        onvoiceschanged: null,
      },
    });

    const tts = TextToSpeech.getInstance();
    tts.speak('Hello there', { voiceURI: 'voice:test' });

    expect(getVoices).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });
});
