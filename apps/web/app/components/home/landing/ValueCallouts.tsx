'use client';

import { motion } from 'framer-motion';

type Callout = {
  title: string;
  body: string;
};

const CALLOUTS: Callout[] = [
  {
    title: 'Saved phrase boards.',
    body: 'Build reusable boards for daily routines. Sign in to keep them across devices.',
  },
  {
    title: 'AI Fix Text.',
    body: 'Turn rough phrasing into clearer messages. You see the suggestion and decide.',
  },
  {
    title: 'Premium voices.',
    body: 'Free browser voices ship by default. More natural premium voices are available on a paid plan.',
  },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function entrance(index: number) {
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
    transition: { duration: 0.4, delay: 0.25 + index * 0.06 },
  };
}

function hover() {
  if (prefersReducedMotion()) return undefined;
  // Attach the hover-specific transition to the variant itself so it doesn't
  // override the entrance transition's per-card delay / reduced-motion handling.
  return { y: -2, transition: { duration: 0.2 } };
}

export default function ValueCallouts() {
  return (
    <section
      aria-label="What you get when you sign in"
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {CALLOUTS.map((callout, index) => (
        <motion.article
          key={callout.title}
          {...entrance(index)}
          whileHover={hover()}
          className="rounded-3xl border border-border bg-surface p-5 md:p-6 shadow-md hover:shadow-xl"
        >
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            {callout.title}
          </h3>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed">
            {callout.body}
          </p>
        </motion.article>
      ))}
    </section>
  );
}
