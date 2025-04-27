import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-black text-white shadow hover:bg-gray-900',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700',
        outline:
          'border border-black bg-white text-black shadow-sm hover:bg-gray-100',
        secondary:
          'bg-gray-200 text-black shadow-sm hover:bg-gray-300',
        ghost: 'hover:bg-gray-100 text-black',
        link: 'text-black underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
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
        whileTap={{ scale: 0.95 }}
        ref={ref}
        {...(props as ButtonAsMotionProps)}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants }; 