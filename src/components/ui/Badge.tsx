/**
 * Badge component - Tailwind-based UI primitive
 * Small status indicators and pills
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'muted';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'min-w-[18px] h-[18px] px-1.5',
  'text-[11px] font-bold text-white',
  'rounded-full',
].join(' ');

const variants = {
  default: 'bg-[var(--color-accent)]',
  primary: 'bg-[var(--color-accent)]',
  success: 'bg-[var(--color-success)]',
  danger: 'bg-[var(--color-danger)]',
  warning: 'bg-[var(--color-warning)] text-[var(--color-text)]',
  muted: 'bg-[var(--color-text-muted)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/** Chip - Larger interactive tag/pill */
export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: ReactNode;
}

const chipBaseStyles = [
  'inline-flex items-center gap-1.5',
  'font-medium whitespace-nowrap',
  'border rounded-full',
  'transition-all duration-150',
].join(' ');

const chipVariants = {
  default: [
    'bg-[var(--color-bg-muted)] border-[var(--color-border)]',
    'text-[var(--color-text-secondary)]',
  ].join(' '),
  primary: 'bg-[var(--color-accent)] border-transparent text-white',
  success: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger)]',
  warning: 'bg-[var(--color-warning-bg)] border-amber-300/30 text-[var(--color-warning)]',
};

const chipSizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'default', size = 'md', interactive, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          chipBaseStyles,
          chipVariants[variant],
          chipSizes[size],
          interactive && [
            'cursor-pointer',
            'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
            'active:scale-[0.96]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Chip.displayName = 'Chip';

