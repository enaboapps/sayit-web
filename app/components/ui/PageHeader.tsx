'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Page title shown next to the back button. */
  title: string;
  /** Optional muted description rendered beneath the title. */
  description?: string;
  /**
   * Explicit fallback target for the back affordance. Rendered as `<Link>` so
   * middle-click / cmd-click open in a new tab, and so deep-linked pages with
   * no history still have somewhere safe to go (where `router.back()` would
   * otherwise no-op).
   */
  backHref?: string;
  /**
   * Override the back behavior entirely. Takes precedence over `backHref`.
   * When supplied, the back affordance renders as a `<button>`.
   */
  onBack?: () => void;
  /** Right-aligned action(s) — destructive Delete, Save shortcut, etc. */
  rightSlot?: ReactNode;
  /** Pin to top on scroll. Default true. */
  sticky?: boolean;
  className?: string;
}

/**
 * Standard chrome for add/edit/detail pages: a 44px circular back affordance
 * on the left, the page title (and optional description) next to it, and an
 * optional right-side slot for actions. Replaces the ad-hoc
 * `<BackButton /> + <h1>` pair used across the form pages.
 *
 * Back-button resolution order: `onBack` → `backHref` (Link) → `router.back()`.
 */
export default function PageHeader({
  title,
  description,
  backHref,
  onBack,
  rightSlot,
  sticky = true,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();

  const wrapperClass = [
    'w-full',
    sticky ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const backButtonClass =
    'flex items-center justify-center w-11 h-11 rounded-full text-foreground hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors shrink-0';

  let backAffordance: ReactNode;
  if (onBack) {
    backAffordance = (
      <button
        type="button"
        onClick={onBack}
        className={backButtonClass}
        aria-label="Go back"
      >
        <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  } else if (backHref) {
    backAffordance = (
      <Link href={backHref} className={backButtonClass} aria-label="Go back">
        <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
      </Link>
    );
  } else {
    backAffordance = (
      <button
        type="button"
        onClick={() => router.back()}
        className={backButtonClass}
        aria-label="Go back"
      >
        <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <header className={wrapperClass}>
      <div className="flex items-start gap-3 px-4 py-3 max-w-2xl mx-auto">
        {backAffordance}
        <div className="min-w-0 flex-1">
          {/* The h-11 row keeps the title vertically centered against the
              44px back-button regardless of the chosen font / line-height,
              and keeps the icon anchored to the title row even when a
              description is rendered below. */}
          <div className="flex items-center min-h-11">
            <h1 className="text-2xl font-bold text-foreground leading-tight truncate">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
        {rightSlot && (
          <div className="ml-auto flex items-center min-h-11 gap-2 shrink-0">
            {rightSlot}
          </div>
        )}
      </div>
    </header>
  );
}
