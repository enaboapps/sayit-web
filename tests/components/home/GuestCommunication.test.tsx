import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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

import GuestCommunication from '@/app/components/home/GuestCommunication';

describe('GuestCommunication', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('renders a Sign In button that navigates to /sign-in', async () => {
    const user = userEvent.setup();
    render(<GuestCommunication />);

    const signIn = screen.getByRole('button', { name: /sign in/i });
    await user.click(signIn);

    expect(push).toHaveBeenCalledWith('/sign-in');
  });

  it('renders a Create Account link pointing at /sign-up', () => {
    render(<GuestCommunication />);

    const createAccount = screen.getByRole('link', { name: /create account/i });
    expect(createAccount).toHaveAttribute('href', '/sign-up');
  });

  it('renders the Composer', () => {
    render(<GuestCommunication />);

    expect(screen.getByTestId('composer')).toBeInTheDocument();
  });

  it('does not render the old marketing chrome', () => {
    render(<GuestCommunication />);

    expect(
      screen.queryByText(/text communication works offline/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/recent on this device/i)).not.toBeInTheDocument();
  });
});
