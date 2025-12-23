/**
 * OfflineBanner component
 * Shows a prominent banner when the user is offline
 */

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 py-2 px-4 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-sm font-medium border-b border-amber-300/30"
      role="alert"
      aria-live="polite"
    >
      <WifiOff size={16} />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
}

