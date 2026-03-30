import React from 'react';
import { act, render, screen } from '@testing-library/react';
import Home from '@/app/page';

const mockUseAuth = jest.fn();
const mockUseQuery = jest.fn();
const mockUseOnlineStatus = jest.fn();

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
}));

jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

jest.mock('@/convex/_generated/api', () => ({
  api: {
    profiles: {
      getProfile: 'profiles.getProfile',
    },
  },
}));

jest.mock('@/app/components/phrases/AnimatedLoading', () => ({
  __esModule: true,
  default: () => <div>Loading Screen</div>,
}));

jest.mock('@/app/components/home/GuestCommunication', () => ({
  __esModule: true,
  default: () => <div>Guest Communication</div>,
}));

jest.mock('@/app/components/home/HomeFeatures', () => ({
  __esModule: true,
  default: () => <div>Home Features</div>,
}));

jest.mock('@/app/components/home/PhrasesInterface', () => ({
  __esModule: true,
  default: () => <div>Phrases Interface</div>,
}));

jest.mock('@/app/components/connection/ConnectionRequestsBanner', () => ({
  __esModule: true,
  default: () => <div>Connection Requests</div>,
}));

describe('Home startup loading fallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseOnlineStatus.mockReturnValue({ isOnline: true });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows the loading screen during a short auth load', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<Home />);

    expect(screen.getByText('Loading Screen')).toBeInTheDocument();
    expect(screen.queryByText('Guest Communication')).not.toBeInTheDocument();
  });

  it('falls back to guest communication immediately when offline during auth load', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseQuery.mockReturnValue(undefined);
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });

    render(<Home />);

    expect(screen.getByText('Guest Communication')).toBeInTheDocument();
    expect(
      screen.getByText(/You appear to be offline\. Text communication is available below/i)
    ).toBeInTheDocument();
  });

  it('falls back to guest communication after a prolonged online auth load', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<Home />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText('Guest Communication')).toBeInTheDocument();
    expect(
      screen.getByText(/Loading your account is taking longer than expected/i)
    ).toBeInTheDocument();
  });

  it('falls back when a signed-in user profile load stalls', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    render(<Home />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText('Guest Communication')).toBeInTheDocument();
    expect(screen.queryByText('Phrases Interface')).not.toBeInTheDocument();
  });

  it('shows the signed-in experience when startup data is available', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue({ role: 'communicator' });

    render(<Home />);

    expect(screen.getByText('Phrases Interface')).toBeInTheDocument();
  });
});
