import { v } from 'convex/values';
import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getUserIdentity } from './users';

const MAX_IMPORT_BOARDS = 50;
const MAX_IMPORT_TILES = 4000;

const phraseTileValidator = v.object({
  kind: v.literal('phrase'),
  text: v.string(),
  position: v.number(),
  cellRow: v.number(),
  cellColumn: v.number(),
  symbolStorageId: v.optional(v.id('_storage')),
});

const navigateTileValidator = v.object({
  kind: v.literal('navigate'),
  label: v.string(),
  position: v.number(),
  cellRow: v.number(),
  cellColumn: v.number(),
  targetSourceId: v.string(),
});

function validateGrid(rows: number, columns: number) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows <= 0 || columns <= 0) {
    throw new Error('Imported boards must have positive integer grid dimensions');
  }
}

export const importBoards = mutation({
  args: {
    boards: v.array(v.object({
      sourceId: v.string(),
      name: v.string(),
      gridRows: v.number(),
      gridColumns: v.number(),
      tiles: v.array(v.union(phraseTileValidator, navigateTileValidator)),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    if (args.boards.length === 0) {
      throw new Error('Import package does not contain any boards');
    }
    if (args.boards.length > MAX_IMPORT_BOARDS) {
      throw new Error(`Import package contains more than ${MAX_IMPORT_BOARDS} boards`);
    }

    const tileCount = args.boards.reduce((total, board) => total + board.tiles.length, 0);
    if (tileCount > MAX_IMPORT_TILES) {
      throw new Error(`Import package contains more than ${MAX_IMPORT_TILES} tiles`);
    }

    const existingBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    const sourceIdToBoardId = new Map<string, Id<'phraseBoards'>>();
    const importedBoardIds: Id<'phraseBoards'>[] = [];

    for (let index = 0; index < args.boards.length; index += 1) {
      const board = args.boards[index];
      validateGrid(board.gridRows, board.gridColumns);

      const boardId = await ctx.db.insert('phraseBoards', {
        userId: identity.subject,
        name: board.name.trim() || 'Imported Board',
        position: existingBoards.length + index,
        layoutMode: 'fixedGrid',
        gridRows: board.gridRows,
        gridColumns: board.gridColumns,
        layoutVersion: 1,
        sourceTemplate: 'custom',
      });

      sourceIdToBoardId.set(board.sourceId, boardId);
      importedBoardIds.push(boardId);
    }

    for (const board of args.boards) {
      const boardId = sourceIdToBoardId.get(board.sourceId);
      if (!boardId) continue;

      const occupiedCells = new Set<string>();
      for (const tile of board.tiles) {
        if (!Number.isInteger(tile.cellRow) || !Number.isInteger(tile.cellColumn)) {
          throw new Error('Imported tile cell coordinates must be integers');
        }
        if (
          tile.cellRow < 0 ||
          tile.cellColumn < 0 ||
          tile.cellRow >= board.gridRows ||
          tile.cellColumn >= board.gridColumns
        ) {
          throw new Error('Imported tile cell coordinates are outside the board grid');
        }

        const cellKey = `${tile.cellRow}:${tile.cellColumn}`;
        if (occupiedCells.has(cellKey)) {
          throw new Error('Import contains multiple tiles in the same grid cell');
        }
        occupiedCells.add(cellKey);

        if (tile.kind === 'phrase') {
          const text = tile.text.trim();
          if (!text) continue;

          const symbolUrl = tile.symbolStorageId
            ? await ctx.storage.getUrl(tile.symbolStorageId)
            : null;
          const phraseId = await ctx.db.insert('phrases', {
            userId: identity.subject,
            text,
            frequency: 0,
            position: tile.position,
            symbolStorageId: tile.symbolStorageId,
            symbolUrl: symbolUrl ?? undefined,
          });

          await ctx.db.insert('boardTiles', {
            boardId,
            position: tile.position,
            kind: 'phrase',
            phraseId,
            cellRow: tile.cellRow,
            cellColumn: tile.cellColumn,
            cellRowSpan: 1,
            cellColumnSpan: 1,
            tileRole: 'fringe',
            isLocked: false,
          });
          continue;
        }

        const targetBoardId = sourceIdToBoardId.get(tile.targetSourceId);
        if (!targetBoardId || targetBoardId === boardId) continue;

        await ctx.db.insert('boardTiles', {
          boardId,
          position: tile.position,
          kind: 'navigate',
          targetBoardId,
          cellRow: tile.cellRow,
          cellColumn: tile.cellColumn,
          cellRowSpan: 1,
          cellColumnSpan: 1,
          tileRole: 'navigation',
          isLocked: false,
        });
      }
    }

    return {
      importedBoardIds,
    };
  },
});
