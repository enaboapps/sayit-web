import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-3xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700',
        destructive:
          'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
        outline:
          'border border-border bg-surface text-foreground hover:bg-surface-hover hover:border-primary-500/50',
        secondary:
          'bg-surface-hover text-foreground hover:bg-primary-500/10 hover:text-primary-500',
        ghost: 'hover:bg-surface-hover text-foreground hover:text-primary-500',
        link: 'text-foreground underline-offset-4 hover:underline hover:text-primary-500',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 rounded-3xl px-4 text-xs',
        lg: 'h-12 rounded-3xl px-10',
        icon: 'h-10 w-10',
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

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        ref={ref}
        {...(props as ButtonAsMotionProps)}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
