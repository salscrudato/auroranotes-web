/**
 * VirtualList component
 * Simple virtualized list for rendering large lists efficiently
 * Only renders items that are visible in the viewport
 */

import { useState, useRef, useEffect, useCallback, memo, type ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyState?: ReactNode;
}

interface VisibleRange {
  start: number;
  end: number;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  overscan = 3,
  renderItem,
  keyExtractor,
  className = '',
  emptyState,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 10 });

  const calculateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    setVisibleRange({ start, end });
  }, [items.length, itemHeight, overscan]);

  // Calculate initial visible range and on resize
  useEffect(() => {
    calculateVisibleRange();
    
    const resizeObserver = new ResizeObserver(calculateVisibleRange);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [calculateVisibleRange]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    requestAnimationFrame(calculateVisibleRange);
  }, [calculateVisibleRange]);

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  const totalHeight = items.length * itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      onScroll={handleScroll}
      style={{ overflow: 'auto', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memo wrapper that preserves generic type
export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
