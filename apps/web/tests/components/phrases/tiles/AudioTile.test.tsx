import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioTile from '@/app/components/phrases/tiles/AudioTile';

describe('AudioTile', () => {
  const baseTile = {
    id: 'tile-1',
    audioLabel: 'Greeting',
    audioUrl: 'https://example.com/audio.webm',
  };

  const originalAudio = global.Audio;
  const play = jest.fn(() => Promise.resolve());
  const pause = jest.fn();

  beforeEach(() => {
    play.mockClear();
    pause.mockClear();
    global.Audio = jest.fn().mockImplementation(() => ({
      play,
      pause,
      currentTime: 0,
      src: '',
      onended: null,
      onerror: null,
    })) as unknown as typeof Audio;
  });

  afterAll(() => {
    global.Audio = originalAudio;
  });

  it('renders the label and play aria label', () => {
    render(<AudioTile tile={baseTile} textSizePx={20} />);

    expect(screen.getByText('Greeting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play audio tile: Greeting' })).toBeInTheDocument();
    expect(screen.getByText('Greeting')).toHaveStyle({ fontSize: '20px' });
  });

  it('plays audio when clicked', async () => {
    render(<AudioTile tile={baseTile} textSizePx={20} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play audio tile: Greeting' }));

    expect(global.Audio).toHaveBeenCalledWith(baseTile.audioUrl);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('stops audio on a second click while playing', async () => {
    render(<AudioTile tile={baseTile} textSizePx={20} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play audio tile: Greeting' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop audio tile: Greeting' }));

    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state when the audio URL is unavailable', async () => {
    render(<AudioTile tile={{ ...baseTile, audioUrl: null }} textSizePx={20} />);

    const button = screen.getByRole('button', { name: 'Greeting (audio is unavailable)' });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(button);
    expect(play).not.toHaveBeenCalled();
  });

  it('uses tap-to-edit when onEdit is supplied', async () => {
    const onEdit = jest.fn();
    render(<AudioTile tile={baseTile} onEdit={onEdit} textSizePx={20} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit audio tile: Greeting' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(play).not.toHaveBeenCalled();
  });

  it('calls onLongPress after the long-press threshold', () => {
    jest.useFakeTimers();
    const onLongPress = jest.fn();
    render(<AudioTile tile={baseTile} onLongPress={onLongPress} textSizePx={20} />);

    const button = screen.getByRole('button', { name: 'Play audio tile: Greeting' });
    fireEvent.mouseDown(button);
    jest.advanceTimersByTime(500);
    fireEvent.mouseUp(button);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
