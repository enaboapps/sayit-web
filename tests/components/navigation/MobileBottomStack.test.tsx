import { render, screen, waitFor } from '@testing-library/react';
import MobileBottomStack from '@/app/components/navigation/MobileBottomStack';
import { MobileBottomProvider } from '@/app/contexts/MobileBottomContext';

jest.mock('@/app/components/navigation/BottomTabBar', () => ({
  __esModule: true,
  default: () => <nav aria-label="Bottom navigation">Bottom navigation</nav>,
}));

describe('MobileBottomStack', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('publishes the measured stack height for content padding', async () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 390,
      height: 142,
      top: 0,
      right: 390,
      bottom: 142,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect);

    render(
      <MobileBottomProvider>
        <MobileBottomStack />
      </MobileBottomProvider>
    );

    await waitFor(() => {
      expect(setPropertySpy).toHaveBeenCalledWith('--active-bottom-stack-height', '142px');
    });
  });
});
