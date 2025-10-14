import { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ 
  title, 
  description, 
  children, 
  className = '' 
}: SettingsSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}