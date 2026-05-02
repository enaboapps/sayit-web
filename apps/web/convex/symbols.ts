import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getUserIdentity } from './users';

const STAGED_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const startImportSymbolUpload = mutation({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const uploadSessionId = await ctx.db.insert('stagedSymbolUploads', {
      userId: identity.subject,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      STAGED_UPLOAD_TTL_MS,
      internal.symbols.sweepAbandonedImportSymbolUpload,
      { uploadSessionId }
    );

    return {
      uploadUrl: await ctx.storage.generateUploadUrl(),
      uploadSessionId,
    };
  },
});

export const registerImportSymbolUpload = mutation({
  args: {
    uploadSessionId: v.id('stagedSymbolUploads'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const staged = await ctx.db.get(args.uploadSessionId);
    if (!staged || staged.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }
    if (staged.storageId) {
      throw new Error('Upload session already has a storage object');
    }

    const existingOwner = await ctx.db
      .query('stagedSymbolUploads')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();
    if (existingOwner) {
      throw new Error('Storage object is already staged');
    }

    const metadata = await ctx.storage.getMetadata(args.storageId);
    if (!metadata) {
      throw new Error('Uploaded symbol storage object not found');
    }

    await ctx.db.patch(args.uploadSessionId, { storageId: args.storageId });
  },
});

// Best-effort cleanup for import symbol storage objects whose owning phrases
// never got persisted. Cleanup is scoped to staged upload rows owned by the
// current user so callers cannot delete arbitrary unreferenced storage IDs.
export const cleanupOrphanSymbols = mutation({
  args: {
    uploads: v.array(v.object({
      uploadSessionId: v.id('stagedSymbolUploads'),
      storageId: v.id('_storage'),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    if (args.uploads.length === 0) return;

    await Promise.allSettled(args.uploads.map(async (upload) => {
      const staged = await ctx.db.get(upload.uploadSessionId);
      if (
        !staged ||
        staged.userId !== identity.subject ||
        staged.storageId !== upload.storageId
      ) {
        return;
      }

      const referencedPhrase = await ctx.db
        .query('phrases')
        .withIndex('by_symbol_storage', (q) => q.eq('symbolStorageId', upload.storageId))
        .first();
      if (referencedPhrase) return;

      await ctx.storage.delete(upload.storageId);
      await ctx.db.delete(staged._id);
    }));
  },
});

export async function assertStagedSymbolUploadsOwned(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  userId: string,
  storageIds: Id<'_storage'>[]
) {
  for (const storageId of storageIds) {
    const staged = await ctx.db
      .query('stagedSymbolUploads')
      .withIndex('by_storage', (q) => q.eq('storageId', storageId))
      .first();
    if (!staged || staged.userId !== userId) {
      throw new Error('Imported symbol upload is not owned by the current user');
    }
  }
}

export async function removeClaimedSymbolUploads(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  userId: string,
  storageIds: Id<'_storage'>[]
) {
  await Promise.all(storageIds.map(async (storageId) => {
    const staged = await ctx.db
      .query('stagedSymbolUploads')
      .withIndex('by_storage', (q) => q.eq('storageId', storageId))
      .first();
    if (staged && staged.userId === userId) {
      await ctx.db.delete(staged._id);
    }
  }));
}

export const sweepAbandonedImportSymbolUpload = internalMutation({
  args: { uploadSessionId: v.id('stagedSymbolUploads') },
  handler: async (ctx, args) => {
    const staged = await ctx.db.get(args.uploadSessionId);
    if (!staged) return;

    if (staged.storageId) {
      const referencedPhrase = await ctx.db
        .query('phrases')
        .withIndex('by_symbol_storage', (q) => q.eq('symbolStorageId', staged.storageId))
        .first();
      if (!referencedPhrase) {
        await ctx.storage.delete(staged.storageId);
      }
    }

    await ctx.db.delete(staged._id);
  },
});
