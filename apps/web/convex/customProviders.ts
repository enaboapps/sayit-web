import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { QueryCtx, MutationCtx } from './_generated/server';

async function owner(ctx: QueryCtx | MutationCtx, bridge: string) {
  const expected = process.env.CUSTOM_PROVIDER_BRIDGE_SECRET;
  if (!expected || expected.length < 32 || bridge !== expected) throw new Error('Unauthorized');
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthorized');
  return identity.subject;
}
const bridge = { bridge: v.string() };
export const list = query({ args: bridge, handler: async (ctx, args) => {
  const userId = await owner(ctx, args.bridge);
  const rows = await ctx.db.query('customProviders').withIndex('by_user', q => q.eq('userId', userId)).collect();
  return rows.map(row => ({ id: row._id, name: row.name, baseUrl: row.baseUrl, hasKey: true }));
} });
export const read = query({ args: { ...bridge, id: v.id('customProviders') }, handler: async (ctx, args) => {
  const userId = await owner(ctx, args.bridge);
  const row = await ctx.db.get(args.id);
  if (!row || row.userId !== userId) throw new Error('Connection not found');
  return row;
} });
export const save = mutation({ args: { ...bridge, id: v.optional(v.id('customProviders')), name: v.string(), baseUrl: v.string(), encryptedKey: v.string() }, handler: async (ctx, args) => {
  const userId = await owner(ctx, args.bridge);
  const values = { userId, name: args.name, baseUrl: args.baseUrl, encryptedKey: args.encryptedKey };
  if (args.id) {
    const row = await ctx.db.get(args.id);
    if (!row || row.userId !== userId) throw new Error('Connection not found');
    await ctx.db.patch(args.id, values); return args.id;
  }
  const existing = await ctx.db.query('customProviders').withIndex('by_user', q => q.eq('userId', userId)).collect();
  if (existing.length >= 10) throw new Error('Connection limit reached');
  return ctx.db.insert('customProviders', values);
} });
export const remove = mutation({ args: { ...bridge, id: v.id('customProviders') }, handler: async (ctx, args) => {
  const userId = await owner(ctx, args.bridge);
  const row = await ctx.db.get(args.id);
  if (!row || row.userId !== userId) throw new Error('Connection not found');
  await ctx.db.delete(args.id);
} });
