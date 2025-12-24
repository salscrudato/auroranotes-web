/**
 * Button component - Tailwind-based UI primitive
 * Clean, accessible button with multiple variants and sizes
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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
};

const sizeStyles = 'h-10 px-4 text-sm rounded-[var(--radius-md)]';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizeStyles, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

