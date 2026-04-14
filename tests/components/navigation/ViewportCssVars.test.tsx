import { render, waitFor } from '@testing-library/react';
import ViewportCssVars from '@/app/components/navigation/ViewportCssVars';

describe('ViewportCssVars', () => {
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;

  const setViewport = ({ height, offsetTop }: { height: number; offsetTop: number }) => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height,
        offsetTop,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });
  };

  afterEach(() => {
    document.documentElement.style.removeProperty('--visual-viewport-height');
    document.documentElement.style.removeProperty('--keyboard-inset');
    delete document.documentElement.dataset.keyboardOpen;
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it('sets visual viewport and keyboard CSS variables', async () => {
    setViewport({ height: 500, offsetTop: 20 });

    render(<ViewportCssVars />);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--visual-viewport-height')).toBe('500px');
      expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('280px');
      expect(document.documentElement.dataset.keyboardOpen).toBe('true');
    });
  });

  it('cleans up CSS variables and keyboard data on unmount', async () => {
    setViewport({ height: 760, offsetTop: 0 });

    const { unmount } = render(<ViewportCssVars />);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--visual-viewport-height')).toBe('760px');
      expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('40px');
      expect(document.documentElement.dataset.keyboardOpen).toBe('false');
    });

    unmount();

    expect(document.documentElement.style.getPropertyValue('--visual-viewport-height')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('');
    expect(document.documentElement.dataset.keyboardOpen).toBeUndefined();
  });
});
