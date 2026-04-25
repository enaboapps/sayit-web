import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { getUserIdentity } from './users';

const MAX_IMPORT_BOARDS = 50;
const MAX_IMPORT_PHRASES = 2000;

export const importBoards = mutation({
  args: {
    boards: v.array(v.object({
      name: v.string(),
      phrases: v.array(v.object({
        text: v.string(),
        position: v.number(),
        symbolStorageId: v.optional(v.id('_storage')),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    if (args.boards.length > MAX_IMPORT_BOARDS) {
      throw new Error(`Import contains too many boards. Maximum is ${MAX_IMPORT_BOARDS}.`);
    }

    const phraseCount = args.boards.reduce((total, board) => total + board.phrases.length, 0);
    if (phraseCount > MAX_IMPORT_PHRASES) {
      throw new Error(`Import contains too many phrases. Maximum is ${MAX_IMPORT_PHRASES}.`);
    }

    const existingBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    const importedBoardIds = [];
    let nextBoardPosition = existingBoards.length;

    for (const board of args.boards) {
      const boardId = await ctx.db.insert('phraseBoards', {
        userId: identity.subject,
        name: board.name.trim() || 'Imported Board',
        position: nextBoardPosition,
      });
      nextBoardPosition += 1;
      importedBoardIds.push(boardId);

      const seenText = new Set<string>();
      const phrases = [...board.phrases].sort((a, b) => a.position - b.position);
      let position = 0;

      for (const phrase of phrases) {
        const text = phrase.text.trim();
        if (!text) continue;

        const key = text.toLocaleLowerCase();
        if (seenText.has(key)) continue;
        seenText.add(key);

        const symbolUrl = phrase.symbolStorageId
          ? await ctx.storage.getUrl(phrase.symbolStorageId) ?? undefined
          : undefined;

        const phraseId = await ctx.db.insert('phrases', {
          userId: identity.subject,
          text,
          position,
          symbolStorageId: phrase.symbolStorageId,
          symbolUrl,
        });

        await ctx.db.insert('phraseBoardPhrases', {
          phraseId,
          boardId,
          position,
        });

        position += 1;
      }
    }

    return importedBoardIds;
  },
});
