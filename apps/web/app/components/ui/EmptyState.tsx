import type { ReactNode } from 'react';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <section className={`mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center ${className}`} aria-label={title}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-surface)] text-[var(--accent-foreground)]">
        {icon ?? <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />}
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
