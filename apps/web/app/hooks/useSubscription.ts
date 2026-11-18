import { useAuth, useUser } from '@clerk/nextjs';
import { BYPASS_SUBSCRIPTION_METADATA_KEY, PRO_PLAN } from '@/lib/subscription';

export function useSubscription() {
  const { has, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const loading = !authLoaded || !userLoaded;

  // Check for bypass flag (for testing/admin purposes)
  const bypassEnabled = user?.publicMetadata?.[BYPASS_SUBSCRIPTION_METADATA_KEY] === true;

  // Use Clerk's native billing has() helper to check subscription plan
  const hasProPlan = has?.({ plan: PRO_PLAN }) ?? false;
  const isActive = hasProPlan || bypassEnabled;

  return { isActive, loading, bypassEnabled };
}
