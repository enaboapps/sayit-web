import { boardToOpenBoardFile } from '@/lib/open-board-format/export';
import type { BoardSummary } from '@/app/components/phrases/types';

describe('Open Board export', () => {
  it('exports fixed-grid boards without reflowing tile positions', () => {
    const board: BoardSummary = {
      id: 'board_1',
      name: 'Core',
      phrases: [],
      layoutMode: 'fixedGrid',
      gridRows: 2,
      gridColumns: 3,
      tiles: [
        {
          id: 'tile_go',
          kind: 'phrase',
          position: 0,
          cellRow: 1,
          cellColumn: 2,
          phrase: { id: 'phrase_go', text: 'go' },
        },
        {
          id: 'tile_more',
          kind: 'phrase',
          position: 1,
          cellRow: 0,
          cellColumn: 0,
          phrase: { id: 'phrase_more', text: 'more' },
        },
      ],
    };

    const exported = boardToOpenBoardFile(board);

    expect(exported.grid).toMatchObject({
      rows: 2,
      columns: 3,
      order: [
        ['button_tile_more', null, null],
        [null, null, 'button_tile_go'],
      ],
    });
  });
});
