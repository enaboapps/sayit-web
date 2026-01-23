import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[120px] w-full rounded-3xl border border-border',
            'bg-surface shadow-md hover:shadow-lg focus:shadow-xl',
            'px-6 py-3 text-base',
            'text-foreground',
            'placeholder:text-text-tertiary',
            'ring-offset-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'focus-visible:border-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-300',
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
