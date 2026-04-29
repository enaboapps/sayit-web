import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardActionButtons from '@/app/components/phrases/BoardActionButtons';

describe('BoardActionButtons', () => {
  it('shows recorded audio in the add tile menu and calls its handler', async () => {
    const onAddPhrase = jest.fn();
    const onAddNavigateTile = jest.fn();
    const onAddAudioTile = jest.fn();

    render(
      <BoardActionButtons
        onAddPhrase={onAddPhrase}
        onAddNavigateTile={onAddNavigateTile}
        onAddAudioTile={onAddAudioTile}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add tile' }));
    await userEvent.click(screen.getByRole('button', { name: 'Recorded audio' }));

    expect(onAddAudioTile).toHaveBeenCalledTimes(1);
    expect(onAddPhrase).not.toHaveBeenCalled();
    expect(onAddNavigateTile).not.toHaveBeenCalled();
  });
});
