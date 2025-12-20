/**
 * OfflineBanner component
 * Shows a prominent banner when the user is offline
 */

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { FEATURES } from '../../lib/constants';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  // Don't render if feature is disabled or user is online
  if (!FEATURES.ENABLE_OFFLINE_BANNER || isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="alert" aria-live="polite">
      <WifiOff size={16} />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
}

