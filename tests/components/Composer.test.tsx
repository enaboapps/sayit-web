import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from '@/app/components/Composer';

jest.mock('nanoid', () => {
  let idCounter = 0;
  return {
    nanoid: jest.fn(() => `test-id-${++idCounter}`),
  };
});

const mockUpdateSettingsMutation = jest.fn();
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
    createSession: jest.fn(),
    endSession: jest.fn(),
    updateContent: jest.fn(),
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

jest.mock('@/app/components/live-typing/LiveTypingBottomSheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/live-typing/LiveTypingLinkModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/typing-tabs/MobileTabList', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/typing-tabs/TabManagementDialog', () => ({
  __esModule: true,
  default: () => null,
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

  it('shows action buttons when text exists', () => {
    render(
      <Composer
        text="Some text"
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('hides action buttons when text is empty', () => {
    render(
      <Composer
        text=""
        onChange={jest.fn()}
        onSpeak={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
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
});
