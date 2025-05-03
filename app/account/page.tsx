'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);

    try {
      await authService.signOut();
      router.push('/');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!user?.email) return;

    try {
      await authService.sendPasswordResetEmail(user.email);
      setSuccess('Password reset email sent! Please check your inbox.');
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
    <div className="min-h-screen flex flex-col bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Account Settings</h1>
          
          <motion.div 
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Email</h2>
                  <p className="text-gray-700">{user?.email}</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Password</h2>
                  <p className="text-gray-700 mb-4">
                    Change your password to keep your account secure.
                  </p>
                  <Button
                    onClick={handleResetPassword}
                    variant="ghost"
                    size="sm"
                  >
                    Reset Password
                  </Button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Subscription</h2>
                  {loading ? (
                    <p className="text-gray-700">Loading subscription status...</p>
                  ) : !subscription?.stripe_customer_id ? (
                    <div className="space-y-4">
                      <p className="text-gray-700">
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
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 mb-1">
                          Status: <span className="font-medium capitalize">{subscription.status}</span>
                        </p>
                        {subscription.cancel_at_period_end && (
                          <p className="text-yellow-700 text-sm mt-2">
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
                      <p className="text-gray-700">No active subscription</p>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Legal</h2>
                  <div className="space-y-2">
                    <Link href="/privacy" className="text-gray-600 hover:text-gray-900 block">
                      Privacy Policy
                    </Link>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {success}
                  </motion.div>
                )}

                <div className="pt-6 border-t border-gray-200">
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
