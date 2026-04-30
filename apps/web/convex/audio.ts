import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { getUserIdentity } from './users';
import { getBoardAccess } from './boardAccess';

/**
 * Mint a one-shot upload URL for a recording destined for `boardId`.
 *
 * The boardId is required (and edit-access verified) so that an authenticated
 * user can only consume storage tied to a board they can already mutate. This
 * caps abuse to the user's own boards rather than letting any logged-in user
 * upload arbitrary blobs to global storage.
 */
export const generateUploadUrl = mutation({
  args: { boardId: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access) throw new Error('Board not found');
    if (!access.canEdit) throw new Error('Unauthorized - board');

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Delete a freshly-uploaded storage object that ended up unreferenced.
 *
 * Used by the client when the upload succeeded but the subsequent
 * `addAudioTile` / `updateAudioTile` mutation failed — without this hook, the
 * blob would leak in storage. Refuses to delete if any tile already
 * references the storageId, so a misuse can't unhook a live tile.
 */
export const deleteOrphanUpload = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error('Unauthenticated');

    const access = await getBoardAccess(ctx, args.boardId, identity.subject);
    if (!access || !access.canEdit) throw new Error('Unauthorized');

    const referencing = await ctx.db
      .query('boardTiles')
      .withIndex('by_audio_storage', (q) => q.eq('audioStorageId', args.storageId))
      .first();
    if (referencing) {
      // Safety: never delete a storage object that's referenced by a tile.
      return;
    }
    await ctx.storage.delete(args.storageId);
  },
});
