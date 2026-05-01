import {
  preferredBoardSelection,
  toBoardSummary,
  toPhraseSummary,
  toTileSummary,
} from '@/lib/hooks/usePhraseBoardData';

type PhraseInput = Parameters<typeof toPhraseSummary>[0];
type TileInput = Parameters<typeof toTileSummary>[0];
type BoardInput = Parameters<typeof toBoardSummary>[0];

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

describe('phrase board adapters', () => {
  it('maps Convex phrases to UI phrase summaries', () => {
    const phrase = {
      _id: 'phrase-1',
      text: 'hello',
      symbolUrl: 'https://example.com/hello.png',
      symbolStorageId: 'storage-1',
    } as unknown as PhraseInput;

    expect(toPhraseSummary(phrase)).toEqual({
      id: 'phrase-1',
      text: 'hello',
      symbolUrl: 'https://example.com/hello.png',
      symbolStorageId: 'storage-1',
    });
  });

  it('maps phrase, audio, and navigate tiles without loose casts in the hook', () => {
    const phraseTile = {
      _id: 'tile-phrase',
      kind: 'phrase',
      position: 0,
      cellRow: 1,
      cellColumn: 2,
      tileRole: 'core',
      wordClass: 'verb',
      isLocked: true,
      phrase: {
        _id: 'phrase-1',
        text: 'go',
        symbolUrl: undefined,
        symbolStorageId: undefined,
      },
    } as unknown as TileInput;
    const audioTile = {
      _id: 'tile-audio',
      kind: 'audio',
      position: 1,
      audioLabel: 'Bell',
      audioUrl: undefined,
      audioMimeType: 'audio/webm',
      audioDurationMs: 900,
      audioByteSize: 1024,
    } as unknown as TileInput;
    const navigateTile = {
      _id: 'tile-nav',
      kind: 'navigate',
      position: 2,
      targetBoardId: 'board-target',
      targetBoardName: null,
    } as unknown as TileInput;

    expect(toTileSummary(phraseTile)).toEqual({
      id: 'tile-phrase',
      kind: 'phrase',
      position: 0,
      cellRow: 1,
      cellColumn: 2,
      tileRole: 'core',
      wordClass: 'verb',
      isLocked: true,
      phrase: {
        id: 'phrase-1',
        text: 'go',
        symbolUrl: undefined,
        symbolStorageId: undefined,
      },
    });
    expect(toTileSummary(audioTile)).toMatchObject({
      id: 'tile-audio',
      kind: 'audio',
      audioLabel: 'Bell',
      audioUrl: null,
    });
    expect(toTileSummary(navigateTile)).toMatchObject({
      id: 'tile-nav',
      kind: 'navigate',
      targetBoardId: 'board-target',
      targetBoardName: null,
    });
  });

  it('skips orphaned phrase tiles defensively', () => {
    const orphanedTile = {
      _id: 'tile-orphan',
      kind: 'phrase',
      position: 0,
      phrase: null,
    } as unknown as TileInput;

    expect(toTileSummary(orphanedTile)).toBeNull();
  });

  it('attaches selected board phrases and tiles only to the selected board', () => {
    const selectedBoard = {
      _id: 'board-1',
      name: 'Core',
      position: 0,
      isShared: false,
      isOwner: true,
      accessLevel: 'edit',
      sharedBy: null,
      forClientId: null,
      forClientName: null,
      layoutMode: undefined,
      gridRows: undefined,
      gridColumns: undefined,
      layoutVersion: undefined,
      hiddenFromPicker: false,
    } as unknown as BoardInput;
    const otherBoard = {
      ...selectedBoard,
      _id: 'board-2',
      name: 'Other',
    } as unknown as BoardInput;
    const phrases = [{ id: 'phrase-1', text: 'go' }];
    const tiles = [{
      id: 'tile-1',
      kind: 'phrase' as const,
      position: 0,
      phrase: phrases[0],
    }];

    expect(toBoardSummary(selectedBoard, 'board-1', phrases, tiles)).toMatchObject({
      id: 'board-1',
      layoutMode: 'free',
      phrases,
      tiles,
    });
    expect(toBoardSummary(otherBoard, 'board-1', phrases, tiles)).toMatchObject({
      id: 'board-2',
      phrases: [],
      tiles: undefined,
    });
  });
});
