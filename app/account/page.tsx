'use client';

import { UserProfile } from '@clerk/nextjs';
import { motion } from 'framer-motion';

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-8">Account Settings</h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-surface shadow-lg',
                }
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
