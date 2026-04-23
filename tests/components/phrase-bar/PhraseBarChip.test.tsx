import { render, screen } from '@testing-library/react';
import PhraseBarChip from '@/app/components/phrase-bar/PhraseBarChip';

describe('PhraseBarChip', () => {
  it('renders the phrase text', () => {
    render(
      <PhraseBarChip
        item={{ id: 'chip-1', text: 'Hello' }}
        textSizePx={18}
      />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders a symbol when symbolUrl is provided', () => {
    render(
      <PhraseBarChip
        item={{
          id: 'chip-2',
          text: 'Water',
          symbolUrl: 'https://example.com/water.png',
        }}
        textSizePx={18}
      />
    );

    const image = screen.getByAltText('Water');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('water.png'));
  });

  it('does not render an image when symbolUrl is absent', () => {
    render(
      <PhraseBarChip
        item={{ id: 'chip-3', text: 'Silent' }}
        textSizePx={18}
      />
    );

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('applies the configured text size', () => {
    render(
      <PhraseBarChip
        item={{ id: 'chip-4', text: 'Sized' }}
        textSizePx={32}
      />
    );

    expect(screen.getByText('Sized')).toHaveStyle({ fontSize: '32px' });
  });
});
