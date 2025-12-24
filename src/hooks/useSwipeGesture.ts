/**
 * useSwipeGesture hook
 * Detect swipe gestures for mobile navigation
 */

import { useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;  // Minimum distance for swipe
  enabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture<T extends HTMLElement = HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: SwipeConfig) {
  const elementRef = useRef<T>(null);
  const startRef = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !startRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;
    const deltaTime = Date.now() - startRef.current.time;

    // Only count as swipe if completed within 300ms
    if (deltaTime > 300) {
      startRef.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe
    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    startRef.current = null;
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return elementRef;
}

/** Hook for swipe-to-dismiss pattern */
export function useSwipeToDismiss(onDismiss: () => void, direction: 'left' | 'right' | 'down' = 'right') {
  const config: SwipeConfig = { threshold: 80 };
  if (direction === 'left') config.onSwipeLeft = onDismiss;
  if (direction === 'right') config.onSwipeRight = onDismiss;
  if (direction === 'down') config.onSwipeDown = onDismiss;
  return useSwipeGesture(config);
}

