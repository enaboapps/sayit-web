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
    <div className={`bg-surface rounded-xl shadow-sm border border-border overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 text-text-secondary">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}