import { useUser } from '@clerk/nextjs';

export function useSubscription() {
  const { user, isLoaded } = useUser();

  const loading = !isLoaded;

  // Check for bypass flag (for testing/admin purposes)
  const bypassEnabled = user?.publicMetadata?.bypassSubscriptionCheck === true;

  // Clerk stores subscription status in user public metadata
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as string | undefined;
  const isActive = subscriptionStatus === 'active' || bypassEnabled;

  return { isActive, loading, bypassEnabled };
}
