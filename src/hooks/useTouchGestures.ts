/**
 * useTouchGestures hook
 * Provides Apple-style touch gesture detection for mobile interactions
 * Supports long-press, swipe detection, and haptic feedback
 */

import { useCallback, useRef, useState } from 'react';
import { triggerHaptic } from '../lib/utils';

interface TouchGestureOptions {
  /** Duration in ms to trigger long press (default: 500) */
  longPressDelay?: number;
  /** Minimum swipe distance in px (default: 50) */
  swipeThreshold?: number;
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
  /** Callback when long press starts */
  onLongPressStart?: () => void;
  /** Callback when long press ends */
  onLongPressEnd?: () => void;
  /** Callback for swipe left */
  onSwipeLeft?: () => void;
  /** Callback for swipe right */
  onSwipeRight?: () => void;
}

interface TouchGestureResult {
  /** Whether currently in long press state */
  isLongPressing: boolean;
  /** Touch event handlers to spread on the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
  };
}

export function useTouchGestures({
  longPressDelay = 500,
  swipeThreshold = 50,
  hapticFeedback = true,
  onLongPressStart,
  onLongPressEnd,
  onSwipeLeft,
  onSwipeRight,
}: TouchGestureOptions = {}): TouchGestureResult {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPressing) {
      setIsLongPressing(false);
      onLongPressEnd?.();
    }
  }, [isLongPressing, onLongPressEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMovedRef.current = false;

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        setIsLongPressing(true);
        if (hapticFeedback) {
          triggerHaptic('medium');
        }
        onLongPressStart?.();
      }
    }, longPressDelay);
  }, [longPressDelay, hapticFeedback, onLongPressStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // If moved more than 10px, cancel long press
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      hasMovedRef.current = true;
      cancelLongPress();
    }
  }, [cancelLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    cancelLongPress();

    if (!touchStartPos.current || hasMovedRef.current) {
      touchStartPos.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // Detect horizontal swipe (must be more horizontal than vertical)
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && onSwipeLeft) {
        if (hapticFeedback) triggerHaptic('light');
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        if (hapticFeedback) triggerHaptic('light');
        onSwipeRight();
      }
    }

    touchStartPos.current = null;
  }, [cancelLongPress, swipeThreshold, hapticFeedback, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    cancelLongPress();
    touchStartPos.current = null;
    hasMovedRef.current = false;
  }, [cancelLongPress]);

  return {
    isLongPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}

