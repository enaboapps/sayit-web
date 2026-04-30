import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import InstallBanner from '@/app/components/navigation/InstallBanner';

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

describe('InstallBanner', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('shows a custom install banner when beforeinstallprompt fires', async () => {
    const prompt = jest.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

    render(<InstallBanner />);

    const event = new Event('beforeinstallprompt') as Event & {
      prompt: typeof prompt;
      userChoice: typeof userChoice;
      preventDefault: jest.Mock;
    };
    event.prompt = prompt;
    event.userChoice = userChoice;
    event.preventDefault = jest.fn();

    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/Install SayIt! for faster offline access/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      await userChoice;
    });

    expect(prompt).toHaveBeenCalled();
  });

  it('shows iOS guidance when install prompt is unavailable', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    render(<InstallBanner />);

    expect(
      screen.getByText(/tap Share and choose Add to Home Screen/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('does not render when already installed in standalone mode', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<InstallBanner />);

    expect(screen.queryByText(/Install SayIt!/i)).not.toBeInTheDocument();
  });

  it('stays hidden after explicit dismissal', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    const { rerender } = render(<InstallBanner />);

    fireEvent.click(screen.getByRole('button', { name: /Dismiss install banner/i }));

    rerender(<InstallBanner />);

    expect(screen.queryByText(/Install SayIt!/i)).not.toBeInTheDocument();
    expect(localStorageMock.getItem('pwaInstallBannerDismissed')).toBe('true');
  });
});
