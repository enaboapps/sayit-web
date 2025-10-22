import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper to get user identity from Clerk
export async function getUserIdentity(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}

// Helper to ensure user profile exists
export async function ensureUserProfile(ctx: MutationCtx, email: string, fullName?: string) {
  const identity = await getUserIdentity(ctx);
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
    .first();

  if (!existing) {
    await ctx.db.insert("profiles", {
      userId: identity.subject,
      email,
      fullName,
    });
  }

  return identity.subject;
}
