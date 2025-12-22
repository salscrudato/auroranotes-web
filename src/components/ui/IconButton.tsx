/**
 * IconButton component - Tailwind-based UI primitive
 * Minimal icon-only button for toolbars and actions
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'rounded-[var(--radius-md)] cursor-pointer',
  'transition-all duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'active:scale-95',
].join(' ');

const variants = {
  default: [
    'bg-[var(--color-surface)] border border-[var(--color-border)]',
    'text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
    'hover:text-[var(--color-text)]',
  ].join(' '),
  ghost: [
    'bg-transparent border-transparent',
    'text-[var(--color-text-tertiary)]',
    'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
  ].join(' '),
  danger: [
    'bg-transparent border-transparent',
    'text-[var(--color-text-tertiary)]',
    'hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)]',
  ].join(' '),
};

const sizes = {
  sm: 'w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5',
  md: 'w-9 h-9 [&>svg]:w-[18px] [&>svg]:h-[18px]',
  lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

