'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';

const SUBHEAD =
  'Communication software for people who need help being heard — and the people helping them.';
const BODY = 'Save your boards, write with help, hear yourself in a natural voice.';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fadeUp(delay: number) {
  if (prefersReducedMotion()) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  };
}

export default function Hero() {
  return (
    <section className="flex flex-col gap-6 md:gap-8" aria-labelledby="guest-landing-wordmark">
      <motion.p
        {...fadeUp(0)}
        className="text-sm font-medium uppercase tracking-[0.18em] text-text-secondary"
      >
        Sign in to SayIt!
      </motion.p>

      <motion.h1
        id="guest-landing-wordmark"
        {...fadeUp(0.05)}
        className="font-extrabold leading-[0.92] tracking-[-0.03em] text-[clamp(4rem,12vw,7rem)] text-foreground"
      >
        SayIt!
      </motion.h1>

      <motion.p
        {...fadeUp(0.1)}
        className="max-w-2xl text-lg md:text-xl leading-snug text-text-primary"
      >
        {SUBHEAD}
      </motion.p>

      <motion.p
        {...fadeUp(0.15)}
        className="max-w-2xl text-base text-text-secondary"
      >
        {BODY}
      </motion.p>

      <motion.div
        {...fadeUp(0.2)}
        className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/sign-up">Create your account</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </motion.div>
    </section>
  );
}
