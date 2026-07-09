import { render, screen } from '@testing-library/react';
import BottomTabBar from '@/app/components/navigation/BottomTabBar';

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
jest.mock('@/app/hooks/useSubscription', () => ({
  useSubscription: () => ({ isActive: false }),
}));

describe('BottomTabBar', () => {
  it('renders persistent guest navigation with the current page identified', () => {
    render(<BottomTabBar />);

    expect(screen.getByRole('navigation', { name: 'Bottom navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });
});
