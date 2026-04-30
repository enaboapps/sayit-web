'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/app/hooks/useSubscription';
import { Button } from '@/app/components/ui/Button';

interface SubscriptionWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SubscriptionWrapper({ 
  children, 
  fallback 
}: SubscriptionWrapperProps) {
  const router = useRouter();
  const { isActive, loading } = useSubscription();
  
  // While checking subscription status, show a minimal loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center p-4 min-h-[200px]" role="status" aria-live="polite" aria-busy="true">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        <span className="sr-only">Loading subscription status</span>
      </div>
    );
  }
  
  // If subscription is active, render the children
  if (isActive) {
    return <>{children}</>;
  }
  
  // If custom fallback is provided, use that
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback for subscription required
  return (
    <div className="bg-surface p-6 rounded-xl shadow-md text-center">
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        <h3 className="text-xl font-semibold text-foreground mb-2">Premium Feature</h3>
        <p className="text-text-secondary mb-6">This feature requires an active subscription.</p>
      </div>
      <Button
        onClick={() => router.push('/pricing')}
        className="w-full"
      >
        Upgrade to Pro
      </Button>
    </div>
  );
} 
