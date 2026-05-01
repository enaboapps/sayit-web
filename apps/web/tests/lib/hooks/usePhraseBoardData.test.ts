import { preferredBoardSelection } from '@/lib/hooks/usePhraseBoardData';

const boards = [
  { id: 'hidden-root', hiddenFromPicker: true },
  { id: 'visible-top' },
  { id: 'visible-second', hiddenFromPicker: false },
];

describe('preferredBoardSelection', () => {
  it('defaults to the first visible board when the first board is hidden', () => {
    const selection = preferredBoardSelection(boards, null);

    expect(selection.selectedBoard?.id).toBe('visible-top');
    expect(selection.preferredSelectedBoardId).toBe('visible-top');
    expect(selection.validBoardIndex).toBe(0);
    expect(selection.visibleBoards.map((board) => board.id)).toEqual([
      'visible-top',
      'visible-second',
    ]);
  });

  it('falls back from a hidden saved board to the first visible board', () => {
    const selection = preferredBoardSelection(boards, 'hidden-root');

    expect(selection.selectedBoard?.id).toBe('visible-top');
    expect(selection.preferredSelectedBoardId).toBe('visible-top');
    expect(selection.validBoardIndex).toBe(0);
  });

  it('keeps a visible saved board and reports its visible index', () => {
    const selection = preferredBoardSelection(boards, 'visible-second');

    expect(selection.selectedBoard?.id).toBe('visible-second');
    expect(selection.preferredSelectedBoardId).toBe('visible-second');
    expect(selection.validBoardIndex).toBe(1);
  });

  it('falls back to all boards only when every board is hidden', () => {
    const selection = preferredBoardSelection([
      { id: 'hidden-a', hiddenFromPicker: true },
      { id: 'hidden-b', hiddenFromPicker: true },
    ], 'hidden-b');

    expect(selection.visibleBoards).toEqual([]);
    expect(selection.selectedBoard?.id).toBe('hidden-b');
    expect(selection.preferredSelectedBoardId).toBe('hidden-b');
    expect(selection.validBoardIndex).toBe(0);
  });
});
