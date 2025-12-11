'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import ClientList from '@/app/components/dashboard/ClientList';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const router = useRouter();

  // Redirect non-caregivers
  useEffect(() => {
    if (!authLoading && profile !== undefined) {
      if (!user) {
        router.push('/sign-in');
      } else if (profile?.role !== 'caregiver') {
        router.push('/');
      }
    }
  }, [authLoading, user, profile, router]);

  if (authLoading || profile === undefined) {
    return <AnimatedLoading />;
  }

  if (!user || profile?.role !== 'caregiver') {
    return <AnimatedLoading />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <SubscriptionWrapper
          fallback={
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-primary-500/10 w-fit mx-auto mb-6">
                <UsersIcon className="w-12 h-12 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Client Management</h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Help your clients communicate more effectively with personalized AAC boards.
              </p>

              <div className="bg-surface rounded-xl p-6 max-w-lg mx-auto mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4">With Pro, you can:</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-primary-500 mt-0.5">✓</span>
                    <span>Add and manage multiple clients from one account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-500 mt-0.5">✓</span>
                    <span>Create personalized boards tailored to each client&apos;s needs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-500 mt-0.5">✓</span>
                    <span>Set view-only or edit permissions for each board</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-500 mt-0.5">✓</span>
                    <span>Clients see boards instantly on their own devices</span>
                  </li>
                </ul>
              </div>

              <a
                href="/pricing"
                className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
              >
                Upgrade to Pro
              </a>
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-full bg-primary-500/10">
              <UsersIcon className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Clients</h1>
              <p className="text-text-secondary">Manage your clients and their boards</p>
            </div>
          </div>

          <ClientList />
        </SubscriptionWrapper>
      </div>
    </div>
  );
}
