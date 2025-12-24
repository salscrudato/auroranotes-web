/**
 * Banner displayed when the user loses network connectivity.
 */

import { memo } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const BANNER_CLASSES = cn(
  'fixed top-0 left-0 right-0 z-[1000]',
  'flex items-center justify-center gap-2 py-2 px-4',
  'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  'text-sm font-medium border-b border-amber-300/30'
);

export const OfflineBanner = memo(function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={BANNER_CLASSES} role="alert" aria-live="polite">
      <WifiOff size={16} />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
});
