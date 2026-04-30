import { act, fireEvent, render, screen } from '@testing-library/react';
import { useTileGesture } from '@/lib/hooks/useTileGesture';

/**
 * Test harness that mounts the hook against a real DOM element so we can
 * exercise the fireEvent.mouseDown/mouseUp/click sequences the way the
 * tile components consume the hook.
 */
function GestureHarness({
  onLongPress,
  onClick,
  disabled,
}: {
  onLongPress?: () => void;
  onClick: () => void;
  disabled?: boolean;
}) {
  const gesture = useTileGesture({ onLongPress, disabled });
  return (
    <button
      type="button"
      data-testid="harness"
      data-pressed={gesture.isPressed ? 'true' : 'false'}
      data-reduced-motion={gesture.prefersReducedMotion ? 'true' : 'false'}
      onClick={gesture.wrapClick(onClick)}
      {...gesture.bind}
    >
      tap
    </button>
  );
}

describe('useTileGesture', () => {
  describe('press visual', () => {
    it('flips isPressed=true on mouseDown and back to false on mouseUp', () => {
      render(<GestureHarness onClick={jest.fn()} />);
      const btn = screen.getByTestId('harness');

      expect(btn).toHaveAttribute('data-pressed', 'false');
      fireEvent.mouseDown(btn);
      expect(btn).toHaveAttribute('data-pressed', 'true');
      fireEvent.mouseUp(btn);
      expect(btn).toHaveAttribute('data-pressed', 'false');
    });

    it('flips isPressed back to false on mouseLeave (mouse drift away)', () => {
      render(<GestureHarness onClick={jest.fn()} />);
      const btn = screen.getByTestId('harness');

      fireEvent.mouseDown(btn);
      expect(btn).toHaveAttribute('data-pressed', 'true');
      fireEvent.mouseLeave(btn);
      expect(btn).toHaveAttribute('data-pressed', 'false');
    });

    it('flips isPressed back to false on touchCancel', () => {
      render(<GestureHarness onClick={jest.fn()} />);
      const btn = screen.getByTestId('harness');

      fireEvent.touchStart(btn);
      expect(btn).toHaveAttribute('data-pressed', 'true');
      fireEvent.touchCancel(btn);
      expect(btn).toHaveAttribute('data-pressed', 'false');
    });
  });

  describe('long-press', () => {
    it('fires onLongPress at the 500 ms threshold', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();
      try {
        render(<GestureHarness onClick={jest.fn()} onLongPress={onLongPress} />);
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        act(() => { jest.advanceTimersByTime(499); });
        expect(onLongPress).not.toHaveBeenCalled();

        act(() => { jest.advanceTimersByTime(1); });
        expect(onLongPress).toHaveBeenCalledTimes(1);

        // Long-press fire releases the press visual even if the user is
        // still holding — they get visual confirmation it triggered.
        expect(btn).toHaveAttribute('data-pressed', 'false');
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not fire onLongPress when released before the threshold', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();
      try {
        render(<GestureHarness onClick={jest.fn()} onLongPress={onLongPress} />);
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        act(() => { jest.advanceTimersByTime(300); });
        fireEvent.mouseUp(btn);
        act(() => { jest.advanceTimersByTime(500); });

        expect(onLongPress).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not start a timer when onLongPress is undefined', () => {
      jest.useFakeTimers();
      try {
        render(<GestureHarness onClick={jest.fn()} />);
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        // Advance well past the threshold — nothing should fire.
        act(() => { jest.advanceTimersByTime(2_000); });
        // isPressed stays true while the user is holding.
        expect(btn).toHaveAttribute('data-pressed', 'true');
      } finally {
        jest.useRealTimers();
      }
    });

    it('calls navigator.vibrate(50) when long-press fires', () => {
      jest.useFakeTimers();
      const vibrate = jest.fn();
      Object.defineProperty(global.navigator, 'vibrate', {
        configurable: true,
        value: vibrate,
      });
      try {
        render(<GestureHarness onClick={jest.fn()} onLongPress={jest.fn()} />);
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        act(() => { jest.advanceTimersByTime(500); });

        expect(vibrate).toHaveBeenCalledWith(50);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('wrapClick', () => {
    it('suppresses the click that follows a long-press, then resumes', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();
      const onClick = jest.fn();
      try {
        render(<GestureHarness onClick={onClick} onLongPress={onLongPress} />);
        const btn = screen.getByTestId('harness');

        // Natural sequence: mousedown → 500 ms timer fires → mouseup → click.
        fireEvent.mouseDown(btn);
        act(() => { jest.advanceTimersByTime(500); });
        fireEvent.mouseUp(btn);
        fireEvent.click(btn);

        expect(onLongPress).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();

        // The next genuine tap fires onClick — the long-press suppression
        // is one-shot and resets after the swallow.
        fireEvent.click(btn);
        expect(onClick).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('passes a regular click straight through', () => {
      const onClick = jest.fn();
      render(<GestureHarness onClick={onClick} />);
      const btn = screen.getByTestId('harness');

      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled', () => {
    it('disabled=true makes mouseDown a no-op (no press visual, no long-press timer)', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();
      try {
        render(
          <GestureHarness onClick={jest.fn()} onLongPress={onLongPress} disabled />,
        );
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        expect(btn).toHaveAttribute('data-pressed', 'false');
        act(() => { jest.advanceTimersByTime(1_000); });
        expect(onLongPress).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('disabled=true still lets clicks through wrapClick (the caller decides what to do)', () => {
      const onClick = jest.fn();
      render(<GestureHarness onClick={onClick} disabled />);
      const btn = screen.getByTestId('harness');

      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('clears the long-press timer on unmount (no fire after teardown)', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();
      try {
        const { unmount } = render(
          <GestureHarness onClick={jest.fn()} onLongPress={onLongPress} />,
        );
        const btn = screen.getByTestId('harness');

        fireEvent.mouseDown(btn);
        unmount();
        act(() => { jest.advanceTimersByTime(1_000); });

        expect(onLongPress).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
