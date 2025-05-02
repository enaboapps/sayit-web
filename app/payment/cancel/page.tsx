'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';

export default function PaymentCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Automatically redirect after countdown
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/pricing');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.3
                }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4"
              >
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
              <p className="text-lg text-gray-600 mb-6">
                Your payment process was cancelled.
              </p>
              
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  No charges were made to your account. You can try again whenever you&apos;re ready.
                </p>
              </div>
              
              <div className="text-sm text-gray-500 mb-6">
                Redirecting to pricing page in {countdown} seconds...
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/pricing')}
                  size="lg"
                  className="w-full"
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 