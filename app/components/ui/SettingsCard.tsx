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
    <div className={`bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300 ${className}`}>
      <div className="px-8 py-6">
        <div className="flex items-center space-x-4 mb-6">
          {icon && (
            <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-3xl">
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
    </div>
  );
}