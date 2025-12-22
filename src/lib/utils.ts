/**
 * Shared utility functions
 * Common helpers used across the application
 */

/**
 * Escape special regex characters in a string
 * Used for safe string matching in search/highlight features
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text into parts for highlighting search matches
 * Returns an array of { text, isMatch } objects for rendering
 */
export function splitTextForHighlight(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  if (!query || !text.toLowerCase().includes(query.toLowerCase())) {
    return [{ text, isMatch: false }];
  }

  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return parts
    .filter(part => part.length > 0)
    .map(part => ({
      text: part,
      isMatch: part.toLowerCase() === query.toLowerCase(),
    }));
}

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Create a class name string from conditionals
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Trigger haptic feedback for touch interactions
 * Uses the Vibration API when available
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!isBrowser() || !('vibrate' in navigator)) return;

  const patterns: Record<typeof style, number> = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // Silently fail if vibration is not allowed
  }
}

/**
 * Format a phone number as user types
 * Formats US numbers as (XXX) XXX-XXXX
 * Returns both formatted display value and raw digits for E.164 conversion
 */
export function formatPhoneNumber(value: string): { formatted: string; digits: string } {
  // Strip all non-digit characters except leading +
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');

  // If it starts with country code (like +1), handle differently
  if (hasPlus && digits.length > 0) {
    // International format - just clean it up
    if (digits.startsWith('1') && digits.length <= 11) {
      // US number with country code
      const areaCode = digits.slice(1, 4);
      const firstPart = digits.slice(4, 7);
      const secondPart = digits.slice(7, 11);

      if (digits.length <= 1) return { formatted: '+1', digits };
      if (digits.length <= 4) return { formatted: `+1 (${areaCode}`, digits };
      if (digits.length <= 7) return { formatted: `+1 (${areaCode}) ${firstPart}`, digits };
      return { formatted: `+1 (${areaCode}) ${firstPart}-${secondPart}`, digits };
    }
    // Other international - just return with +
    return { formatted: `+${digits}`, digits };
  }

  // US format without country code
  const areaCode = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 10);

  if (digits.length === 0) return { formatted: '', digits: '' };
  if (digits.length <= 3) return { formatted: `(${areaCode}`, digits };
  if (digits.length <= 6) return { formatted: `(${areaCode}) ${firstPart}`, digits };
  return { formatted: `(${areaCode}) ${firstPart}-${secondPart}`, digits };
}

/**
 * Convert a phone number to E.164 format for Firebase
 * Assumes US (+1) if no country code provided
 */
export function toE164(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  // Already has country code
  if (phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }

  // Assume US
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already includes country code without +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}
