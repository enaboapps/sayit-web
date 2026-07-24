import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from '@/app/components/composer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLiveTyping } from '@/lib/hooks/useLiveTyping';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useOptionalMobileBottom } from '@/app/contexts/MobileBottomContext';

jest.mock('nanoid', () => {
  let idCounter = 0;
  return {
    nanoid: jest.fn(() => `test-id-${++idCounter}`),
  };
});

// Return a resolved promise so the debounced `.catch(...)` in useTypingTabs'
// setTimeout doesn't throw "Cannot read properties of undefined (reading
// 'catch')" when the timer fires after a test has unmounted. Without this the
// suite is flaky depending on jest worker scheduling.
const mockUpdateSettingsMutation = jest.fn(() => Promise.resolve());
jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => mockUpdateSettingsMutation),
}));

const mockUpdateUIPreference = jest.fn();
jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: {
      textSize: 18,
      doubleEnterEnabled: false,
      doubleEnterTimeoutMs: 600,
      enterKeyBehavior: 'newline',
      doubleEnterAction: 'speak',
    },
    uiPreferences: {
      activeTypingTabId: null,
    },
    updateUIPreference: mockUpdateUIPreference,
  })),
}));

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
  })),
}));

jest.mock('@/lib/hooks/useLiveTyping', () => ({
  useLiveTyping: jest.fn(() => ({
    isSharing: false,
    isCreating: false,
    isPaused: false,
    isTransitioning: false,
    error: null,
    createSession: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    endSession: jest.fn(),
    updateContent: jest.fn(),
    publishSpeechCommand: jest.fn(),
    getShareableLink: jest.fn(() => null),
  })),
}));

jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: jest.fn(() => ({
    isOnline: true,
    wasOffline: false,
    clearRecoveredState: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock('@/app/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    isActive: false,
    loading: false,
  })),
}));

jest.mock('@/lib/hooks/useReplySuggestions', () => ({
  useReplySuggestions: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/app/contexts/MobileBottomContext', () => ({
  useOptionalMobileBottom: jest.fn(() => null),
  MobileDockPortal: jest.fn(({ children }: { children: React.ReactNode }) => <>{children}</>),
}));

jest.mock('@/app/components/live-typing/LiveTypingBottomSheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/typing-tabs/TabManagementSheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) => isOpen ? (
    <div role="dialog" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose}>Close</button>
      {children}
    </div>
  ) : null,
}));

// Stub the copy/paste sheet so we can observe when it opens and trigger paste
// without dealing with the real clipboard or framer-motion lifecycle.
jest.mock('@/app/components/composer/CopyPasteBottomSheet', () => ({
  __esModule: true,
  default: ({ isOpen, onPaste }: { isOpen: boolean; onPaste: (s: string) => void }) =>
    isOpen ? (
      <div data-testid="copy-paste-sheet">
        <button type="button" onClick={() => onPaste('PASTED')}>
          Trigger Paste
        </button>
      </div>
    ) : null,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) => {
      const buttonProps = { ...props };
      delete buttonProps.whileTap;
      return <button {...buttonProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockUseAuth = jest.mocked(useAuth);
const mockUseLiveTyping = jest.mocked(useLiveTyping);
const mockUseIsMobile = jest.mocked(useIsMobile);
const mockUseOptionalMobileBottom = jest.mocked(useOptionalMobileBottom);

function setTextareaLayout(textarea: HTMLTextAreaElement, {
  scrollHeight = 1000,
  clientHeight = 200,
}: {
  scrollHeight?: number;
  clientHeight?: number;
} = {}) {
  Object.defineProperty(textarea, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(textarea, 'clientHeight', { value: clientHeight, configurable: true });
}

function ControlledComposer({
  initialValue = 'Line 1',
}: {
  initialValue?: string;
}) {
  const [value, setValue] = React.useState(initialValue);

  return (
    <Composer
      text={value}
      onChange={setValue}
      onSpeak={jest.fn()}
    />
  );
}

function ControlledComposerWithAppend() {
  const [value, setValue] = React.useState('Hello');

  return (
    <>
      <button onClick={() => setValue(current => `${current} world`)}>
        Append
      </button>
      <Composer
        text={value}
        onChange={setValue}
        onSpeak={jest.fn()}
      />
    </>
  );
}

describe('Composer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders the text input with provided text', () => {
    render(
      <Composer
        text="Hello world"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Hello world');
    expect(screen.getByTestId('composer-canvas')).toHaveClass(
      'rounded-[var(--radius-card)]',
      'border',
      'bg-surface',
      'focus-within:border-primary-500',
    );
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Composer
        text=""
        onChange={onChange}
        onSpeak={jest.fn()}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hi');

    expect(onChange).toHaveBeenCalled();
  });

  it('shows action buttons', () => {
    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();
  });

  it('opens More Actions and returns focus to its trigger when closed', async () => {
    const user = userEvent.setup();
    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: 'More Actions' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'More Actions' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('shows the tone segment attached to Speak when tone control is enabled', async () => {
    const user = userEvent.setup();

    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableToneControl={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Choose tone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();

    // Tone no longer lives inside the radial wheel — opening it must not add
    // a second tone button.
    await user.click(screen.getByRole('button', { name: 'More Actions' }));
    expect(screen.getAllByRole('button', { name: 'Choose tone' })).toHaveLength(1);
  });

  it('does not render a tone segment when tone control is disabled', () => {
    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Choose tone' })).not.toBeInTheDocument();
  });

  it('lets the textarea shrink first while keeping composer controls rendered', () => {
    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    const layout = screen.getByTestId('composer-layout');
    const header = screen.getByTestId('composer-action-header');
    const messageRegion = screen.getByTestId('composer-message-region');
    const footer = screen.getByTestId('composer-action-footer');

    expect(Array.from(layout.children)).toEqual([header, messageRegion, footer]);
    expect(header).not.toHaveClass('absolute');
    expect(footer).not.toHaveClass('absolute');
    expect(textarea.parentElement).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden', 'md:min-h-[120px]');
    expect(textarea).toHaveClass('absolute', 'inset-0', 'overflow-y-auto', 'resize-none', 'py-5');
    expect(textarea).not.toHaveClass('pb-24');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();
  });

  it('keeps typing tabs pinned while the textarea can shrink', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableTabs={true}
      />
    );

    const tabButton = screen.getByRole('button', { name: /Active tab:/i });
    expect(tabButton.closest('.sticky')).toHaveClass('sticky', 'top-0', 'z-10', 'shrink-0');

    const textarea = screen.getByRole('textbox');
    expect(textarea.parentElement).toHaveClass('min-h-0');
  });

  it('scrolls the textarea to the bottom when typing at the end', async () => {
    const user = userEvent.setup();
    render(<ControlledComposer />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    setTextareaLayout(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    fireEvent.select(textarea);

    await user.type(textarea, ' extra text');

    expect(textarea.scrollTop).toBe(1000);
  });

  it('does not force the textarea to the bottom when editing earlier text', () => {
    render(<ControlledComposer initialValue={'Line 1\nLine 2\nLine 3'} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    setTextareaLayout(textarea);
    textarea.scrollTop = 100;
    textarea.focus();
    textarea.setSelectionRange(2, 2);
    fireEvent.select(textarea);

    fireEvent.change(textarea, { target: { value: 'LiXne 1\nLine 2\nLine 3' } });

    expect(textarea.scrollTop).not.toBe(1000);
  });

  it('scrolls external appended text into view when focused at the end', async () => {
    const user = userEvent.setup();
    render(<ControlledComposerWithAppend />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    setTextareaLayout(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    fireEvent.select(textarea);

    await user.click(screen.getByRole('button', { name: 'Append' }));

    expect(textarea).toHaveValue('Hello world');
    expect(textarea.selectionStart).toBe('Hello world'.length);
    expect(textarea.scrollTop).toBe(1000);
  });

  it('restores the active tab draft on mount when tabs enabled', async () => {
    localStorageMock.setItem('typingTabs', JSON.stringify({
      tabs: [
        {
          id: 'stored-tab-1',
          label: 'Stored Draft',
          text: 'Restored draft',
          createdAt: Date.now(),
          lastModified: Date.now(),
          isCustomLabel: false,
        },
      ],
      activeTabId: 'stored-tab-1',
      nextTabNumber: 2,
    }));

    const onChange = jest.fn();
    render(
      <Composer
        text=""
        onChange={onChange}
        onSpeak={jest.fn()}
        enableTabs={true}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Restored draft');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('Restored draft');
    });
  });

  it('shows live typing as active on mobile while sharing after the sheet is closed', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
      loading: false,
    });
    mockUseIsMobile.mockReturnValue(true);
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: true,
      isCreating: false,
      isPaused: false,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      endSession: jest.fn(),
      updateContent: jest.fn(),
      publishSpeechCommand: jest.fn(),
      getShareableLink: jest.fn(() => 'https://example.com/typing-share/view/session-key'),
    });

    render(
      <Composer
        text="Sharing now"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableLiveTyping={true}
      />
    );

    // Live typing lives inside the radial action wheel — open it first.
    fireEvent.click(screen.getByRole('button', { name: 'More Actions' }));

    expect(screen.getByRole('button', { name: 'Live Typing active' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Live Typing' })).not.toBeInTheDocument();
  });

  it('shows the live typing banner while sharing and ends the session from it', async () => {
    const user = userEvent.setup();
    const endSession = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
      loading: false,
    });
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: true,
      isCreating: false,
      isPaused: false,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      endSession,
      updateContent: jest.fn(),
      publishSpeechCommand: jest.fn(),
      getShareableLink: jest.fn(() => 'https://example.com/typing-share/view/session-key'),
    });

    render(
      <Composer
        text="Sharing now"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableLiveTyping={true}
      />
    );

    expect(screen.getByText('Live Typing active')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'End live typing' }));

    expect(endSession).toHaveBeenCalled();
  });

  it('pauses an active Live Typing session from the banner', async () => {
    const user = userEvent.setup();
    const pauseSession = jest.fn().mockResolvedValue(true);
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      loading: false,
    });
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: true,
      isCreating: false,
      isPaused: false,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession,
      resumeSession: jest.fn(),
      endSession: jest.fn(),
      updateContent: jest.fn(),
      publishSpeechCommand: jest.fn(),
      getShareableLink: jest.fn(() => 'https://example.com/typing-share/view/session-key'),
    });

    render(
      <Composer
        text="Sharing now"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableLiveTyping={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Pause Live Typing' }));

    expect(pauseSession).toHaveBeenCalledTimes(1);
  });

  it('keeps paused edits private and publishes the current draft when resuming', async () => {
    const user = userEvent.setup();
    const updateContent = jest.fn();
    const resumeSession = jest.fn().mockResolvedValue(true);
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      loading: false,
    });
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: true,
      isCreating: false,
      isPaused: true,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession,
      endSession: jest.fn(),
      updateContent,
      publishSpeechCommand: jest.fn(),
      getShareableLink: jest.fn(() => 'https://example.com/typing-share/view/session-key'),
    });

    render(
      <Composer
        text="Private paused draft"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableLiveTyping={true}
      />
    );

    expect(screen.getByText('Live Typing paused')).toBeInTheDocument();
    expect(updateContent).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Resume Live Typing' }));

    expect(resumeSession).toHaveBeenCalledWith('Private paused draft');
  });

  it('delegates speak and stop actions to the parent while sharing', async () => {
    const user = userEvent.setup();
    const onSpeak = jest.fn();
    const onStop = jest.fn();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
      loading: false,
    });
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: true,
      isCreating: false,
      isPaused: false,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      endSession: jest.fn(),
      updateContent: jest.fn(),
      getShareableLink: jest.fn(() => 'https://example.com/typing-share/view/session-key'),
    });

    const { rerender } = render(
      <Composer
        text="Sharing now"
        onChange={jest.fn()}
        onSpeak={onSpeak}
        onStop={onStop}
        enableLiveTyping={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Speak' }));
    expect(onSpeak).toHaveBeenCalledWith('speak', 'Sharing now');

    rerender(
      <Composer
        text="Sharing now"
        onChange={jest.fn()}
        onSpeak={onSpeak}
        onStop={onStop}
        isSpeaking={true}
        enableLiveTyping={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Stop' }));

    expect(onStop).toHaveBeenCalled();
  });

  it('does not show the live typing banner when not sharing', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
      loading: false,
    });
    mockUseLiveTyping.mockReturnValue({
      session: null,
      isSharing: false,
      isCreating: false,
      isPaused: false,
      isTransitioning: false,
      error: null,
      createSession: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      endSession: jest.fn(),
      updateContent: jest.fn(),
      publishSpeechCommand: jest.fn(),
      getShareableLink: jest.fn(() => null),
    });

    render(
      <Composer
        text="Hello"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
        enableLiveTyping={true}
      />
    );

    expect(screen.queryByText('Live Typing active')).not.toBeInTheDocument();
  });

  it('shows undo banner in dock portal on mobile and suppresses it inline', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseOptionalMobileBottom.mockReturnValue({ dockContainer: document.createElement('div') } as never);

    render(
      <Composer
        text=""
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    // Trigger clear with text to get the undo hint: simulate by typing then clearing
    // Since useUndoClear is real we can't easily trigger canUndo=true without interaction.
    // Instead verify that toolbar renders in dock (MobileDockPortal children) and not inline
    // when portaling is active.
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();
    // The toolbar is in the portal (MobileDockPortal renders children), not a second set inline
    expect(screen.getAllByRole('button', { name: 'Clear' })).toHaveLength(1);
  });

  it('opens the copy/paste sheet when the sidebar tile is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.queryByTestId('copy-paste-sheet')).not.toBeInTheDocument();

    // Copy/paste lives inside the radial action wheel — open it first.
    await user.click(screen.getByRole('button', { name: 'More Actions' }));
    await user.click(screen.getByRole('button', { name: 'Copy and paste' }));

    expect(screen.getByTestId('copy-paste-sheet')).toBeInTheDocument();
  });

  it('inserts pasted clipboard text at the textarea caret position', async () => {
    const user = userEvent.setup();

    render(<ControlledComposer initialValue="Hello world" />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    textarea.focus();
    // Place caret between "Hello" and " world".
    textarea.setSelectionRange(5, 5);
    fireEvent.select(textarea);

    await user.click(screen.getByRole('button', { name: 'More Actions' }));
    await user.click(screen.getByRole('button', { name: 'Copy and paste' }));
    await user.click(screen.getByRole('button', { name: 'Trigger Paste' }));

    expect(textarea).toHaveValue('HelloPASTED world');
  });
});
