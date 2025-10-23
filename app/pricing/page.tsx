'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<string>('');
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Use the specific price ID
  const priceId = 'price_1RKLysHFy05HLttRWb8mpW03';

  // Fetch the actual price from Stripe
  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch('/api/stripe/get-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: priceId // Use price ID directly
          }),
        });

        const data = await response.json();
        if (data.formattedPrice) {
          setPrice(data.formattedPrice);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      } finally {
        setLoadingPrice(false);
      }
    }

    fetchPrice();
  }, [priceId]);

  const handleSubscribe = async () => {
    if (!user || !user.email) {
      alert('Please sign in to subscribe');
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      // Use the specific price ID and include the user's email
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId, // Use the direct price ID
          userId: user.id,
          email: user.email
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error from API:', data.error);
        alert('There was an error creating your checkout session. Please try again later.');
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      alert('There was an error processing your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Upgrade to SayIt! Pro
          </h1>
          <p className="text-xl text-text-secondary mb-12">
            Unlock advanced AI features to enhance your communication
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-surface p-8 lg:p-10">
            <div className="lg:flex lg:items-start lg:justify-between">
              <div className="lg:max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground">
                  Pro Plan
                </h2>
                <p className="mt-4 text-lg text-text-secondary">
                  Our premium plan includes all the features you need to communicate effectively with advanced AI assistance.
                </p>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    What&apos;s included
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'AI-powered "Flesh Out" feature',
                      'AI-assisted phrase generation',
                      'Smart phrase suggestions',
                      'Express feelings, needs, wants, and thoughts with AI',
                      'Priority customer support',
                      'Future AI features included'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <svg className="h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="ml-3 text-text-secondary">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 lg:mt-0 lg:ml-8 lg:min-w-[250px]">
                <div className="bg-surface-hover p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Monthly subscription
                  </h3>
                  <div className="mt-2 flex items-baseline">
                    {loadingPrice ? (
                      <span className="text-2xl font-medium text-foreground">Loading...</span>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-foreground">{price}</span>
                        <span className="ml-1 text-xl font-medium text-text-tertiary">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-text-tertiary">
                    Cancel anytime. No long-term contracts.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={handleSubscribe}
                      disabled={loading}
                      className="w-full py-2"
                      size="lg"
                    >
                      {loading ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                  </div>
                  <div className="mt-4 text-center">
                    <a
                      href="#"
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      Learn more about our subscription
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
