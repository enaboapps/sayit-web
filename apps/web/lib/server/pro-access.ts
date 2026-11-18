import { clerkClient } from '@clerk/nextjs/server';
import { BYPASS_SUBSCRIPTION_METADATA_KEY, PRO_PLAN } from '@/lib/subscription';

// Results are cached briefly per user so repeated requests (a viewer hearing
// each utterance, or a non-Pro caller retrying) don't each hit Clerk's API.
// Only answers Clerk actually gave are cached; failed lookups are not.
const CACHE_MS = 60_000;
const MAX_CACHE_ENTRIES = 1000;
const cache = new Map<string, { hasPro: boolean; expiresAt: number }>();

export function clearProAccessCache() {
  cache.clear();
}

function remember(key: string, hasPro: boolean) {
  const now = Date.now();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    for (const [cachedKey, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(cachedKey);
    }
    if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  }
  cache.set(key, { hasPro, expiresAt: now + CACHE_MS });
}

interface SubscriptionItem {
  status: string;
  periodEnd: number | null;
  plan: { slug: string } | null;
}

// Counts as Pro while the plan is paid for: active (including free trials),
// past due while Clerk retries payment, or cancelled until the paid period ends.
export function isProSubscriptionItem(item: SubscriptionItem, now = Date.now()) {
  if (item.plan?.slug !== PRO_PLAN) return false;
  if (item.status === 'active' || item.status === 'past_due') return true;
  return item.status === 'canceled' && item.periodEnd !== null && item.periodEnd > now;
}

function isNotFound(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 404;
}

async function lookUp(userId: string, options: { checkPlan: boolean }) {
  const client = await clerkClient();

  if (options.checkPlan) {
    try {
      const subscription = await client.billing.getUserBillingSubscription(userId);
      if (subscription.subscriptionItems.some((item) => isProSubscriptionItem(item))) return true;
    } catch (error) {
      // Users who never subscribed have no billing subscription. Anything else
      // (an outage, a rate limit) is passed up so it isn't cached as "no Pro".
      if (!isNotFound(error)) throw error;
    }
  }

  const user = await client.users.getUser(userId);
  return user.publicMetadata?.[BYPASS_SUBSCRIPTION_METADATA_KEY] === true;
}

// Whether a user has SayIt Pro, for when there's no session token to check
// (such as the owner of a Live Typing link). Pass checkPlan: false when the
// caller's own session already said they have no plan, to check only the
// bypass flag. Throws if Clerk can't be reached.
export async function userHasPro(userId: string, options: { checkPlan: boolean } = { checkPlan: true }) {
  const key = `${options.checkPlan ? 'plan' : 'bypass'}:${userId}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.hasPro;

  const hasPro = await lookUp(userId, options);
  remember(key, hasPro);
  return hasPro;
}
