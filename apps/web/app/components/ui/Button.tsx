import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-3xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
        destructive:
          'bg-error text-white hover:bg-error-hover',
        outline:
          'border border-primary-800 bg-surface text-foreground hover:bg-surface-hover hover:border-primary-600',
        secondary:
          'bg-surface-hover text-foreground hover:bg-primary-950 hover:text-primary-500',
        ghost: 'hover:bg-surface-hover text-foreground hover:text-primary-500',
        link: 'text-foreground underline-offset-4 hover:underline hover:text-primary-500',
      },
      size: {
        // All sizes meet minimum 44px touch target requirement
        default: 'h-11 min-h-[44px] px-6 py-2',
        sm: 'h-10 min-h-[44px] rounded-3xl px-4 text-xs',
        lg: 'h-12 min-h-[48px] rounded-3xl px-10',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonBaseProps = {
  className?: string;
  asChild?: boolean;
} & VariantProps<typeof buttonVariants>;

type ButtonAsChildProps = ButtonBaseProps & React.ComponentPropsWithoutRef<typeof Slot>;
type ButtonAsMotionProps = ButtonBaseProps & Omit<HTMLMotionProps<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd'>;

export type ButtonProps = ButtonAsChildProps | ButtonAsMotionProps;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as ButtonAsChildProps)}
        />
      );
    }

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.2 }}
        ref={ref}
        {...(props as ButtonAsMotionProps)}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
