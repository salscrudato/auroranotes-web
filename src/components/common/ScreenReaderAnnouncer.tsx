/**
 * Screen reader announcements provider.
 *
 * @deprecated Use LiveRegionProvider from ./LiveRegion.tsx instead.
 * This component is kept for backwards compatibility but is not used.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
  type ReactNode,
} from 'react';

export type Politeness = 'polite' | 'assertive';

interface AnnouncerContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

const CLEAR_DELAY_MS = 1000;

interface ScreenReaderAnnouncerProps {
  children: ReactNode;
}

export function ScreenReaderAnnouncer({ children }: ScreenReaderAnnouncerProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const setMessage = politeness === 'assertive' ? setAssertiveMessage : setPoliteMessage;
    setMessage(message);

    timeoutRef.current = setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
    }, CLEAR_DELAY_MS);
  }, []);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}
      <AnnouncerRegions politeMessage={politeMessage} assertiveMessage={assertiveMessage} />
    </AnnouncerContext.Provider>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface AnnouncerRegionsProps {
  politeMessage: string;
  assertiveMessage: string;
}

const AnnouncerRegions = memo(function AnnouncerRegions({
  politeMessage,
  assertiveMessage,
}: AnnouncerRegionsProps) {
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>
    </>
  );
});

// ============================================================================
// Hooks
// ============================================================================

/**
 * @deprecated Use useAnnounce from ./LiveRegion.tsx instead.
 */
export function useAnnounce(): (message: string, politeness?: Politeness) => void {
  const context = useContext(AnnouncerContext);
  if (!context) {
    return () => {};
  }
  return context.announce;
}

/**
 * Convenience hook for common accessibility announcements.
 * @deprecated Use useAnnounce from ./LiveRegion.tsx directly.
 */
export function useAccessibilityAnnouncements() {
  const announce = useAnnounce();

  return useMemo(
    () => ({
      announceLoading: (item: string) => announce(`Loading ${item}...`),
      announceLoaded: (item: string) => announce(`${item} loaded`),
      announceError: (message: string) => announce(message, 'assertive'),
      announceSuccess: (message: string) => announce(message),
      announceNavigation: (destination: string) => announce(`Navigated to ${destination}`),
      announceSelection: (item: string) => announce(`${item} selected`),
      announceAction: (action: string) => announce(action),
    }),
    [announce]
  );
}
