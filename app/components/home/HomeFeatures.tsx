'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HomeFeatures() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        className="flex flex-col items-center text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* App Icon */}
        <div className="mb-6">
          <Image
            src="/icons/app-icon.png"
            alt="SayIt! App Icon"
            width={96}
            height={96}
            className="rounded-2xl shadow-lg"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-2">
          SayIt!
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-text-secondary mb-10">
          Your Voice, Your Words
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full mb-10">
          <Button
            onClick={() => router.push('/sign-in')}
            size="lg"
            className="w-full"
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push('/sign-up')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Create Account
          </Button>
        </div>

        {/* Privacy Policy */}
        <Link
          href="/privacy"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          Privacy Policy
        </Link>
      </motion.div>
    </div>
  );
}
