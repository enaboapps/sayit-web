import { describe, expect, jest, test } from '@jest/globals';
import {
  loadHydratedBoardTiles,
  viewerCanReadBoard,
} from '@/convex/boardTileHydration';

function createCtx(rows: unknown[]) {
  return {
    db: {
      query: jest.fn().mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue(rows),
        }),
      }),
    },
    storage: {
      getUrl: jest.fn().mockResolvedValue('https://files.example/audio.webm'),
    },
  };
}

describe('boardTileHydration', () => {
  test('hydrates broken audio tiles into disabled audio state', async () => {
    const ctx = createCtx([
      {
        _id: 'tile-audio',
        boardId: 'board-1',
        position: 0,
        kind: 'audio',
        audioLabel: undefined,
        audioStorageId: undefined,
        audioMimeType: undefined,
        audioDurationMs: undefined,
        audioByteSize: undefined,
      },
    ]);

    const { tiles } = await loadHydratedBoardTiles(ctx as never, 'board-1' as never, 'user-1');

    expect(tiles).toEqual([
      expect.objectContaining({
        _id: 'tile-audio',
        kind: 'audio',
        audioLabel: 'Audio tile',
        audioStorageId: null,
        audioUrl: null,
        audioMimeType: '',
        audioDurationMs: 0,
        audioByteSize: 0,
      }),
    ]);
    expect(ctx.storage.getUrl).not.toHaveBeenCalled();
  });

  test('hydrates complete audio tiles with storage URL', async () => {
    const ctx = createCtx([
      {
        _id: 'tile-audio',
        boardId: 'board-1',
        position: 0,
        kind: 'audio',
        audioLabel: 'Greeting',
        audioStorageId: 'storage-1',
        audioMimeType: 'audio/webm',
        audioDurationMs: 1200,
        audioByteSize: 2048,
      },
    ]);

    const { tiles } = await loadHydratedBoardTiles(ctx as never, 'board-1' as never, 'user-1');

    expect(tiles[0]).toMatchObject({
      kind: 'audio',
      audioLabel: 'Greeting',
      audioUrl: 'https://files.example/audio.webm',
    });
    expect(ctx.storage.getUrl).toHaveBeenCalledWith('storage-1');
  });

  test('does not expose navigate target names the viewer cannot read', async () => {
    const ctx = createCtx([
      {
        _id: 'tile-nav',
        boardId: 'board-1',
        position: 0,
        kind: 'navigate',
        targetBoardId: 'private-board',
      },
    ]);

    const { tiles } = await loadHydratedBoardTiles(
      ctx as never,
      'board-1' as never,
      'viewer-1',
      {
        getBoard: async () => ({
          _id: 'private-board',
          userId: 'owner-1',
          name: 'Private',
          position: 0,
        }) as never,
      }
    );

    expect(tiles[0]).toMatchObject({
      kind: 'navigate',
      targetBoardId: 'private-board',
      targetBoardName: null,
    });
  });

  test('exposes navigate target names when the viewer can read the board', async () => {
    expect(viewerCanReadBoard({
      _id: 'target-board',
      userId: 'owner-1',
      forClientId: 'viewer-1',
      name: 'Shared',
      position: 0,
    } as never, 'viewer-1')).toBe(true);
  });
});
