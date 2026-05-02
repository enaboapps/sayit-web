'use client';

import Link from 'next/link';

const linkClass =
  'text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded';

export default function LandingFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-tertiary">
      <a
        href="https://github.com/enaboapps/sayit-web"
        target="_blank"
        rel="noreferrer noopener"
        className={linkClass}
      >
        GitHub
      </a>
      <span aria-hidden="true">·</span>
      <Link href="/support" className={linkClass}>
        Support
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy" className={linkClass}>
        Privacy
      </Link>
    </footer>
  );
}
