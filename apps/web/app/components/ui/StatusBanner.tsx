import type { ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export type StatusBannerVariant = 'error' | 'warning' | 'success' | 'info';

interface StatusBannerProps {
  variant: StatusBannerVariant;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  live?: 'polite' | 'assertive' | 'off';
  className?: string;
}

const VARIANTS = {
  error: {
    icon: ExclamationCircleIcon,
    classes: 'border-red-500/50 bg-status-error text-status-error-foreground',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    classes: 'border-amber-500/50 bg-status-warning text-status-warning-foreground',
  },
  success: {
    icon: CheckCircleIcon,
    classes: 'border-green-500/50 bg-status-success text-status-success-foreground',
  },
  info: {
    icon: InformationCircleIcon,
    classes: 'border-blue-500/50 bg-status-info text-status-info-foreground',
  },
} as const;

export default function StatusBanner({
  variant,
  title,
  children,
  action,
  live = 'polite',
  className = '',
}: StatusBannerProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div
      className={`flex shrink-0 items-start gap-3 border-b px-4 py-3 ${config.classes} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={live}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-sm text-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
