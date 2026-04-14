import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

const mockUseAuth = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

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

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the loading screen while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<Home />);

    expect(screen.getByText('Loading Screen')).toBeInTheDocument();
  });

  it('shows the loading screen while a signed-in profile is loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    render(<Home />);

    expect(screen.getByText('Loading Screen')).toBeInTheDocument();
  });

  it('shows the guest experience when startup data is ready without a user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseQuery.mockReturnValue(null);

    render(<Home />);

    expect(screen.getByText('Guest Communication')).toBeInTheDocument();
    expect(screen.getByText('Home Features')).toBeInTheDocument();
  });

  it('shows the signed-in experience when startup data is available', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_123', email: 'user@example.com' },
      loading: false,
    });
    mockUseQuery.mockReturnValue({ role: 'communicator' });

    const { container } = render(<Home />);

    expect(screen.getByText('Phrases Interface')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('h-full', 'min-h-0', 'overflow-hidden');
  });
});
