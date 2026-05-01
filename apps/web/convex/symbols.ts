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
// the rest of the cleanup. Auth-only (no per-object ownership check) — the
// storage IDs were issued for this session via `generateUploadUrl` which
// already required auth, and there's no way for a caller to enumerate other
// users' storage IDs.
export const cleanupOrphanSymbols = mutation({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    if (args.storageIds.length === 0) return;
    await Promise.allSettled(args.storageIds.map((id) => ctx.storage.delete(id)));
  },
});
