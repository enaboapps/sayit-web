import { useAuth, useUser } from '@clerk/nextjs';

export function useSubscription() {
  const { has, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const loading = !authLoaded || !userLoaded;

  // Check for bypass flag (for testing/admin purposes)
  const bypassEnabled = user?.publicMetadata?.bypassSubscriptionCheck === true;

  // Use Clerk's native billing has() helper to check subscription plan
  const hasProPlan = has?.({ plan: 'sayit_pro_monthly' }) ?? false;
  const isActive = hasProPlan || bypassEnabled;

  return { isActive, loading, bypassEnabled };
}
