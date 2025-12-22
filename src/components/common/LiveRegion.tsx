/**
 * LiveRegion component
 * Provides screen reader announcements for dynamic content changes
 * Uses aria-live regions for accessible notifications
 */

import { createContext, useContext, useCallback, useState, useRef, useEffect, type ReactNode } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface LiveRegionContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

interface LiveRegionProviderProps {
  children: ReactNode;
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const clearMessage = () => {
      if (priority === 'assertive') {
        setAssertiveMessage('');
      } else {
        setPoliteMessage('');
      }
    };

    // Clear any existing message first to ensure the new message is announced
    clearMessage();

    // Set new message after a small delay to trigger announcement
    const setTimer = setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
      timeoutsRef.current.delete(setTimer);
    }, 50);
    timeoutsRef.current.add(setTimer);

    // Clear message after it's been announced
    const clearTimer = setTimeout(() => {
      clearMessage();
      timeoutsRef.current.delete(clearTimer);
    }, 1000);
    timeoutsRef.current.add(clearTimer);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Screen reader only live regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

/**
 * Hook to access the announce function for screen reader notifications
 * Note: Co-located with provider for simplicity; Fast Refresh still works but may refresh whole tree
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAnnounce() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useAnnounce must be used within a LiveRegionProvider');
  }
  return context.announce;
}

