import { internalMutation } from './_generated/server';

// Migration: Backfill boardTiles from phraseBoardPhrases.
//
// Run AFTER deploying the additive schema change that adds the boardTiles
// table, and BEFORE deploying the cutover that removes phraseBoardPhrases:
//   npx convex run migrations:migrateToBoardTiles
//
// Idempotent: a boardTile (kind='phrase') is only inserted if no tile already
// exists for the same (boardId, phraseId) pair.
export const migrateToBoardTiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query('phraseBoardPhrases').collect();

    // Pre-load all existing boardTiles per (boardId, phraseId) for O(1) lookup.
    const existingKeys = new Set<string>();
    const existingTiles = await ctx.db.query('boardTiles').collect();
    for (const tile of existingTiles) {
      if (tile.kind === 'phrase' && tile.phraseId) {
        existingKeys.add(`${tile.boardId.toString()}::${tile.phraseId.toString()}`);
      }
    }

    let inserted = 0;
    let skipped = 0;
    let skippedOrphan = 0;

    for (const link of links) {
      const key = `${link.boardId.toString()}::${link.phraseId.toString()}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      // Skip orphans: a phraseBoardPhrases row whose phraseId or boardId no
      // longer resolves to a real row would create a permanently broken
      // boardTile. Drop them on the floor instead of carrying garbage forward.
      const phrase = await ctx.db.get(link.phraseId);
      const board = await ctx.db.get(link.boardId);
      if (!phrase || !board) {
        skippedOrphan++;
        continue;
      }

      await ctx.db.insert('boardTiles', {
        boardId: link.boardId,
        phraseId: link.phraseId,
        position: link.position ?? 0,
        kind: 'phrase',
      });
      existingKeys.add(key);
      inserted++;
    }

    return { inserted, skipped, skippedOrphan, totalLinks: links.length };
  },
});

// Migration: clear legacy AAC-preset fields ahead of dropping them from
// schema. The named-preset feature (largeAccess16/standard36/dense48) was
// retired; existing rows still hold values that would block the
// schema-strict deploy. Run AFTER the code that stops *writing* these
// fields lands (commit A on branch `feature/issue-649-aac-board-layout`)
// and BEFORE the schema-drop deploy (commit B):
//   npx convex run migrations:clearLegacyAacFields
//
// Idempotent: only patches rows that still hold a value, returns the count.
export const clearLegacyAacFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let boardsCleared = 0;
    const boards = await ctx.db.query('phraseBoards').collect();
    for (const board of boards) {
      const patch: { layoutPreset?: undefined; sourceTemplate?: undefined } = {};
      if (board.layoutPreset !== undefined) patch.layoutPreset = undefined;
      if (board.sourceTemplate !== undefined) patch.sourceTemplate = undefined;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(board._id, patch);
        boardsCleared += 1;
      }
    }

    let settingsCleared = 0;
    const allSettings = await ctx.db.query('userSettings').collect();
    for (const settings of allSettings) {
      if (settings.aacGridPresetPreference !== undefined) {
        await ctx.db.patch(settings._id, { aacGridPresetPreference: undefined });
        settingsCleared += 1;
      }
    }

    return { boardsCleared, settingsCleared, totalBoards: boards.length, totalSettings: allSettings.length };
  },
});

// Migration: Convert textSize from enum strings to numbers
// Run this once via Convex dashboard before deploying schema changes
export const migrateTextSizeToNumber = internalMutation({
  args: {},
  handler: async (ctx) => {
    const enumToNumber: Record<string, number> = {
      small: 12,
      medium: 16,
      large: 24,
      xlarge: 32,
    };

    const allSettings = await ctx.db.query('userSettings').collect();
    let migratedCount = 0;

    for (const settings of allSettings) {
      const currentValue = settings.textSize;

      // If it's already a number, skip
      if (typeof currentValue === 'number') {
        continue;
      }

      // If it's a string enum value, convert it
      if (typeof currentValue === 'string' && currentValue in enumToNumber) {
        await ctx.db.patch(settings._id, {
          textSize: enumToNumber[currentValue],
        });
        migratedCount++;
      }
    }

    return { migratedCount, totalRecords: allSettings.length };
  },
});
