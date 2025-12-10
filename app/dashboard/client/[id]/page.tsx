'use client';

import { use } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeftIcon, UserIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ClientBoardCard from '@/app/components/dashboard/ClientBoardCard';
import CreateBoardButton from '@/app/components/dashboard/CreateBoardButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id: communicatorId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const clientProfile = useQuery(api.profiles.getProfileByUserId, { userId: communicatorId });
  const clientBoards = useQuery(api.phraseBoards.getBoardsForClient, { clientId: communicatorId });
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

  if (authLoading || profile === undefined || clientProfile === undefined || clientBoards === undefined) {
    return <AnimatedLoading />;
  }

  if (!user || profile?.role !== 'caregiver') {
    return <AnimatedLoading />;
  }

  const clientName = clientProfile?.fullName || clientProfile?.email || 'Client';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to clients</span>
        </Link>

        <SubscriptionWrapper
          fallback={
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-primary-500/10 w-fit mx-auto mb-6">
                <UserIcon className="w-12 h-12 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Client Management</h2>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Manage client boards and create personalized communication tools with a Pro subscription.
              </p>
              <a
                href="/pricing"
                className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
              >
                Upgrade to Pro
              </a>
            </div>
          }
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-full bg-primary-500/10">
              <UserIcon className="w-8 h-8 text-primary-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
              {clientProfile?.fullName && clientProfile?.email && (
                <p className="text-text-secondary">{clientProfile.email}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{clientName}&apos;s Boards</h2>
              <CreateBoardButton communicatorId={communicatorId} />
            </div>

            {clientBoards.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-border">
                <FolderPlusIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary mb-2">No boards yet</p>
                <p className="text-text-tertiary text-sm">
                  Create a board to help {clientName} communicate
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientBoards.map((board) => (
                  <ClientBoardCard key={board._id} board={board} />
                ))}
              </div>
            )}
          </div>
        </SubscriptionWrapper>
      </div>
    </div>
  );
}
