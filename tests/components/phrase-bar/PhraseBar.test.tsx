import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import PhraseBar from '@/app/components/phrase-bar/PhraseBar';
import { PhraseBarProvider } from '@/app/contexts/PhraseBarContext';

const mockSpeak = jest.fn();
const mockSettings = {
  textSize: 18,
  usePhraseBar: true,
  speakPhrasesOnTap: false,
};

jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: mockSettings,
  })),
}));

jest.mock('@/lib/hooks/useTTS', () => ({
  useTTS: jest.fn(() => ({
    speak: mockSpeak,
    stop: jest.fn(),
    isSpeaking: false,
    isAvailable: true,
  })),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <PhraseBarProvider>{children}</PhraseBarProvider>;
}

describe('PhraseBar', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockSpeak.mockClear();
    mockSettings.usePhraseBar = true;
  });

  it('renders nothing when the master toggle is off', () => {
    mockSettings.usePhraseBar = false;
    const { container } = render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the empty-state hint when enabled but no items exist', () => {
    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );
    expect(
      screen.getByText(/Tap a Phrase to add it to the Phrase Bar/i)
    ).toBeInTheDocument();
    // No control buttons when empty
    expect(screen.queryByLabelText(/Speak all phrases/i)).toBeNull();
    expect(screen.queryByLabelText(/Remove the last phrase/i)).toBeNull();
    expect(screen.queryByLabelText(/Clear the phrase bar/i)).toBeNull();
  });

  it('renders chips and control buttons when items exist (hydrated from sessionStorage)', () => {
    window.sessionStorage.setItem(
      'phraseBarItems',
      JSON.stringify([
        { id: 'a', text: 'I' },
        { id: 'b', text: 'need' },
        { id: 'c', text: 'water' },
      ])
    );

    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );

    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('need')).toBeInTheDocument();
    expect(screen.getByText('water')).toBeInTheDocument();
    expect(screen.getByLabelText(/Speak all phrases/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remove the last phrase/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Clear the phrase bar/i)).toBeInTheDocument();
    // Empty-state hint should not be visible when chips are present.
    expect(
      screen.queryByText(/Tap a Phrase to add it to the Phrase Bar/i)
    ).toBeNull();
  });

  it('Speak all invokes TTS with the joined text', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      'phraseBarItems',
      JSON.stringify([
        { id: 'a', text: 'I' },
        { id: 'b', text: 'need' },
        { id: 'c', text: 'water' },
      ])
    );

    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );

    await user.click(screen.getByLabelText(/Speak all phrases/i));
    expect(mockSpeak).toHaveBeenCalledWith('I need water');
  });

  it('Remove last pops the newest chip', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      'phraseBarItems',
      JSON.stringify([
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
      ])
    );

    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );

    expect(screen.getByText('two')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Remove the last phrase/i));
    expect(screen.queryByText('two')).toBeNull();
    expect(screen.getByText('one')).toBeInTheDocument();
  });

  it('Clear empties the bar and reveals the empty-state hint', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      'phraseBarItems',
      JSON.stringify([
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
      ])
    );

    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );

    await user.click(screen.getByLabelText(/Clear the phrase bar/i));
    expect(screen.queryByText('one')).toBeNull();
    expect(screen.queryByText('two')).toBeNull();
    expect(
      screen.getByText(/Tap a Phrase to add it to the Phrase Bar/i)
    ).toBeInTheDocument();
  });

  it('does nothing when Speak all is pressed on whitespace-only content', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      'phraseBarItems',
      JSON.stringify([{ id: 'a', text: '   ' }])
    );

    render(
      <Wrapper>
        <PhraseBar />
      </Wrapper>
    );

    await user.click(screen.getByLabelText(/Speak all phrases/i));
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
