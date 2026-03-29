import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypingDock from '@/app/components/TypingDock';

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
      typingDockMode: 'expanded',
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

jest.mock('@/lib/hooks/useVisualViewport', () => ({
  useVisualViewport: jest.fn(() => ({
    top: 0,
    height: 0,
  })),
}));

jest.mock('@/app/components/live-typing/LiveTypingBottomSheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/typing-tabs/MobileTabList', () => ({
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
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('TypingDock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('restores the active tab draft into the parent text state on mount', async () => {
    localStorageMock.setItem('typingTabs', JSON.stringify({
      tabs: [
        {
          id: 'stored-tab-1',
          label: 'Stored Draft',
          text: 'Restored mobile draft',
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
      <TypingDock
        text=""
        onChange={onChange}
        onSpeak={jest.fn()}
        enableTabs={true}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Restored mobile draft');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('Restored mobile draft');
    });
  });

  it('speaks the restored draft after mount when the parent adopts it', async () => {
    localStorageMock.setItem('typingTabs', JSON.stringify({
      tabs: [
        {
          id: 'stored-tab-1',
          label: 'Stored Draft',
          text: 'Restored mobile draft',
          createdAt: Date.now(),
          lastModified: Date.now(),
          isCustomLabel: false,
        },
      ],
      activeTabId: 'stored-tab-1',
      nextTabNumber: 2,
    }));

    const user = userEvent.setup();
    const onSpeak = jest.fn();

    function Harness() {
      const [text, setText] = React.useState('');

      return (
        <TypingDock
          text={text}
          onChange={setText}
          onSpeak={onSpeak}
          enableTabs={true}
        />
      );
    }

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('Restored mobile draft');
    });

    await user.click(screen.getByRole('button', { name: 'Speak' }));

    expect(onSpeak).toHaveBeenCalledWith('speak');
  });
});
