import type { MutationCtx, QueryCtx } from './_generated/server';

// The caregiverClients row linking a caregiver to a communicator, or null.
export async function findCaregiverLink(
  ctx: QueryCtx | MutationCtx,
  caregiverId: string,
  communicatorId: string,
) {
  const links = await ctx.db
    .query('caregiverClients')
    .withIndex('by_caregiver', (q) => q.eq('caregiverId', caregiverId))
    .collect();
  return links.find((link) => link.communicatorId === communicatorId) ?? null;
}

// Whether a caregiver is linked to this communicator.
export async function isCaregiverOf(
  ctx: QueryCtx | MutationCtx,
  caregiverId: string,
  communicatorId: string,
) {
  return (await findCaregiverLink(ctx, caregiverId, communicatorId)) !== null;
}
