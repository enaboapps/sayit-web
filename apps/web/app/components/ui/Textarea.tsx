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
            'flex min-h-[120px] w-full rounded-[var(--radius-control)] border border-border',
            'bg-surface shadow-[var(--shadow-control)] hover:border-text-tertiary',
            'px-4 py-3 text-base',
            'text-foreground',
            'placeholder:text-text-tertiary',
            'ring-offset-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'focus-visible:border-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-[background-color,border-color,box-shadow] duration-[var(--motion-duration-standard)]',
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
