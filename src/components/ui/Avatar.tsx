/**
 * Avatar component - Tailwind-based UI primitive
 * User profile images with fallback initials
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'rounded-full overflow-hidden flex-shrink-0',
  'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
  'font-semibold uppercase',
].join(' ');

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', initials, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(baseStyles, sizes[size], className)}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

