import { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  icon,
  className = ''
}: SettingsCardProps) {
  return (
    <section aria-label={title} className={`overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <div className="px-8 py-6">
        <div className="flex items-center space-x-4 mb-6">
          {icon && (
            <div className="flex-shrink-0 rounded-[var(--radius-control)] bg-surface-hover p-3 text-primary-500">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div>
          {children}
        </div>
      </div>
    </section>
  );
}
