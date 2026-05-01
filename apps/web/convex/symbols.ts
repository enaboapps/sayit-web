import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { getUserIdentity } from './users';

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Best-effort cleanup for symbol storage objects whose owning phrases never
// got persisted. Called by OpenBoardImportModal when a user cancels mid-
// import or when the bulk `importBoards` mutation fails after some symbols
// have already been uploaded — without this the storage objects leak.
//
// We use Promise.allSettled so a missing/already-deleted ID doesn't poison
// the rest of the cleanup. Before deleting, verify no phrase currently
// references the storage object; symbol IDs are sent to clients for rendering,
// so auth alone is not enough protection here.
export const cleanupOrphanSymbols = mutation({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    if (args.storageIds.length === 0) return;
    await Promise.allSettled(args.storageIds.map(async (id) => {
      const referencedPhrase = await ctx.db
        .query('phrases')
        .withIndex('by_symbol_storage', (q) => q.eq('symbolStorageId', id))
        .first();
      if (referencedPhrase) return;
      await ctx.storage.delete(id);
    }));
  },
});
