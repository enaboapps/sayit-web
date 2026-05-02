import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';

export type LegacyPhraseLink = {
  _id: Id<'boardTiles'>;
  phraseId: Id<'phrases'>;
  boardId: Id<'phraseBoards'>;
  position: number;
  phrase: Doc<'phrases'> | null;
};

type TileLayoutMetadata = {
  cellRow?: number;
  cellColumn?: number;
  cellRowSpan?: number;
  cellColumnSpan?: number;
  tileRole?: Doc<'boardTiles'>['tileRole'];
  wordClass?: Doc<'boardTiles'>['wordClass'];
  isLocked?: boolean;
};

export type HydratedBoardTile =
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'phrase';
      phrase: Doc<'phrases'> | null;
    } & TileLayoutMetadata)
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'navigate';
      targetBoardId: Id<'phraseBoards'>;
      targetBoardName: string | null;
    } & TileLayoutMetadata)
  | ({
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'audio';
      audioLabel: string;
      audioStorageId: Id<'_storage'> | null;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
    } & TileLayoutMetadata);

type BoardTileHydrationLoaders = {
  getPhrase?: (phraseId: Id<'phrases'>) => Promise<Doc<'phrases'> | null>;
  getBoard?: (boardId: Id<'phraseBoards'>) => Promise<Doc<'phraseBoards'> | null>;
};

function tileLayoutMetadata(row: Doc<'boardTiles'>): TileLayoutMetadata {
  return {
    cellRow: row.cellRow,
    cellColumn: row.cellColumn,
    cellRowSpan: row.cellRowSpan,
    cellColumnSpan: row.cellColumnSpan,
    tileRole: row.tileRole,
    wordClass: row.wordClass,
    isLocked: row.isLocked,
  };
}

export function viewerCanReadBoard(
  board: Doc<'phraseBoards'> | null,
  viewerSubject: string
): boolean {
  if (!board) return false;
  return board.userId === viewerSubject || board.forClientId === viewerSubject;
}

export async function loadHydratedBoardTiles(
  ctx: QueryCtx,
  boardId: Id<'phraseBoards'>,
  viewerSubject: string,
  loaders: BoardTileHydrationLoaders = {}
): Promise<{ tiles: HydratedBoardTile[]; phraseLinks: LegacyPhraseLink[] }> {
  const getPhrase = loaders.getPhrase ?? ((phraseId: Id<'phrases'>) => ctx.db.get(phraseId));
  const getBoard = loaders.getBoard ?? ((targetBoardId: Id<'phraseBoards'>) => ctx.db.get(targetBoardId));

  const rows = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', boardId))
    .collect();

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  const tiles: HydratedBoardTile[] = [];
  const phraseLinks: LegacyPhraseLink[] = [];

  for (const row of sorted) {
    if (row.kind === 'phrase') {
      const phrase = row.phraseId ? await getPhrase(row.phraseId) : null;
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'phrase',
        phrase,
        ...tileLayoutMetadata(row),
      });
      if (row.phraseId) {
        phraseLinks.push({
          _id: row._id,
          phraseId: row.phraseId,
          boardId: row.boardId,
          position: row.position,
          phrase,
        });
      }
      continue;
    }

    if (row.kind === 'audio') {
      if (
        !row.audioLabel ||
        !row.audioStorageId ||
        !row.audioMimeType ||
        typeof row.audioDurationMs !== 'number' ||
        typeof row.audioByteSize !== 'number'
      ) {
        tiles.push({
          _id: row._id,
          boardId: row.boardId,
          position: row.position,
          kind: 'audio',
          audioLabel: row.audioLabel ?? 'Audio tile',
          audioStorageId: null,
          audioUrl: null,
          audioMimeType: row.audioMimeType ?? '',
          audioDurationMs: row.audioDurationMs ?? 0,
          audioByteSize: row.audioByteSize ?? 0,
          ...tileLayoutMetadata(row),
        });
        continue;
      }

      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'audio',
        audioLabel: row.audioLabel,
        audioStorageId: row.audioStorageId,
        audioUrl: await ctx.storage.getUrl(row.audioStorageId),
        audioMimeType: row.audioMimeType,
        audioDurationMs: row.audioDurationMs,
        audioByteSize: row.audioByteSize,
        ...tileLayoutMetadata(row),
      });
      continue;
    }

    if (!row.targetBoardId) {
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'navigate',
        targetBoardId: row.boardId,
        targetBoardName: null,
        ...tileLayoutMetadata(row),
      });
      continue;
    }

    const target = await getBoard(row.targetBoardId);
    tiles.push({
      _id: row._id,
      boardId: row.boardId,
      position: row.position,
      kind: 'navigate',
      targetBoardId: row.targetBoardId,
      targetBoardName: viewerCanReadBoard(target, viewerSubject) ? (target?.name ?? null) : null,
      ...tileLayoutMetadata(row),
    });
  }

  return { tiles, phraseLinks };
}
