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
