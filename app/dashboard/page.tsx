'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import ClientList from '@/app/components/dashboard/ClientList';
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
      </div>
    </div>
  );
}
