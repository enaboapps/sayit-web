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
// retired; existing rows held values that would block the schema-strict
// deploy until cleared. Run order:
//   1. Deploy commit A (code stops writing the fields, schema unchanged).
//   2. `npx convex run migrations:clearLegacyAacFields`.
//   3. Deploy commit B (schema drops the fields).
//
// Idempotent: only patches rows that still hold a value, returns the count.
//
// The fields no longer appear in `Doc<'phraseBoards'>`/`Doc<'userSettings'>`
// since commit B; reads are cast through Record<string, unknown> so the
// migration remains compilable for future environments that still need to
// run it (e.g. prod first-time deploy after both commits land together).
export const clearLegacyAacFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let boardsCleared = 0;
    const boards = await ctx.db.query('phraseBoards').collect();
    for (const board of boards) {
      const legacy = board as unknown as Record<string, unknown>;
      const patch: { layoutPreset?: undefined; sourceTemplate?: undefined } = {};
      if (legacy.layoutPreset !== undefined) patch.layoutPreset = undefined;
      if (legacy.sourceTemplate !== undefined) patch.sourceTemplate = undefined;
      if (Object.keys(patch).length > 0) {
        // Patch shape isn't in the current schema validator; cast to
        // unknown so the patch call accepts it. Convex tolerates patching
        // a key to undefined regardless of schema (it removes the field).
        await ctx.db.patch(board._id, patch as unknown as Partial<typeof board>);
        boardsCleared += 1;
      }
    }

    let settingsCleared = 0;
    const allSettings = await ctx.db.query('userSettings').collect();
    for (const settings of allSettings) {
      const legacy = settings as unknown as Record<string, unknown>;
      if (legacy.aacGridPresetPreference !== undefined) {
        await ctx.db.patch(
          settings._id,
          { aacGridPresetPreference: undefined } as unknown as Partial<typeof settings>
        );
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
