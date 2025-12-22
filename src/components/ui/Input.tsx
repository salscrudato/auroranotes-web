/**
 * Input component - Tailwind-based UI primitive
 * Clean, accessible input with error states
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const baseStyles = [
  'w-full font-inherit',
  'bg-[var(--color-surface)] text-[var(--color-text)]',
  'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
  'transition-all duration-150',
  'placeholder:text-[var(--color-placeholder)]',
  'hover:border-[var(--color-border-strong)]',
  'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-muted)]',
].join(' ');

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-md)]',
  md: 'h-[52px] px-4 text-base',
  lg: 'h-14 px-5 text-lg rounded-[var(--radius-xl)]',
};

const errorStyles = [
  'border-[var(--color-danger)]',
  'focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20',
].join(' ');

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, inputSize = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(baseStyles, sizes[inputSize], error && errorStyles, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/** Textarea variant */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const textareaBaseStyles = [
  'w-full min-h-[52px] max-h-[200px] resize-none font-inherit',
  'p-3 text-base leading-normal',
  'bg-[var(--color-surface)] text-[var(--color-text)]',
  'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
  'transition-all duration-150',
  'placeholder:text-[var(--color-placeholder)]',
  'hover:border-[var(--color-border-strong)]',
  'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaBaseStyles, error && errorStyles, className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

