import { useUser } from '@clerk/nextjs';

export function useSubscription() {
  const { user, isLoaded } = useUser();

  const loading = !isLoaded;

  // Clerk stores subscription status in user public metadata
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as string | undefined;
  const isActive = subscriptionStatus === 'active';

  // Check for bypass flag (for testing/admin purposes)
  const bypassEnabled = user?.publicMetadata?.bypassSubscriptionCheck === true;

  return { isActive, loading, bypassEnabled };
}
