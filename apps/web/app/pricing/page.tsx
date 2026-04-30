'use client';

import { PricingTable } from '@clerk/nextjs';
import { motion } from 'framer-motion';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Upgrade to SayIt! Pro
          </h1>
          <p className="text-xl text-text-secondary">
            Unlock advanced AI features to enhance your communication
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <PricingTable />
        </motion.div>
      </div>
    </div>
  );
}
