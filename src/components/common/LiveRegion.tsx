/**
 * Screen reader announcements via aria-live regions.
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
  type ReactNode,
} from 'react';

export type AnnouncePriority = 'polite' | 'assertive';

interface LiveRegionContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

/** Timing constants */
const ANNOUNCE_DELAY_MS = 50;
const CLEAR_DELAY_MS = 1000;

interface LiveRegionProviderProps {
  children: ReactNode;
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const setMessage = priority === 'assertive' ? setAssertiveMessage : setPoliteMessage;

    // Clear first to ensure re-announcement
    setMessage('');

    // Set new message after delay
    const setTimer = setTimeout(() => {
      setMessage(message);
      timeoutsRef.current.delete(setTimer);
    }, ANNOUNCE_DELAY_MS);
    timeoutsRef.current.add(setTimer);

    // Clear after announcement
    const clearTimer = setTimeout(() => {
      setMessage('');
      timeoutsRef.current.delete(clearTimer);
    }, CLEAR_DELAY_MS);
    timeoutsRef.current.add(clearTimer);
  }, []);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  return (
    <LiveRegionContext.Provider value={contextValue}>
      {children}
      <LiveRegionAnnouncer politeMessage={politeMessage} assertiveMessage={assertiveMessage} />
    </LiveRegionContext.Provider>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface LiveRegionAnnouncerProps {
  politeMessage: string;
  assertiveMessage: string;
}

const LiveRegionAnnouncer = memo(function LiveRegionAnnouncer({
  politeMessage,
  assertiveMessage,
}: LiveRegionAnnouncerProps) {
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="alert">
        {assertiveMessage}
      </div>
    </>
  );
});

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the announce function for screen reader notifications
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAnnounce(): LiveRegionContextValue['announce'] {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useAnnounce must be used within a LiveRegionProvider');
  }
  return context.announce;
}
