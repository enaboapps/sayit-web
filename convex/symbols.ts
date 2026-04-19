import { mutation } from './_generated/server';
import { v } from 'convex/values';
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

export const deleteSymbol = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    await ctx.storage.delete(args.storageId);
  },
});
