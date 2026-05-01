import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FixedAACGrid from '@/app/components/phrases/FixedAACGrid';
import type { BoardTileSummary } from '@/app/components/phrases/types';

const tiles: BoardTileSummary[] = [
  {
    id: 'tile-1',
    kind: 'phrase',
    position: 0,
    cellRow: 0,
    cellColumn: 0,
    tileRole: 'core',
    wordClass: 'verb',
    isLocked: true,
    phrase: { id: 'phrase-1', text: 'go' },
  },
  {
    id: 'tile-2',
    kind: 'phrase',
    position: 5,
    cellRow: 1,
    cellColumn: 2,
    tileRole: 'core',
    wordClass: 'question',
    phrase: { id: 'phrase-2', text: 'what' },
  },
];

const baseProps = {
  tiles,
  rows: 3,
  columns: 4,
  activePhraseId: null,
  isSpeaking: false,
  isEditMode: false,
  canEdit: false,
  textSizePx: 18,
  onPhrasePress: jest.fn(),
  onPhraseStop: jest.fn(),
  onPhraseEdit: jest.fn(),
  onNavigateTap: jest.fn(),
  onNavigateEdit: jest.fn(),
  onAudioEdit: jest.fn(),
};

describe('FixedAACGrid', () => {
  it('renders exact fixed-grid dimensions without responsive column changes', () => {
    render(<FixedAACGrid {...baseProps} />);

    const grid = screen.getByTestId('fixed-aac-grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(4, minmax(77px, 1fr))',
      gridTemplateRows: 'repeat(3, minmax(77px, 1fr))',
    });
    expect(screen.getByRole('button', { name: 'Speak phrase: go' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empty cell row 3, column 4' })).toBeInTheDocument();
  });

  it('moves a selected tile into an empty cell in edit mode', async () => {
    const user = userEvent.setup();
    const onMoveTileToCell = jest.fn();

    render(
      <FixedAACGrid
        {...baseProps}
        isEditMode
        canEdit
        onMoveTileToCell={onMoveTileToCell}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Select tile in row 1, column 1 to move' }));
    await user.click(screen.getByRole('button', { name: 'Move selected tile to row 3, column 4' }));

    expect(onMoveTileToCell).toHaveBeenCalledWith('tile-1', 2, 3);
  });
});
