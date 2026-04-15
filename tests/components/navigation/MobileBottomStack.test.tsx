import { render, screen } from '@testing-library/react';
import MobileBottomStack from '@/app/components/navigation/MobileBottomStack';
import { MobileBottomProvider } from '@/app/contexts/MobileBottomContext';

jest.mock('@/app/components/navigation/BottomTabBar', () => ({
  __esModule: true,
  default: () => <nav aria-label="Bottom navigation">Bottom navigation</nav>,
}));

describe('MobileBottomStack', () => {
  it('positions the mobile stack above the keyboard using native CSS keyboard inset', () => {
    const { container } = render(
      <MobileBottomProvider>
        <MobileBottomStack />
      </MobileBottomProvider>
    );

    const stack = container.firstElementChild;
    expect(stack).toHaveClass('bottom-keyboard-aware');

    const nav = screen.getByRole('navigation', { name: 'Bottom navigation' });
    expect(nav).toBeInTheDocument();
  });
});
