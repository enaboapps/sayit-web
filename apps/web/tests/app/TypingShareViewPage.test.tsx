import { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import TypingShareViewPage from '@/app/typing-share/view/[key]/page';

let mockSession: unknown;
const mockEnableAudio = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => mockSession),
}));

jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    uiPreferences: { typingShareFontSize: 24 },
    updateUIPreference: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useTypingShareSpeech', () => ({
  useTypingShareSpeech: jest.fn(() => ({
    audioEnabled: true,
    enableAudio: mockEnableAudio,
    isSpeaking: false,
    error: null,
  })),
}));

jest.mock('@/app/components/phrases/AnimatedLoading', () => ({
  __esModule: true,
  default: () => <div>Loading</div>,
}));

async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={<div>Suspended</div>}>
        <TypingShareViewPage params={Promise.resolve({ key: 'session-key' })} />
      </Suspense>
    );
  });
}

describe('TypingShareViewPage', () => {
  it('keeps the last shared text visible and announces a paused session', async () => {
    mockSession = {
      content: 'Last shared message',
      isPaused: true,
      expiresAt: Date.now() + 60_000,
    };

    await renderPage();

    expect(await screen.findByText('Last shared message')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The communicator has paused sharing. The last shared message remains visible.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Paused');
    expect(screen.getByText('Audio paused')).toBeInTheDocument();
  });

  it('shows the normal connected state for active and legacy sessions', async () => {
    mockSession = {
      content: 'Visible live update',
      expiresAt: Date.now() + 60_000,
    };

    await renderPage();

    expect(await screen.findByText('Visible live update')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Connected');
    expect(
      screen.getByText('You are viewing a live typing session. Updates appear in real-time.')
    ).toBeInTheDocument();
  });
});
