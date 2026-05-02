import React from 'react';
import { render, screen } from '@testing-library/react';

const replace = jest.fn();
const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

const mockUseAuth = jest.fn();
jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
}));

jest.mock('@/convex/_generated/api', () => ({
  api: {
    profiles: {
      getProfile: 'profiles.getProfile',
    },
  },
}));

jest.mock('@/lib/hooks/useTTS', () => ({
  useTTS: () => ({
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: false,
    isAvailable: true,
  }),
}));

jest.mock('@/app/components/composer', () => ({
  __esModule: true,
  default: () => <div data-testid="composer" />,
}));

jest.mock('@/app/components/phrases/AnimatedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}));

import TryPage from '@/app/try/page';

describe('TryPage', () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    mockUseAuth.mockReset();
    mockUseQuery.mockReset();
  });

  it('shows the loading screen while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<TryPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('composer')).not.toBeInTheDocument();
  });

  it('renders the composer + Create account CTA when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseQuery.mockReturnValue(null);

    render(<TryPage />);

    expect(screen.getByTestId('composer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /try without signing in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/saved boards, writing help, and premium voices need an account/i),
    ).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /create account/i });
    expect(cta).toHaveAttribute('href', '/sign-up');
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects signed-in users to / and does not render the composer', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue({ role: 'communicator' });

    render(<TryPage />);

    expect(replace).toHaveBeenCalledWith('/');
    expect(screen.queryByTestId('composer')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows the loading screen while a signed-in profile is still loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    render(<TryPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
