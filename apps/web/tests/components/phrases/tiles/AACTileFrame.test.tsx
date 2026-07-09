import { fireEvent, render, screen } from '@testing-library/react';
import AACTileFrame, { type AACTileState } from '@/app/components/phrases/tiles/AACTileFrame';

describe('AACTileFrame', () => {
  it.each<AACTileState>(['idle', 'active', 'editing', 'broken', 'disabled'])(
    'exposes the %s state without losing the tile layout contract',
    (state) => {
      render(
        <AACTileFrame
          kind="phrase"
          state={state}
          label="Hello"
          accessibleLabel="Speak phrase: Hello"
          textSizePx={20}
        />,
      );

      const tile = screen.getByRole('button', { name: 'Speak phrase: Hello' });
      expect(tile).toHaveAttribute('data-tile-state', state);
      expect(tile).toHaveClass('aspect-square', 'min-h-[52px]', 'overflow-hidden');
      expect(screen.getByText('Hello')).toHaveStyle({ fontSize: '20px' });
    },
  );

  it('identifies each kind with semantic data and visible icon content', () => {
    render(
      <AACTileFrame
        kind="navigate"
        label="Food"
        accessibleLabel="Go to board: Food"
        textSizePx={18}
        icon={<span>Arrow</span>}
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-tile-kind', 'navigate');
    expect(screen.getByText('navigate tile')).toHaveClass('sr-only');
  });

  it('activates by click and keyboard but blocks broken and disabled states', () => {
    const onActivate = jest.fn();
    const { rerender } = render(
      <AACTileFrame kind="audio" label="Greeting" accessibleLabel="Play Greeting" textSizePx={18} onActivate={onActivate} />,
    );

    const tile = screen.getByRole('button');
    fireEvent.click(tile);
    fireEvent.keyDown(tile, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledTimes(2);

    rerender(
      <AACTileFrame kind="audio" state="broken" label="Greeting" accessibleLabel="Play Greeting" textSizePx={18} onActivate={onActivate} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });
});
