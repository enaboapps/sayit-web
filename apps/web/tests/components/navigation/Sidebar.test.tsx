import { render, screen } from '@testing-library/react';
import Sidebar from '@/app/components/Sidebar';

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
jest.mock('@/app/hooks/useSubscription', () => ({
  useSubscription: () => ({ isActive: false }),
}));

describe('Sidebar', () => {
  it('renders a stable labelled navigation rail for guests', () => {
    render(<Sidebar />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Support' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('w-24');

    const homeLink = screen.getByRole('link', { name: 'SayIt! home' });
    expect(homeLink.querySelector('[data-testid="brand-mark"]')).toHaveClass('text-foreground');
    expect(homeLink.querySelector('img')).not.toBeInTheDocument();
  });
});
