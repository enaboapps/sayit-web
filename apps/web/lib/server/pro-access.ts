import { clerkClient } from '@clerk/nextjs/server';
import { BYPASS_SUBSCRIPTION_METADATA_KEY, PRO_PLAN } from '@/lib/subscription';

// Results are cached briefly per user so repeated requests (a viewer hearing
// each utterance, or a non-Pro caller retrying) don't each hit Clerk's API.
const CACHE_MS = 60_000;
const cache = new Map<string, { hasPro: boolean; expiresAt: number }>();

export function clearProAccessCache() {
  cache.clear();
}

async function lookUp(userId: string, options: { checkPlan: boolean }) {
  const client = await clerkClient();

  if (options.checkPlan) {
    try {
      const subscription = await client.billing.getUserBillingSubscription(userId);
      const hasPlan = subscription.subscriptionItems.some(
        (item) => item.status === 'active' && item.plan?.slug === PRO_PLAN,
      );
      if (hasPlan) return true;
    } catch {
      // Users who never subscribed have no billing subscription.
    }
  }

  const user = await client.users.getUser(userId);
  return user.publicMetadata?.[BYPASS_SUBSCRIPTION_METADATA_KEY] === true;
}

// Whether a user has SayIt Pro, for when there's no session token to check
// (such as the owner of a Live Typing link). Pass checkPlan: false when the
// caller's own session already said they have no plan, to check only the
// bypass flag.
export async function userHasPro(userId: string, options: { checkPlan: boolean } = { checkPlan: true }) {
  const key = `${options.checkPlan ? 'plan' : 'bypass'}:${userId}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.hasPro;

  const hasPro = await lookUp(userId, options);
  cache.set(key, { hasPro, expiresAt: Date.now() + CACHE_MS });
  return hasPro;
}
