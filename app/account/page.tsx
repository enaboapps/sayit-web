'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';

interface SubscriptionStatus {
  status: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

export default function AccountPage() {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error: supabaseError } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_cancel_at_period_end, stripe_customer_id')
          .eq('id', user.id)
          .single();

        if (supabaseError) throw supabaseError;

        if (profile) {
          setSubscription({
            status: profile.subscription_status,
            cancel_at_period_end: profile.subscription_cancel_at_period_end,
            stripe_customer_id: profile.stripe_customer_id
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleSignOut = async () => {
    setError(null);

    try {
      await signOut();
      router.push('/');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const { url } = await response.json();
      window.location.href = url;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError('Failed to load subscription portal');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-8">Account Settings</h1>

          <motion.div
            className="bg-surface rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Email</h2>
                  <p className="text-text-secondary">{user?.email}</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    To update your email or password, please use the Clerk account settings.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Subscription</h2>
                  {loading ? (
                    <p className="text-text-secondary">Loading subscription status...</p>
                  ) : !subscription?.stripe_customer_id ? (
                    <div className="space-y-4">
                      <p className="text-text-secondary">
                        You don't have an active subscription yet.
                      </p>
                      <Button
                        onClick={() => router.push('/pricing')}
                        size="lg"
                      >
                        Subscribe Now
                      </Button>
                    </div>
                  ) : subscription ? (
                    <div className="space-y-4">
                      <div className="bg-surface-hover p-4 rounded-lg">
                        <p className="text-text-secondary mb-1">
                          Status: <span className="font-medium capitalize">{subscription.status}</span>
                        </p>
                        {subscription.cancel_at_period_end && (
                          <p className="text-warning text-sm mt-2">
                            Your subscription will be cancelled at the end of the current period.
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={handleManageSubscription}
                        size="lg"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-text-secondary">No active subscription</p>
                      <Button
                        onClick={() => router.push('/pricing')}
                        size="lg"
                      >
                        Subscribe Now
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Legal</h2>
                  <div className="space-y-2">
                    <Link href="/privacy" className="text-text-secondary hover:text-foreground block">
                      Privacy Policy
                    </Link>
                  </div>
                </div>

                {error && (
                  <motion.div
                    className="p-4 bg-error/10 border border-error/20 rounded-lg text-error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}

                <div className="pt-6 border-t border-border">
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    size="lg"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
