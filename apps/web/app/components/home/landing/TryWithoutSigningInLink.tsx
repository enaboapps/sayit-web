'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function TryWithoutSigningInLink() {
  const reduce = prefersReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.25 }}
      className="text-sm"
    >
      <Link
        href="/try"
        className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        Try without signing in
      </Link>
    </motion.div>
  );
}
