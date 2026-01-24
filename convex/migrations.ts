import { internalMutation } from './_generated/server';

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
