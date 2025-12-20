/**
 * Hook for determining if virtualization should be used
 * Based on item count threshold
 */
export function useVirtualization(itemCount: number, threshold = 50): boolean {
  return itemCount > threshold;
}

