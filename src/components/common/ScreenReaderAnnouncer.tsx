/**
 * ScreenReaderAnnouncer component
 * Provides live region announcements for screen readers
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type Politeness = 'polite' | 'assertive';

interface AnnouncerContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

interface ScreenReaderAnnouncerProps {
  children: ReactNode;
}

export function ScreenReaderAnnouncer({ children }: ScreenReaderAnnouncerProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the message
    if (politeness === 'assertive') {
      setAssertiveMessage(message);
    } else {
      setPoliteMessage(message);
    }

    // Clear after a delay to allow re-announcement of same message
    timeoutRef.current = setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
    }, 1000);
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): (message: string, politeness?: Politeness) => void {
  const context = useContext(AnnouncerContext);
  if (!context) {
    // Return no-op if not in provider
    return () => {};
  }
  return context.announce;
}

/** Hook for common announcements */
export function useAccessibilityAnnouncements() {
  const announce = useAnnounce();

  return {
    announceLoading: (item: string) => announce(`Loading ${item}...`),
    announceLoaded: (item: string) => announce(`${item} loaded`),
    announceError: (message: string) => announce(message, 'assertive'),
    announceSuccess: (message: string) => announce(message),
    announceNavigation: (destination: string) => announce(`Navigated to ${destination}`),
    announceSelection: (item: string) => announce(`${item} selected`),
    announceAction: (action: string) => announce(action),
  };
}

