import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useSubscription() {
  const subscriptionData = useQuery(api.profiles.getSubscriptionStatus);

  const loading = subscriptionData === undefined;
  const isActive = subscriptionData?.isActive ?? false;
  const bypassEnabled = subscriptionData?.bypassEnabled ?? false;

  return { isActive, loading, bypassEnabled };
} 