/**
 * Button component - Tailwind-based UI primitive
 * Clean, accessible button with multiple variants and sizes
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'ai';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center gap-2',
  'font-medium cursor-pointer whitespace-nowrap select-none',
  'transition-all duration-150 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'active:scale-[0.98]',
].join(' ');

const variants = {
  default: [
    'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]',
    'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
  ].join(' '),
  primary: [
    'bg-[var(--color-accent)] border border-transparent text-white',
    'hover:bg-[var(--color-accent-hover)]',
  ].join(' '),
  ghost: [
    'bg-transparent border border-transparent text-[var(--color-text)]',
    'hover:bg-[var(--color-surface-hover)]',
  ].join(' '),
  danger: [
    'bg-transparent border border-[var(--color-border)] text-[var(--color-danger)]',
    'hover:bg-[var(--color-danger-bg)] hover:border-[var(--color-danger-border)]',
  ].join(' '),
  ai: [
    'bg-gradient-to-br from-[#5B5FE7] to-[#7C3AED] border border-transparent text-white',
    'hover:opacity-90',
  ].join(' '),
};

const sizes = {
  xs: 'h-[26px] px-2.5 text-xs rounded-[var(--radius-sm)]',
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base rounded-[var(--radius-lg)]',
  icon: 'h-9 w-9 min-w-[36px] rounded-[var(--radius-md)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
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

Button.displayName = 'Button';

