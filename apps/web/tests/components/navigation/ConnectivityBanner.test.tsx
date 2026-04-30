import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ConnectivityBanner from '@/app/components/navigation/ConnectivityBanner';

describe('ConnectivityBanner', () => {
  const setOnlineStatus = (isOnline: boolean) => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: isOnline,
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    setOnlineStatus(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not render while online by default', () => {
    render(<ConnectivityBanner />);

    expect(screen.queryByText(/Text communication and browser speech still work/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Connection restored/i)).not.toBeInTheDocument();
  });

  it('renders the offline banner when the browser is offline', () => {
    setOnlineStatus(false);

    render(<ConnectivityBanner />);

    expect(
      screen.getByText(/Text communication and browser speech still work/i)
    ).toBeInTheDocument();
  });

  it('shows a temporary recovery message after reconnecting', () => {
    render(<ConnectivityBanner />);

    act(() => {
      setOnlineStatus(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(
      screen.getByText(/Text communication and browser speech still work/i)
    ).toBeInTheDocument();

    act(() => {
      setOnlineStatus(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText(/Connection restored/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByText(/Connection restored/i)).not.toBeInTheDocument();
  });
});
